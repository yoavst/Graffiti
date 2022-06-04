package com.yoavst.graffiti.intellij

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.vfs.LocalFileSystem
import java.net.Socket
import kotlin.concurrent.thread
import com.intellij.openapi.diagnostic.Logger;


class EnableGraffitiSyncAction : AnAction() {
    private val logger = Logger.getInstance(EnableGraffitiSyncAction::class.java)

    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = event.project != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        val (address, port) = getAddressAndPort(e.project!!)
        thread(start = true, isDaemon = true) {
            threadCode(e.project!!, address, port)
        }

    }

    private fun threadCode(project: Project, address: String, port: Int) {
        logger.info("Background thread is running")
        try {
            Socket(address, port).use { sock ->
                val stream = sock.getInputStream().bufferedReader()
                while (true) {
                    val line = stream.readLine()
                    logger.info("Received line from socket: $line")
                    if (line.isNullOrEmpty())
                        break
                    ApplicationManager.getApplication().invokeLater { threadCodeForUi(project, line) }
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
            "Input", Messages.getQuestionIcon(), "localhost:8763", null
        ) ?: "localhost:8763"
        return addressAndPort.split(":").let { (address, port) -> address to port.toInt() }
    }
}