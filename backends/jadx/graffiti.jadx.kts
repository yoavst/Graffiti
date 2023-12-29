import com.google.gson.Gson
import com.google.gson.JsonParser
import java.nio.ByteBuffer
import java.nio.ByteOrder
import jadx.api.metadata.ICodeNodeRef
import jadx.api.plugins.events.JadxEvents
import jadx.core.dex.nodes.ClassNode
import jadx.core.dex.nodes.FieldNode
import jadx.core.dex.nodes.MethodNode
import java.io.DataInputStream
import java.lang.IllegalArgumentException
import java.net.Socket
import javax.swing.JOptionPane
import kotlin.concurrent.thread

var socket: Socket? = null

val jadx = getJadxInstance()
jadx.gui.ifAvailable {
	addPopupMenuAction(
		"Graffiti: Add to graph (a)",
		enabled = { true },
		keyBinding = "A",
		action = ::addToGraph,
	)

	addMenuAction("Graffiti: Connect to server", ::connectToServer)
}

jadx.events.addListener(JadxEvents.NODE_RENAMED_BY_USER) { rename ->
	rename.node.let { renamedNode ->
		if (renamedNode is ClassNode) {
			sendUpdate(
				mutableMapOf(
					"type" to "updateNodes",
					"selection" to arrayOf(arrayOf("classAddress", renamedNode.classInfo.fullName)),
					"update" to mutableMapOf("class" to rename.newName)
				)
			)
		} else {
			val update = when (rename.node) {
				is FieldNode -> mutableMapOf(
					"field" to rename.newName
				)

				is MethodNode -> mutableMapOf(
					"method" to rename.newName
				)

				else -> return@addListener
			}

			sendUpdate(
				mutableMapOf(
					"type" to "updateNodes",
					"selection" to arrayOf(arrayOf("address", rename.node.toAddress())),
					"update" to update
				)
			)
		}
	}
	log.info { "Rename from '${rename.oldName}' to '${rename.newName}' for node ${rename.node}" }
}

//region Pull
fun connectToServer() {
	socket?.close()
	socket = null

	val addressAndPort = JOptionPane.showInputDialog("What is the address of the grafiti server?", "localhost:8501")
	if (addressAndPort.isNullOrEmpty())
		return

	val (addr, port) = addressAndPort.split(":")

	socket = Socket(addr, port.toInt())

	thread(start = true, isDaemon = true) {
		threadCode()
	}
}

fun threadCode() {
	jadx.log.info { "Graffiti: Background thread is running" }
	try {
		socket?.use { sock ->
			val dataInputStream = DataInputStream(sock.getInputStream())

			while (true) {
				// readInt is bigEndian
				val length = dataInputStream.readInt()
				val rawData = String(ByteArray(length).also(dataInputStream::readFully))
				jadx.log.info { "Received data from socket: $rawData" }

				if (rawData.isEmpty())
					break
				val data = JsonParser.parseString(rawData).asJsonObject
				if (data.has("project")) {
					if (!data["project"].asString.startsWith("Jadx:")) {
						continue
					}
				}

				jadx.gui.ui {
					threadCodeForUi(data["address"].asString)
				}
			}
		}
	} catch (e: Exception) {
		e.printStackTrace()
	}
}

fun threadCodeForUi(target: String) {
	val (type, clazz, sub) = target.split('|')
	val isMethod = (type == "1")
	val classInstance = jadx.search.classByFullName(clazz) ?: run {
		jadx.log.warn { "Class not found: $target" }
		return
	}
	val node =
		(if (isMethod) {
			classInstance.searchMethodByShortId(sub)
		} else {
			classInstance.searchFieldByShortId(sub)
		}) ?: run {
			jadx.log.warn { "${if (isMethod) "Method" else "Field"} not found: $target" }
			return
		}

	jadx.gui.open(node)
}
//endregion


fun addToGraph(node: ICodeNodeRef) {
	log.debug { "Graffiti action called on $node" }
	if (socket == null) {
		JOptionPane.showMessageDialog(
			null, "Not connected to graffiti server", "Graffiti error",
			JOptionPane.ERROR_MESSAGE
		)
		return
	}

	val enclosing = jadx.gui.enclosingNodeUnderCaret ?: run {
		jadx.log.info { "Graffiti: No enclosing node, aborting." }
		return
	}

	// We support either a field or a method
	// If enclosing is a method - we activated the keybinding inside a method, so we want the method
	// If enclosing is the class, so we've activated the keybinding on a field decl.
	val target = if (enclosing is MethodNode) enclosing else node

	val update = createUpdate(target) ?: return
	sendUpdate(update)
}

//region Create update json

fun ICodeNodeRef.toAddress(): String {
	return when (this) {
		is MethodNode -> "1|${parentClass.classInfo.fullName}|${methodInfo.shortId}"
		is FieldNode -> "2|${parentClass.classInfo.fullName}|${fieldInfo.shortId}"
		else -> throw IllegalArgumentException("Should not be called with a node that is not a method nor field")
	}
}

fun createUpdate(node: ICodeNodeRef): Map<String, Any>? {
	val projectName = jadx.internalDecompiler.args.inputFiles.firstOrNull { it.extension != "kts" }?.name ?: ""
	return when (node) {
		is MethodNode -> {
			val methodName = if (node.isConstructor) "\$init" else node.alias
			val classAddress = node.parentClass.fullName

			createMethodUpdate(
				projectName = projectName,
				className = node.parentClass.alias,
				methodName = methodName,
				classAddress = classAddress,
				address = node.toAddress()
			)
		}

		is FieldNode -> {
			val classAddress = node.parentClass.fullName

			createFieldUpdate(
				projectName = projectName,
				className = node.parentClass.alias,
				fieldName = node.alias,
				classAddress = classAddress,
				address = node.toAddress()
			)
		}

		else -> null
	}
}

fun createMethodUpdate(
	projectName: String,
	className: String,
	classAddress: String,
	methodName: String,
	address: String,
): MutableMap<String, Any> {
	return mutableMapOf(
		"type" to "addData",
		"node" to mapOf(
			"project" to "Jadx: $projectName",
			"class" to className,
			"classAddress" to classAddress,
			"method" to methodName,
			"address" to address,
			"computedProperties" to arrayOf(
				mapOf(
					"name" to "label",
					"format" to "{0}::\n{1}",
					"replacements" to arrayOf("class", "method"),
				),
			),
		),
	)
}

fun createFieldUpdate(
	projectName: String,
	className: String,
	classAddress: String,
	fieldName: String,
	address: String,
): MutableMap<String, Any> {
	return mutableMapOf(
		"type" to "addData",
		"node" to mapOf(
			"project" to "Jadx: $projectName",
			"class" to className,
			"classAddress" to classAddress,
			"field" to fieldName,
			"address" to address,
			"computedProperties" to arrayOf(
				mapOf(
					"name" to "label",
					"format" to "{0}::\n_{1}",
					"replacements" to arrayOf("class", "field"),
				),
			),
		),
	)
}
//endregion

fun sendUpdate(data: Any) {
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
	jadx.log.debug { "Sending to graffiti: $json" }
	val message = json.toByteArray()

	socket.getOutputStream().buffered().let { writer ->
		writer.write(ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(message.size).array())
		writer.write(message)
		writer.flush()
	}
}
