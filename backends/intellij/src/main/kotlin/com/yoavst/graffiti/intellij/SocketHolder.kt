package com.yoavst.graffiti.intellij

import com.google.gson.Gson
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import java.io.IOException
import java.net.Socket
import java.nio.ByteBuffer
import java.nio.ByteOrder

object SocketHolder {
    var socket: Socket? = null

    fun connect(address: String, port: Int): Boolean {
        socket?.close()
        socket = null
        return try {
            socket = Socket(address, port)
            true
        } catch (e: IOException) {
            e.printStackTrace()
            false
        }
    }
    fun sendJson(project: Project, data: Any) {
        val socket = socket ?: run {
            project.notify("Graffiti: Not connected to server", NotificationType.ERROR)
            return
        }
        socket.getOutputStream().buffered().let { stream ->
            val json = Gson().toJson(data)
            // write length
            stream.write(ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(json.length).array())
            // write data
            stream.write(json.toByteArray())
            stream.flush()
        }
    }
}