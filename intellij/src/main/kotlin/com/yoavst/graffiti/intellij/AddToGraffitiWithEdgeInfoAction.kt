package com.yoavst.graffiti.intellij

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.psi.PsiField
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiMethod

class AddToGraffitiWithEdgeInfoAction : AddToGraffitiAction() {
    override fun createMethodUpdate(project: Project, psiFile: PsiFile, method: PsiMethod): MutableMap<String, Any> {
        val obj = super.createMethodUpdate(project, psiFile, method)
        val label = Messages.showInputDialog(project, "Enter label for edge",
            "Input", Messages.getQuestionIcon())
        if (!label.isNullOrBlank()) {
            obj["edge"] = mutableMapOf("label" to label)
        }

        return obj
    }

    override fun createFieldUpdate(project: Project,psiFile: PsiFile, field: PsiField): MutableMap<String, Any> {
        val obj = super.createFieldUpdate(project, psiFile, field)
        val label = Messages.showInputDialog(project, "Enter label for edge",
            "Input", Messages.getQuestionIcon())
        if (!label.isNullOrBlank()) {
            obj["edge"] = mutableMapOf("label" to label)
        }

        return obj
    }
}