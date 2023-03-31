package com.yoavst.graffiti.intellij

import com.google.gson.Gson
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiField
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiJavaFile
import com.intellij.psi.PsiMethod
import com.intellij.psi.util.PsiTreeUtil
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtProperty
import org.jetbrains.kotlin.psi.psiUtil.containingClass
import java.net.Socket


open class AddToGraffitiAction : AnAction() {
    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = (event.project != null && event.getData(CommonDataKeys.EDITOR) != null)
    }

    override fun actionPerformed(event: AnActionEvent) {
        val editor = event.getData(CommonDataKeys.EDITOR) ?: return
        val psiFile = event.getData(CommonDataKeys.PSI_FILE) ?: return
        val currentElement = psiFile.findElementAt(editor.caretModel.offset) ?: return

        var update: MutableMap<String, Any>? = null
        if (psiFile is PsiJavaFile) {
            val method = PsiTreeUtil.getParentOfType(currentElement, PsiMethod::class.java)
            if (method != null) {
                update = createJavaMethodUpdate(event.project!!, psiFile, method)
            } else {
                val field = PsiTreeUtil.getParentOfType(currentElement, PsiField::class.java)
                if (field != null) {
                    update = createJavaFieldUpdate(event.project!!, psiFile, field)
                }
            }
        } else if (psiFile is KtFile) {
            val method = PsiTreeUtil.getParentOfType(currentElement, KtNamedFunction::class.java)
            if (method != null) {
                update = createKotlinMethodUpdate(event.project!!, psiFile, method)
            }
            if (update == null) {
                val field = PsiTreeUtil.getParentOfType(currentElement, KtProperty::class.java)
                if (field != null) {
                    update = createKotlinFieldUpdate(event.project!!, psiFile, field)
                }
            }
        }

        if (update != null) {
            sendUpdate(event.project!!, update)
        }
    }

    private fun createKotlinMethodUpdate(project: Project, psiFile: PsiFile, method: KtNamedFunction): MutableMap<String, Any> {
        val className = method.containingClass()?.name ?: psiFile.name
        val methodName = method.name ?: "<anonymous>"
        val address = psiFile.originalFile.virtualFile.path + "@" + method.textOffset
        return createMethodUpdate(project, className, methodName, address)
    }

    private fun createKotlinFieldUpdate(project: Project, psiFile: PsiFile, field: KtProperty): MutableMap<String, Any> {
        val className = field.containingClass()?.name ?: psiFile.name
        val fieldName = field.name!!
        val address = psiFile.originalFile.virtualFile.path + "@" + field.textOffset
        return createFieldUpdate(project, className, fieldName, address)
    }

    private fun createJavaMethodUpdate(project: Project, psiFile: PsiFile, method: PsiMethod): MutableMap<String, Any> {
        val className = method.containingClass!!.name!!
        val methodName = method.name
        val address = psiFile.originalFile.virtualFile.path + "@" + method.textOffset
        return createMethodUpdate(project, className, methodName, address)
    }

    private fun createJavaFieldUpdate(project: Project, psiFile: PsiFile, field: PsiField): MutableMap<String, Any> {
        val className = field.containingClass!!.name!!
        val fieldName = field.name
        val address = psiFile.originalFile.virtualFile.path + "@" + field.textOffset
        return createFieldUpdate(project, className, fieldName, address)
    }

    protected open fun createMethodUpdate(
        project: Project,
        className: String,
        methodName: String,
        address: String
    ): MutableMap<String, Any> {
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
                "project" to ("Intellij: " + project.name),
                "class" to className,
                "method" to methodName,
                "address" to address,
                "computedProperties" to arrayOf(
                    mapOf(
                        "name" to "label",
                        "format" to "{0}::\n{1}",
                        "replacements" to arrayOf("class", "method")
                    )
                )
            )
        )
    }

    protected open fun createFieldUpdate(
        project: Project,
        className: String,
        fieldName: String,
        address: String
    ): MutableMap<String, Any> {
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
                "project" to ("Intellij: " + project.name),
                "class" to className,
                "field" to fieldName,
                "address" to address,
                "computedProperties" to arrayOf(
                    mapOf(
                        "name" to "label",
                        "format" to "{0}::\n_{1}",
                        "replacements" to arrayOf("class", "field")
                    )
                )
            )
        )
    }

    private fun sendUpdate(project: Project, data: Any) {
        val socket = SocketHolder.socket ?: run {
            NotificationGroupManager.getInstance()
                .getNotificationGroup("Graffiti Notifications")
                .createNotification("Graffiti: Not connected to server", NotificationType.ERROR)
                .notify(project)
            return
        }
        socket.getOutputStream().bufferedWriter().let { writer ->
            writer.write(Gson().toJson(data))
            writer.flush()
        }
    }
}