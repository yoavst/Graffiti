package com.yoavst.graffiti.jadx

import com.google.gson.Gson
import com.google.gson.JsonParser
import jadx.api.metadata.ICodeNodeRef
import jadx.api.plugins.JadxPlugin
import jadx.api.plugins.JadxPluginContext
import jadx.api.plugins.JadxPluginInfo
import jadx.api.plugins.JadxPluginInfoBuilder
import jadx.core.dex.nodes.FieldNode
import jadx.core.dex.nodes.MethodNode
import java.io.DataInputStream
import java.net.Socket
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.logging.Logger
import javax.swing.JOptionPane
import kotlin.concurrent.thread

class GraffitiPlugin : JadxPlugin {
    private val log = Logger.getLogger(GraffitiPlugin::class.simpleName)
    private val options = EmptyOptions()
    private var socket: Socket? = null
    private lateinit var jadx: JadxPluginContext

    override fun getPluginInfo(): JadxPluginInfo = JadxPluginInfoBuilder.pluginId(PLUGIN_ID)
        .name("Graffiti plugin")
        .description("Create customized callgraph directly from your Jadx")
        .homepage("https://github.com/yoavst/graffiti")
        .build()

    override fun init(context: JadxPluginContext) {
        jadx = context
        context.registerOptions(options)
        context.guiContext?.apply {
            addPopupMenuAction(
                "Graffiti: Add to graph (a)",
                { true },
                "A",
                ::addToGraph,
            )

            addPopupMenuAction(
                "Graffiti: Add xrefs to graph (q)",
                { true },
                "Q",
                ::addXrefsToGraph,
            )

            addMenuAction("Graffiti: Connect to server", ::connectToServer)
        }
    }

    private fun projectName() = jadx.decompiler.args.inputFiles.firstOrNull { it.extension != "kts" }?.name ?: ""

    private fun connectToServer() {
        socket?.close()
        socket = null

        val defaultServer = getLastConnectedServer() ?: "localhost:8501"

        val addressAndPort = JOptionPane.showInputDialog("What is the address of the grafiti server?", defaultServer)
        if (addressAndPort.isNullOrEmpty())
            return

        val (addr, port) = addressAndPort.split(":")

        socket = Socket(addr, port.toInt())
        saveLastConnectedServerToFile("$addr:$port")

        thread(start = true, isDaemon = true) {
            threadCode()
        }
    }

    private fun threadCode() {
        log.info { "Graffiti: Background thread is running" }
        try {
            socket?.use { sock ->
                val dataInputStream = DataInputStream(sock.getInputStream())

                while (socket != null) {
                    // readInt is bigEndian
                    val length = dataInputStream.readInt()
                    val rawData = String(ByteArray(length).also(dataInputStream::readFully))
                    log.info { "Received data from socket: $rawData" }

                    if (rawData.isEmpty())
                        break
                    val data = JsonParser.parseString(rawData).asJsonObject
                    if (data.has("type") && data["type"].asString == "auth_req_v1") {
                        log.info { "Received auth request" }
                        jadx.guiContext!!.uiRun {
                            val token = getTokenOrElse {
                                val userToken =
                                    JOptionPane.showInputDialog("Enter the UUID token from graffiti website", "")
                                if (userToken.isNullOrEmpty()) null else userToken
                            }
                            if (token != null) {
                                sendUpdate(mapOf("type" to "auth_resp_v1", "token" to token))
                            } else {
                                socket = null
                            }
                        }
                        continue
                    }
                    if (data.has("project")) {
                        if (!data["project"].asString.startsWith("Jadx:")) {
                            continue
                        }
                    }

                    jadx.guiContext!!.uiRun {
                        threadCodeForUi(data["address"].asString)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun threadCodeForUi(target: String) {
        val (type, clazz, sub) = target.split('|')
        val isMethod = (type == "1")

        val classInstance = jadx.decompiler.searchClassNodeByOrigFullName(clazz) ?: run {
            log.warning { "Class not found: $target" }
            return
        }
        val node =
            (if (isMethod) {
                classInstance.searchMethodByShortId(sub)
            } else {
                classInstance.searchFieldByShortId(sub)
            }) ?: run {
                log.warning { "${if (isMethod) "Method" else "Field"} not found: $target" }
                return
            }

        jadx.guiContext!!.open(node)
    }

    private fun addToGraph(node: ICodeNodeRef) {
        log.fine { "Graffiti action called on $node" }
        if (socket == null) {
            JOptionPane.showMessageDialog(
                null, "Not connected to graffiti server", "Graffiti error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }

        val enclosing = jadx.guiContext!!.enclosingNodeUnderCaret ?: run {
            log.info { "Graffiti: No enclosing node, aborting." }
            return
        }

        // We support either a field or a method
        // If enclosing is a method - we activated the keybinding inside a method, so we want the method
        // If enclosing is the class, so we've activated the keybinding on a field decl.
        val target = if (enclosing is MethodNode) enclosing else node

        val update = createUpdate(target, projectName()) ?: return
        sendUpdate(update)
    }

    private fun addXrefsToGraph(node: ICodeNodeRef) {
        log.fine { "Graffiti xrefs action called on $node" }
        if (socket == null) {
            JOptionPane.showMessageDialog(
                null, "Not connected to graffiti server", "Graffiti error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }

        val enclosing = jadx.guiContext!!.enclosingNodeUnderCaret ?: run {
            log.info { "Graffiti: No enclosing node, aborting." }
            return
        }

        // We support either a field or a method
        // If enclosing is a method - we activated the keybinding inside a method, so we want the method
        // If enclosing is the class, so we've activated the keybinding on a field decl.
        val target = if (enclosing is MethodNode) enclosing else node

        val xrefs = when (target) {
            is MethodNode -> target.useIn
            is FieldNode -> target.useIn
            else -> return
        }.distinctBy { it.methodInfo.shortId }

        if (xrefs.isEmpty()) return

        val update = mapOf(
            "type" to "addDataBulk",
            "direction" to "n2e",
            "nodes" to xrefs.mapNotNull { createUpdate(it, projectName()) }.map { it["node"] })
        sendUpdate(update)
    }


    private fun sendUpdate(data: Any) {
        val socket = socket ?: run {
            JOptionPane.showMessageDialog(
                null,
                "Not connected to graffiti server",
                "Graffiti error",
                JOptionPane.ERROR_MESSAGE
            )
            return
        }

        val json: String = Gson().toJson(data)
        log.fine { "Sending to graffiti: $json" }
        val message = json.toByteArray()

        socket.getOutputStream().buffered().let { writer ->
            writer.write(ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(message.size).array())
            writer.write(message)
            writer.flush()
        }
    }


    companion object {
        const val PLUGIN_ID: String = "graffiti-plugin"
    }
}


