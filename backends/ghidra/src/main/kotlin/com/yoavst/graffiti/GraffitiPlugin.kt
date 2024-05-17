/* ###
 * IP: GHIDRA
 *
 * Example plugin converted to Kotlin by IntelliJ IDEA, then cleaned and made more idiomatic by Florian Magin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.yoavst.graffiti

import ghidra.MiscellaneousPluginPackage
import ghidra.app.plugin.PluginCategoryNames
import ghidra.app.plugin.ProgramPlugin
import ghidra.app.script.GhidraScript
import ghidra.framework.model.DomainObjectChangedEvent
import ghidra.framework.model.DomainObjectListener
import ghidra.framework.plugintool.PluginInfo
import ghidra.framework.plugintool.PluginTool
import ghidra.framework.plugintool.util.PluginStatus
import ghidra.framework.plugintool.util.PluginUtils
import ghidra.program.model.listing.Program
import ghidra.program.model.symbol.Symbol
import ghidra.program.util.ChangeManager
import ghidra.program.util.ProgramChangeRecord


@PluginInfo(
    status = PluginStatus.RELEASED,
    packageName = MiscellaneousPluginPackage.NAME,
    category = PluginCategoryNames.NAVIGATION,
    shortDescription = "Graffiti for ghidra",
    description = "Graffiti for ghidra"
)
class GraffitiPlugin(tool: PluginTool) : ProgramPlugin(tool), DomainObjectListener {
    init {
        tool.addAction(ConnectToGraffitiAction(this))
        tool.addAction(AddToGraffitiBaseAction(isSpecificAddress = true, askForEdgeText = true))
        tool.addAction(AddToGraffitiBaseAction(isSpecificAddress = true, askForEdgeText = false))
        tool.addAction(AddToGraffitiBaseAction(isSpecificAddress = false, askForEdgeText = true))
        tool.addAction(AddToGraffitiBaseAction(isSpecificAddress = false, askForEdgeText = false))
    }

    override fun programActivated(program: Program) {
        program.addListener(this)
    }

    override fun programDeactivated(program: Program) {
        program.removeListener(this)
    }

    override fun programClosed(program: Program) {
        program.removeListener(this)
    }

    override fun domainObjectChanged(event: DomainObjectChangedEvent) {
        event.forEach { record ->
            if (record.eventType == ChangeManager.DOCR_SYMBOL_RENAMED) {
                val symbol = (record as ProgramChangeRecord).`object` as Symbol
                SocketHolder.sendJson(
                    mapOf(
                        "type" to "updateNodes",
                        "selection" to listOf(listOf("baseAddress", symbol.address.toString())),
                        "update" to mapOf("baseName" to symbol.name)
                    )
                )
            }
        }
    }

    // Companion objects are the "static" part of a JVM class, i.e. present without needing to instantiate the class
    companion object {
        val PLUGIN_NAME: String = PluginUtils.getPluginNameFromClass(GraffitiPlugin::class.java)
        const val GRAFFITI_GROUP = "graffiti"
        val ghidraScriptHelper by lazy {
            object : GhidraScript() {
                override fun run() {

                }
            }
        }
    }
}