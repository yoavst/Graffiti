package com.yoavst.graffiti.intellij.action

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiElement
import com.intellij.refactoring.suggested.startOffset
import com.yoavst.graffiti.intellij.SocketHolder
import com.yoavst.graffiti.intellij.getLineNumber
import com.yoavst.graffiti.intellij.lang.Language
import com.yoavst.graffiti.intellij.models.Info


open class AddAllXrefsToGraffitiAction : AnAction() {
    open val lineUpdate get() = false

    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = (event.project != null && event.getData(CommonDataKeys.EDITOR) != null)
    }

    override fun actionPerformed(event: AnActionEvent) {
        val project = event.project!!
        val editor = event.getData(CommonDataKeys.EDITOR) ?: return
        val psiFile = event.getData(CommonDataKeys.PSI_FILE) ?: return
        val currentElement = psiFile.findElementAt(editor.caretModel.offset)

        val info = Language.getNodeInfo(currentElement, psiFile) ?: return

        if (info !is Info.Member) {
            // Only support xrefs for members
            return
        }

        val references =
            (Language.searchReferencesOrMethodReferences(info.element, psiFile) ?: emptyList()).map { it.element }
                .filter { it.containingFile.fileType.name in Language.supportedLanguages() }
        if (references.isEmpty()) return
        val updates = references.mapNotNull { toUpdateNode(project, it) }

        val finalUpdate = mapOf("type" to "addDataBulk", "nodes" to updates, "direction" to "n2e")
        SocketHolder.sendJson(project, finalUpdate)

    }

    private fun toUpdateNode(project: Project, reference: PsiElement): MutableMap<String, Any>? {
        val info = Language.getNodeInfo(reference, reference.containingFile) ?: return null

        val nodeUpdate = when (info) {
            is Info.Class -> AddToGraffitiAction.createClassNodeUpdate(project, info)
            is Info.Member -> AddToGraffitiAction.createMemberNodeUpdate(project, info)
            is Info.File -> return null // should not be possible
        }

        reference.startOffset
        AddToGraffitiAction.applyLineOrHover(
            lineUpdate,
            getLineNumber(reference.containingFile.text, reference.startOffset),
            nodeUpdate,
            reference.containingFile,
            info
        )

        return nodeUpdate
    }

}

class AddAllXrefsLineToGraffitiAction : AddAllXrefsToGraffitiAction() {
    override val lineUpdate: Boolean get() = true
}


