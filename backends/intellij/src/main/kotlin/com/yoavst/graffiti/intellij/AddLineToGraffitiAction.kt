package com.yoavst.graffiti.intellij

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.Project
import com.intellij.psi.*
import com.intellij.psi.util.PsiTreeUtil
import org.jetbrains.kotlin.idea.core.util.getLineStartOffset
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtProperty
import org.jetbrains.kotlin.psi.psiUtil.containingClass
import org.jetbrains.kotlin.psi.psiUtil.containingClassOrObject


class AddLineToGraffitiAction : AnAction() {
    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = (event.project != null && event.getData(CommonDataKeys.EDITOR) != null)
    }

    override fun actionPerformed(event: AnActionEvent) {
        val editor = event.getData(CommonDataKeys.EDITOR) ?: return
        val psiFile = event.getData(CommonDataKeys.PSI_FILE) ?: return
        val currentElement = psiFile.findElementAt(editor.caretModel.offset)
        val line = editor.caretModel.primaryCaret.logicalPosition.line
        var update: MutableMap<String, Any>? = null
        if (currentElement != null) {
            if (psiFile is PsiJavaFile) {
                val method = PsiTreeUtil.getParentOfType(currentElement, PsiMethod::class.java)
                if (method != null) {
                    update = createJavaMethodUpdate(event.project!!, psiFile, method, line)
                } else {
                    val field = PsiTreeUtil.getParentOfType(currentElement, PsiField::class.java)
                    if (field != null) {
                        update = createJavaFieldUpdate(event.project!!, psiFile, field, line)
                    }
                }
            } else if (psiFile is KtFile) {
                val method = PsiTreeUtil.getParentOfType(currentElement, KtNamedFunction::class.java)
                if (method != null) {
                    update = createKotlinMethodUpdate(event.project!!, psiFile, method, line)
                }
                if (update == null) {
                    val field = PsiTreeUtil.getParentOfType(currentElement, KtProperty::class.java)
                    if (field != null) {
                        update = createKotlinFieldUpdate(event.project!!, psiFile, field, line)
                    }
                }
            }
        }

        if (update == null) {
            update = createGeneralUpdate(event.project!!, psiFile, line)
        }

        SocketHolder.sendUpdate(event.project!!, update)
    }

    private fun createKotlinMethodUpdate(project: Project, psiFile: PsiFile, method: KtNamedFunction, line: Int): MutableMap<String, Any> {
        val className = method.containingClassOrObject?.name ?: psiFile.name
        val methodName = method.name ?: "<anonymous>"
        val address = psiFile.originalFile.virtualFile.path + "@" + psiFile.getLineStartOffset(line)
        return createMethodUpdate(project, className, methodName, address, line)
    }

    private fun createKotlinFieldUpdate(project: Project, psiFile: PsiFile, field: KtProperty, line: Int): MutableMap<String, Any> {
        val className = field.containingClassOrObject?.name ?: psiFile.name
        val fieldName = field.name!!
        val address = psiFile.originalFile.virtualFile.path + "@" + psiFile.getLineStartOffset(line)
        return createFieldUpdate(project, className, fieldName, address, line, field)
    }

    private fun createJavaMethodUpdate(project: Project, psiFile: PsiFile, method: PsiMethod, line: Int): MutableMap<String, Any> {
        val className = method.containingClass!!.name!!
        val methodName = method.name
        val address = psiFile.originalFile.virtualFile.path + "@" + psiFile.getLineStartOffset(line)
        return createMethodUpdate(project, className, methodName, address, line)
    }

    private fun createJavaFieldUpdate(project: Project, psiFile: PsiFile, field: PsiField, line: Int): MutableMap<String, Any> {
        val className = field.containingClass!!.name!!
        val fieldName = field.name
        val address = psiFile.originalFile.virtualFile.path + "@" + psiFile.getLineStartOffset(line)
        return createFieldUpdate(project, className, fieldName, address, line, field)
    }

    private fun createGeneralUpdate(project: Project, psiFile: PsiFile, line: Int): MutableMap<String, Any> {
        val filename = psiFile.originalFile.name
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
                "project" to ("Intellij: " + project.name),
                "address" to psiFile.originalFile.virtualFile.path + "@" + psiFile.getLineStartOffset(line),
                "line" to line,
                "computedProperties" to arrayOf(
                    mapOf(
                        "name" to "label",
                        "format" to "$filename::{0}",
                        "replacements" to arrayOf("line")
                    )
                )
            )
        )
    }

    private fun createMethodUpdate(
        project: Project,
        className: String,
        methodName: String,
        address: String,
        line: Int,
    ): MutableMap<String, Any> {
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
                "project" to ("Intellij: " + project.name),
                "class" to className,
                "method" to methodName,
                "address" to address,
                "line" to line,
                "computedProperties" to arrayOf(
                    mapOf(
                        "name" to "label",
                        "format" to "{0}::\n{1}:{2}",
                        "replacements" to arrayOf("class", "method", "line")
                    )
                )
            )
        )
    }

    private fun createFieldUpdate(
        project: Project,
        className: String,
        fieldName: String,
        address: String,
        line: Int,
        element: PsiElement
    ): MutableMap<String, Any> {
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
                "project" to ("Intellij: " + project.name),
                "class" to className,
                "field" to fieldName,
                "address" to address,
                "line" to line,
                "computedProperties" to arrayOf(
                    mapOf(
                        "name" to "label",
                        "format" to "{0}::\n_{1}:{2}",
                        "replacements" to arrayOf("class", "field", "line")
                    )
                )
            )
        )
    }
}