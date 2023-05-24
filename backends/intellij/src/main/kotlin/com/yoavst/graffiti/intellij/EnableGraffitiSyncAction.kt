package com.yoavst.graffiti.intellij

import com.google.gson.JsonParser
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.LocalFileSystem
import java.net.Socket
import java.io.DataInputStream
import kotlin.concurrent.thread
import com.intellij.openapi.diagnostic.Logger;


class EnableGraffitiSyncAction : AnAction() {
    private val logger = Logger.getInstance(EnableGraffitiSyncAction::class.java)

    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = event.project != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        val (address, port) = getAddressAndPort(e.project!!)

        val old = SocketHolder.socket
        SocketHolder.socket = null
        old?.close()
        SocketHolder.socket = Socket(address, port)

        thread(start = true, isDaemon = true) {
            threadCode(e.project!!)
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
                    logger.info("Received data from socket: $rawData")

                    if (rawData.isEmpty())
                        break
                    val data = JsonParser.parseString(rawData).asJsonObject
                    if (data.has("project")) {
                        if (!data["project"].asString.startsWith("Intellij:")) {
                            continue
                        }
                    }
                    ApplicationManager.getApplication().invokeLater { threadCodeForUi(project, data["address"].asString) }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun threadCodeForUi(project: Project, target: String) {
        val (file, line) = target.split("@")
        val vFile = LocalFileSystem.getInstance().findFileByPath(file) ?: return
        OpenFileDescriptor(project, vFile, line.toInt()).navigate(true)
    }

    private fun getAddressAndPort(project: Project): Pair<String, Int> {
        val addressAndPort = Messages.showInputDialog(
            project, "Enter address and port for connection",
            "Input", Messages.getQuestionIcon(), "localhost:8501", null
        ) ?: "localhost:8501"
        return addressAndPort.split(":").let { (address, port) -> address to port.toInt() }
    }
}