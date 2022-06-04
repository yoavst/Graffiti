package com.yoavst.graffiti.intellij

import com.google.gson.Gson
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.CommonDataKeys
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiField
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiMethod
import com.intellij.psi.util.PsiTreeUtil
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

        val method = PsiTreeUtil.getParentOfType(currentElement, PsiMethod::class.java)
        if (method != null) {
            update = createMethodUpdate(event.project!!, psiFile, method)
        } else {
            val field = PsiTreeUtil.getParentOfType(currentElement, PsiField::class.java)
            if (field != null) {
                update = createFieldUpdate(event.project!!, psiFile, field)
            }
        }

        if (update != null) {
            update["isNodeTarget"] = direction
            sendUpdate(update)
        }
    }

    protected open fun createMethodUpdate(project: Project, psiFile: PsiFile, method: PsiMethod): MutableMap<String, Any> {
        val className = method.containingClass!!.name
        val methodName = method.name
        val address = psiFile.originalFile.virtualFile.path + "@" + method.textOffset
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
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

    protected open fun createFieldUpdate(project: Project, psiFile: PsiFile, field: PsiField): MutableMap<String, Any> {
        val className = field.containingClass!!.name
        val fieldName = field.name
        val address = psiFile.originalFile.virtualFile.path + "@" + field.textOffset
        return mutableMapOf(
            "type" to "addData", "node" to mapOf(
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

    private fun sendUpdate(data: Any) {
        val s = Socket("localhost", 8764)
        s.getOutputStream().bufferedWriter().let { writer ->
            writer.write(Gson().toJson(data))
            writer.flush()
        }
        s.close()
    }

    companion object {
        @JvmStatic
        var direction: Boolean = true
    }
}