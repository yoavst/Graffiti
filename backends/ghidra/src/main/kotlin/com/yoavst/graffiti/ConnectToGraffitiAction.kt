package com.yoavst.graffiti

import com.google.gson.JsonParser
import docking.ActionContext
import docking.action.DockingAction
import docking.action.MenuData
import ghidra.app.services.GoToService
import ghidra.plugins.fsbrowser.ImageManager
import ghidra.util.Msg
import ghidra.util.exception.CancelledException
import java.io.DataInputStream
import javax.swing.SwingUtilities
import kotlin.concurrent.thread

class ConnectToGraffitiAction(private val plugin: GraffitiPlugin) : DockingAction(ACTION, GraffitiPlugin.PLUGIN_NAME) {
    init {
        isEnabled = true
        menuBarData = MenuData(arrayOf("Tools", ACTION), ImageManager.IMPORT, GraffitiPlugin.GRAFFITI_GROUP)
        description = "Connect to graffiti server"
    }

    override fun actionPerformed(actionContext: ActionContext) {
        val (address, port) = getAddressAndPort() ?: return
        if (SocketHolder.connect(address, port)) {
            saveLastConnectedServerToFile("$address:$port")
            GraffitiPlugin.ghidraScriptHelper.popup("Connected to graffiti at $address:$port (might require authentication if enabled on server)")
            thread(start = true, isDaemon = true) {
                threadCode()
            }
        } else {
            GraffitiPlugin.ghidraScriptHelper.popup("Failed to connect to graffiti")
        }
    }

    private fun threadCode() {
        Msg.info("Graffiti", "Background thread is running")
        try {
            SocketHolder.socket?.use { sock ->
                val dataInputStream = DataInputStream(sock.getInputStream())

                while (true) {
                    // readInt is bigEndian
                    val length = dataInputStream.readInt()
                    val rawData = String(ByteArray(length).also(dataInputStream::readFully))
                    Msg.debug("Graffiti", "Received data from socket: $rawData")

                    if (rawData.isEmpty())
                        break
                    val data = JsonParser.parseString(rawData).asJsonObject

                    if (data.has("type") && data["type"].asString == "auth_req_v1") {
                        Msg.info("Graffiti", "Received auth request")
                        SwingUtilities.invokeLater {
                            val token = getTokenOrElse {
                                try {
                                    GraffitiPlugin.ghidraScriptHelper.askString(
                                        "Graffiti Authentication",
                                        "Enter the UUID token from graffiti website",
                                        ""
                                    ).takeIf { !it.isNullOrEmpty() }
                                } catch (_: CancelledException) {
                                    null
                                }
                            }
                            if (token != null) {
                                SocketHolder.sendJson(mapOf("type" to "auth_resp_v1", "token" to token))
                            } else {
                                SocketHolder.socket?.close()
                                SocketHolder.socket = null
                            }
                        }
                        continue
                    }

                    if (data.has("project")) {
                        if (!data["project"].asString.startsWith("Ghidra:")) {
                            continue
                        }
                    }
                    SwingUtilities.invokeLater {
                        threadCodeForUi(data["address"].asString)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            GraffitiPlugin.ghidraScriptHelper.popup("Disconnected from graffiti")
        }
    }

    private fun threadCodeForUi(target: String) {
        // Copied from goTo and parseAddress implementation
        val address = plugin.currentProgram?.addressFactory?.getAddress(target) ?: return
        plugin.tool.getService(GoToService::class.java)?.goTo(address)
    }

    private fun getAddressAndPort(): Pair<String, Int>? {
        val server = getLastConnectedServer() ?: "localhost:8501"
        return try {
            val addressAndPort = GraffitiPlugin.ghidraScriptHelper.askString(
                "Graffiti",
                "Enter address and port for connection",
                server
            ).trim()
            addressAndPort.split(":").let { (address, port) -> address to port.toInt() }
        } catch (_: CancelledException) {
            null
        }
    }
}

private const val ACTION = "Connect to Graffiti"