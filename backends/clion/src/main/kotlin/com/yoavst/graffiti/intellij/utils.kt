package com.yoavst.graffiti.intellij

import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import com.intellij.psi.*
import com.intellij.psi.util.PsiTreeUtil
import com.jetbrains.cidr.lang.psi.OCDeclarator
import com.jetbrains.cidr.lang.psi.OCFile
import com.jetbrains.cidr.lang.psi.OCFunctionDeclaration
import com.jetbrains.cidr.lang.psi.OCStruct

fun Project.notify(message: String, type: NotificationType) {
    NotificationGroupManager.getInstance()
        .getNotificationGroup("Graffiti Notifications")
        .createNotification(message, type)
        .notify(this)
}

data class ComputedProperty(val name: String, val format: String, val replacements: List<String>)

enum class MemberType(val prefix: String) {
    Field("_"), Method("");

    fun toName() = when (this) {
        Field -> "field"
        Method -> "method"
    }
}

sealed interface Info {
    val name: String
    val address: String
    val element: PsiElement?

    data class Member(
        override val element: PsiElement,
        val type: MemberType,
        override val name: String,
        val namespace: String?,
        val containingFileName: String,
        override val address: String
    ) : Info

    data class Class(
        override val element: PsiElement,
        override val name: String,
        val containingFileName: String,
        override val address: String
    ) : Info

    data class File(
        override val name: String,
        override val address: String
    ) : Info {
        override val element: PsiElement? get() = null
    }
}

fun getParentInfo(element: PsiElement?, psiFile: PsiFile): Info? {
    if (psiFile !is OCFile) {
        return null
    }

    // TODO: support Cpp namespaces
    val outerStruct = PsiTreeUtil.getParentOfType(element, OCStruct::class.java)

    val method = PsiTreeUtil.getParentOfType(element, OCFunctionDeclaration::class.java)
    if (method != null) return getMemberInfo(psiFile, method, method.declarator?.namespaceQualifier?.name ?: outerStruct?.name, MemberType.Method)

    val declarator = PsiTreeUtil.getParentOfType(element, OCDeclarator::class.java)
    if (declarator != null) return getMemberInfo(psiFile, declarator, declarator.namespaceQualifier?.name ?: outerStruct?.name, MemberType.Field)

    if (outerStruct != null) return Info.Class(outerStruct, outerStruct.name ?: "<anonymous>", psiFile.name, outerStruct.toAddress())
    return Info.File(psiFile.name, psiFile.toAddress())
}

private fun getMemberInfo(file: PsiFile, element: PsiNamedElement, namespace: String?, type: MemberType): Info.Member = Info.Member(
    element,
    type,
    element.name!!,
    namespace,
    file.name,
    element.toAddress()
)

private fun PsiFile.toPath() = originalFile.virtualFile.path
private fun PsiElement.toAddress() = containingFile.toPath() + "@" + textOffset
fun String.replaceOffset(newOffset: Int): String = split("@")[0] + "@" + newOffset

fun PsiFile.getLineStartOffset(line: Int): Int? {
    val doc = viewProvider.document ?: PsiDocumentManager.getInstance(project).getDocument(this)
    if (doc != null && line >= 0 && line < doc.lineCount) {
        return doc.getLineStartOffset(line)
    }

    return null
}