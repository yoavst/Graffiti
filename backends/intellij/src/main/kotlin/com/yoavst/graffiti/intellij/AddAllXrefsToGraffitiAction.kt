package com.yoavst.graffiti.intellij

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiJavaFile
import org.jetbrains.kotlin.idea.core.util.getLineNumber
import org.jetbrains.kotlin.idea.search.usagesSearch.searchReferencesOrMethodReferences
import org.jetbrains.kotlin.psi.KtFile


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

        val info = getParentInfo(currentElement, psiFile) ?: return

        if (info !is Info.Member) {
            // Only support xrefs for members
            return
        }

        val references = info.element.searchReferencesOrMethodReferences().map { it.element }.filter { it.containingFile is KtFile || it.containingFile is PsiJavaFile }
        if (references.isEmpty()) return
        val updates = references.mapNotNull { toUpdateNode(project, it) }

        val finalUpdate = mapOf("type" to "addDataBulk", "nodes" to updates, "direction" to "n2e")
        SocketHolder.sendJson(project, finalUpdate)

    }

    private fun toUpdateNode(project: Project, reference: PsiElement): MutableMap<String, Any>? {
        val info = getParentInfo(reference, reference.containingFile) ?: return null

        val nodeUpdate = when (info) {
            is Info.Class -> AddToGraffitiAction.createClassNodeUpdate(project, info)
            is Info.Member -> AddToGraffitiAction.createMemberNodeUpdate(project, info)
            is Info.File -> return null // should not be possible
        }

        AddToGraffitiAction.applyLineOrHover(lineUpdate, reference.getLineNumber(), nodeUpdate, reference.containingFile, info)

        return nodeUpdate
    }

}

class AddAllXrefsLineToGraffitiAction : AddAllXrefsToGraffitiAction() {
    override val lineUpdate: Boolean get() = true
}


