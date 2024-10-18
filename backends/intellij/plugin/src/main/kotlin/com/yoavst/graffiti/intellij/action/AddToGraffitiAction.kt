package com.yoavst.graffiti.intellij.action

import com.intellij.codeInsight.documentation.DocumentationManager
import com.intellij.openapi.actionSystem.ActionUpdateThread
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.psi.*
import com.yoavst.graffiti.intellij.SocketHolder
import com.yoavst.graffiti.intellij.lang.Language
import com.yoavst.graffiti.intellij.models.ComputedProperty
import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.replaceOffset
import org.apache.commons.lang.StringUtils.ordinalIndexOf

open class AddToGraffitiAction : AnAction() {
    open val lineUpdate get() = false
    open val edgeText get() = false
    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible =
            (event.project != null &&
                    event.getData(CommonDataKeys.EDITOR) != null)
    }

    override fun getActionUpdateThread(): ActionUpdateThread {
        return ActionUpdateThread.BGT
    }

    override fun actionPerformed(event: AnActionEvent) {
        val project = event.project!!
        val editor = event.getData(CommonDataKeys.EDITOR) ?: return
        val psiFile = event.getData(CommonDataKeys.PSI_FILE) ?: return
        val currentElement = psiFile.findElementAt(editor.caretModel.offset) ?: return

        val info = Language.getNodeInfo(currentElement, psiFile) ?: return

        if (info is Info.File && !lineUpdate) {
            // file is only relevant for line updates
            return
        }

        val nodeUpdate = when (info) {
            is Info.Class -> createClassNodeUpdate(project, info)
            is Info.File -> createFileInfoUpdate(project, info)
            is Info.Member -> createMemberNodeUpdate(project, info)
        }

        applyLineOrHover(lineUpdate, editor.caretModel.primaryCaret.logicalPosition.line + 1, nodeUpdate, psiFile, info)

        val update = mutableMapOf("type" to "addData", "node" to nodeUpdate)
        if (edgeText) {
            val label = Messages.showInputDialog(
                project, "Enter label for edge",
                "Input", Messages.getQuestionIcon()
            )
            if (!label.isNullOrBlank()) {
                update["edge"] = mutableMapOf("label" to label)
            }
        }

        SocketHolder.sendJson(event.project!!, update)
    }

    companion object {
        fun applyLineOrHover(
            lineUpdate: Boolean,
            line: Int,
            nodeUpdate: MutableMap<String, Any>,
            psiFile: PsiFile,
            info: Info
        ) {
            if (lineUpdate) {
                // need to update line, label and address
                nodeUpdate["line"] = line

                nodeUpdate["address"] =
                    (nodeUpdate["address"] as String).replaceOffset(ordinalIndexOf(psiFile.text, "\n", line - 1) + 1)

                val computedProperties = nodeUpdate["computedProperties"] as MutableList<ComputedProperty>
                val labelProp = computedProperties[0]
                computedProperties[0] = ComputedProperty(
                    labelProp.name,
                    labelProp.format + ":{" + labelProp.replacements.size + "}",
                    labelProp.replacements + "line"
                )
            } else {
                addDocumentation(nodeUpdate, info.element)
            }
        }

        fun addDocumentation(update: MutableMap<String, Any>, psiElement: PsiElement?) {
            if (psiElement == null) return

            val doc =
                DocumentationManager.getProviderFromElement(psiElement).generateDoc(psiElement, null)?.trim() ?: ""
            if (doc.isNotEmpty()) {
                update["hover"] = listOf(doc)
                update["hoverCT"] = "html"
            }
        }

        fun createMemberNodeUpdate(
            project: Project,
            memberInfo: Info.Member
        ): MutableMap<String, Any> = mutableMapOf(
            "project" to ("Intellij: " + project.name),
            "address" to memberInfo.address,
            "class" to (memberInfo.containingClassName ?: memberInfo.containingFileName),
            memberInfo.type.toName() to memberInfo.name,
            "computedProperties" to mutableListOf(
                ComputedProperty(
                    "label",
                    "{0}::\n${memberInfo.type.prefix}{1}",
                    listOf("class", memberInfo.type.toName())
                )
            )
        )

        fun createClassNodeUpdate(
            project: Project,
            classInfo: Info.Class
        ): MutableMap<String, Any> = mutableMapOf(
            "project" to ("Intellij: " + project.name),
            "address" to classInfo.address,
            "class" to classInfo.name,
            "computedProperties" to mutableListOf(
                ComputedProperty(
                    "label", "{0}", listOf("class")
                )
            )
        )

        fun createFileInfoUpdate(
            project: Project,
            fileInfo: Info.File,
        ): MutableMap<String, Any> = mutableMapOf(
            "project" to ("Intellij: " + project.name),
            "address" to fileInfo.address,
            "computedProperties" to mutableListOf(
                ComputedProperty(
                    "label", fileInfo.name, listOf()
                )
            )
        )
    }
}

class AddToGraffitiWithEdgeInfoAction : AddToGraffitiAction() {
    override val edgeText: Boolean get() = true
}

class AddLineToGraffitiAction : AddToGraffitiAction() {
    override val lineUpdate: Boolean get() = true
}