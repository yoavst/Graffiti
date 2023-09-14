package com.yoavst.graffiti.intellij

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiField
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiMethod

class AddToGraffitiWithEdgeInfoAction : AddToGraffitiAction() {
    override fun createMethodUpdate(
        project: Project,
        className: String,
        methodName: String,
        address: String,
        element: PsiElement
    ): MutableMap<String, Any> {
        val obj = super.createMethodUpdate(project, className, methodName, address, element)
        val label = Messages.showInputDialog(
            project, "Enter label for edge",
            "Input", Messages.getQuestionIcon()
        )
        if (!label.isNullOrBlank()) {
            obj["edge"] = mutableMapOf("label" to label)
        }

        return obj
    }

    override fun createFieldUpdate(
        project: Project,
        className: String,
        fieldName: String,
        address: String,
        element: PsiElement
    ): MutableMap<String, Any> {
        val obj = super.createFieldUpdate(project, className, fieldName, address, element)
        val label = Messages.showInputDialog(
            project, "Enter label for edge",
            "Input", Messages.getQuestionIcon()
        )
        if (!label.isNullOrBlank()) {
            obj["edge"] = mutableMapOf("label" to label)
        }

        return obj
    }
}