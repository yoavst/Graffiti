package com.yoavst.graffiti.intellij

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.psi.PsiField
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiMethod

class AddToGraffitiWithEdgeInfoAction : AddToGraffitiAction() {
    override fun createMethodUpdate(
        project: Project,
        className: String,
        methodName: String,
        address: String
    ): MutableMap<String, Any> {
        val obj = super.createMethodUpdate(project, className, methodName, address)
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
        address: String
    ): MutableMap<String, Any> {
        val obj = super.createFieldUpdate(project, className, fieldName, address)
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