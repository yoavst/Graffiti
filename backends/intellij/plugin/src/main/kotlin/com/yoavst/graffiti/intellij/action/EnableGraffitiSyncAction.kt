package com.yoavst.graffiti.intellij.action

import com.google.gson.JsonParser
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.guessProjectDir
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.LocalFileSystem
import com.yoavst.graffiti.intellij.SocketHolder
import com.yoavst.graffiti.intellij.getOffset
import com.yoavst.graffiti.intellij.getTokenOrElse
import com.yoavst.graffiti.intellij.notify
import java.io.DataInputStream
import java.io.File
import kotlin.concurrent.thread


class EnableGraffitiSyncAction : AnAction() {
    private val logger = Logger.getInstance(EnableGraffitiSyncAction::class.java)

    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = event.project != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        val (address, port) = getAddressAndPort(e.project!!)

        if (SocketHolder.connect(address, port)) {
            e.project!!.notify("Connected to graffiti at $address:$port (might require authentication if enabled on server)", NotificationType.INFORMATION)
            thread(start = true, isDaemon = true) {
                threadCode(e.project!!)
            }
        } else {
            e.project!!.notify("Failed to connect to graffiti", NotificationType.ERROR)
        }
    }

    private fun threadCode(project: Project) {
        logger.info("Background thread is running")
        try {
            SocketHolder.socket?.use { sock ->
                val dataInputStream = DataInputStream(sock.getInputStream())

                while(true) {
                    // readInt is bigEndian
                    val length = dataInputStream.readInt()
                    val rawData = String(ByteArray(length).also(dataInputStream::readFully))
                    logger.debug("Received data from socket: $rawData")

                    if (rawData.isEmpty())
                        break
                    val data = JsonParser.parseString(rawData).asJsonObject

                    if (data.has("type") && data["type"].asString == "auth_req_v1") {
                        logger.info("Received auth request")
                        ApplicationManager.getApplication().invokeLater {
                            val token = getTokenOrElse {
                                val userToken = Messages.showInputDialog(
                                    project, "Enter the UUID token from graffiti website",
                                    "Graffiti Authentication", Messages.getQuestionIcon(), "", null
                                )
                                if (userToken.isNullOrEmpty()) null else userToken
                            }
                            if (token != null) {
                                SocketHolder.sendJson(project, mapOf("type" to "auth_resp_v1", "token" to token))
                            } else {
                                SocketHolder.socket?.close()
                                SocketHolder.socket = null
                            }
                        }
                        continue
                    }

                    if (data.has("project")) {
                        if (data["project"].asString.startsWith("VSCode:")) {
                            ApplicationManager.getApplication().invokeLater { threadCodeForVscodeUi(project, data["address"].asString) }
                            continue
                        }
                        if (!data["project"].asString.startsWith("Intellij:")) {
                            continue
                        }
                    }
                    ApplicationManager.getApplication().invokeLater { threadCodeForUi(project, data["address"].asString) }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            project.notify("Disconnected from graffiti", NotificationType.ERROR)
        }
    }

    private fun threadCodeForUi(project: Project, target: String) {
        val (file, offset) = target.split("@")
        var fileObj = File(file)
        if (!fileObj.isAbsolute) {
            fileObj = File(project.guessProjectDir()!!.path, fileObj.path)
        }
        val vFile = LocalFileSystem.getInstance().findFileByPath(fileObj.canonicalPath) ?: return
        OpenFileDescriptor(project, vFile, offset.toInt()).navigate(true)
    }

    private fun threadCodeForVscodeUi(project: Project, target: String) {
        val (file, lineStr) = target.split(":")
        val line = lineStr.toInt()
        var fileObj = File(file)
        if (!fileObj.isAbsolute) {
            fileObj = File(project.guessProjectDir()!!.path, fileObj.path)
        }
        val vFile = LocalFileSystem.getInstance().findFileByPath(fileObj.canonicalPath) ?: return
        OpenFileDescriptor(project, vFile, getOffset(fileObj.readText(), line)).navigate(true)
    }

    private fun getAddressAndPort(project: Project): Pair<String, Int> {
        val addressAndPort = Messages.showInputDialog(
            project, "Enter address and port for connection",
            "Input", Messages.getQuestionIcon(), "localhost:8501", null
        ) ?: "localhost:8501"
        return addressAndPort.split(":").let { (address, port) -> address to port.toInt() }
    }
}