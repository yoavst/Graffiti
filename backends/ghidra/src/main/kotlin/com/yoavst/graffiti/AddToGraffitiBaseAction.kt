package com.yoavst.graffiti

import docking.ActionContext
import docking.action.DockingAction
import docking.action.KeyBindingData
import docking.action.MenuData
import ghidra.app.context.ProgramLocationActionContext
import ghidra.util.exception.CancelledException
import java.awt.event.ActionEvent
import javax.swing.Icon
import javax.swing.KeyStroke


class AddToGraffitiBaseAction(private val isSpecificAddress: Boolean, private val askForEdgeText: Boolean) :
    DockingAction(getActionName(isSpecificAddress, askForEdgeText), GraffitiPlugin.PLUGIN_NAME) {
    init {
        val shortcut = getShortcut()

        isEnabled = true
        description = name
        popupMenuData = MenuData(arrayOf(GROUP, name), null as Icon?)

        if (shortcut != null) {
            keyBindingData = KeyBindingData(shortcut)
        }

        enabledWhen { context ->
            context is ProgramLocationActionContext && context.address != null
        }
    }

    override fun actionPerformed(actionContext: ActionContext) {
        val update =
            mutableMapOf("type" to "addData", "node" to getNodeUpdate(actionContext as ProgramLocationActionContext))
        if (askForEdgeText) {
            try {
                val label = GraffitiPlugin.ghidraScriptHelper.askString("Graffiti", "Enter label for edge")
                if (!label.isNullOrBlank()) {
                    update["edge"] = mutableMapOf("label" to label)
                }
            } catch (_: CancelledException) {

            }
        }

        SocketHolder.sendJson(update)
    }

    private fun getNodeUpdate(context: ProgramLocationActionContext): MutableMap<String, Any>? {
        val containingFunction = context.program.functionManager.getFunctionContaining(context.address)
        if (containingFunction == null) {
            if (!isSpecificAddress) {
                GraffitiPlugin.ghidraScriptHelper.popup("Graffiti: Not inside a function!")
                return null
            }

            // Address not inside a function
            val address = context.address.toString()
            val possibleName = context.program.symbolTable.getSymbol(context.address.offset) ?: address
            return mutableMapOf(
                "project" to "Ghidra: ${context.program.name}",
                "baseAddress" to address,
                "baseName" to possibleName,
                "line" to address,
                "computedProperties" to arrayOf(
                    ComputedProperty(
                        "label",
                        "{0}",
                        listOf("baseName")
                    )
                )
            )
        } else if (!isSpecificAddress) {
            val address = containingFunction.entryPoint.toString()
            return mutableMapOf(
                "project" to "Ghidra: ${context.program.name}",
                "address" to address,
                "baseAddress" to address,
                "baseName" to containingFunction.name,
                "computedProperties" to arrayOf(
                    ComputedProperty(
                        "label",
                        "{0}",
                        listOf("baseName")
                    )
                )
            )
        } else {
            val line = context.address.subtract(containingFunction.entryPoint)
            return mutableMapOf(
                "project" to "Ghidra: ${context.program.name}",
                "address" to context.address.toString(),
                "baseName" to containingFunction.name,
                "baseAddress" to containingFunction.entryPoint.toString(),
                "line" to line.toString(16),
                "computedProperties" to arrayOf(
                    ComputedProperty(
                        "label",
                        "{0}+{1}",
                        listOf("baseName", "line")
                    )
                )
            )
        }

    }

    private fun getShortcut() = when {
        isSpecificAddress && askForEdgeText -> null
        isSpecificAddress && !askForEdgeText -> KeyStroke.getKeyStroke(
            'A'.code,
            ActionEvent.CTRL_MASK or ActionEvent.SHIFT_MASK or ActionEvent.ALT_MASK
        )

        !isSpecificAddress && askForEdgeText -> KeyStroke.getKeyStroke(
            'X'.code,
            ActionEvent.CTRL_MASK or ActionEvent.SHIFT_MASK
        )

        else -> KeyStroke.getKeyStroke('A'.code, ActionEvent.CTRL_MASK or ActionEvent.SHIFT_MASK)
    }
}

private fun getActionName(isSpecificAddress: Boolean, askForEdgeText: Boolean) = when {
    isSpecificAddress && askForEdgeText -> "Add Address to Graffiti with Edge Info"
    isSpecificAddress && !askForEdgeText -> "Add Address to Graffiti"
    !isSpecificAddress && askForEdgeText -> "Add Function to Graffiti with Edge Info"
    else -> "Add to Graffiti"
}

private const val GROUP = "Graffiti"

data class ComputedProperty(val name: String, val format: String, val replacements: List<String>)
