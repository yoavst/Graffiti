package com.yoavst.graffiti.intellij

import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import com.intellij.psi.PsiClass
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiField
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiJavaFile
import com.intellij.psi.PsiMember
import com.intellij.psi.PsiMethod
import com.intellij.psi.util.PsiTreeUtil
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.containingClassOrObject

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
        val containingClassName: String?,
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
    if (element != null) {
        if (psiFile is PsiJavaFile) {
            val method = PsiTreeUtil.getParentOfType(element, PsiMethod::class.java)
            if (method != null) return getJavaMemberInfo(psiFile, method, MemberType.Method)

            val field = PsiTreeUtil.getParentOfType(element, PsiField::class.java)
            if (field != null) return getJavaMemberInfo(psiFile, field, MemberType.Field)

            val clazz = PsiTreeUtil.getParentOfType(element, PsiClass::class.java)
            if (clazz != null) return Info.Class(clazz, clazz.name ?: "<anonymous>", psiFile.name, clazz.toAddress())
        } else if (psiFile is KtFile) {
            val method = PsiTreeUtil.getParentOfType(element, KtNamedFunction::class.java)
            if (method != null) return getKotlinDeclInfo(psiFile, method, MemberType.Method)

            val field = PsiTreeUtil.getParentOfType(element, KtProperty::class.java)
            if (field != null) return getKotlinDeclInfo(psiFile, field, MemberType.Field)

            val clazz = PsiTreeUtil.getParentOfType(element, KtClassOrObject::class.java)
            if (clazz != null) return Info.Class(clazz, clazz.name ?: "<anonymous>", psiFile.name, clazz.toAddress())
        } else return null
    }

    // No element or couldn't wrap in method, field or class
    return Info.File(psiFile.name, psiFile.toPath() + "@0")
}

private fun getJavaMemberInfo(file: PsiFile, member: PsiMember, type: MemberType) = Info.Member(
    member,
    type,
    member.name!!,
    member.containingClass!!.name,
    file.name,
    member.toAddress()
)

private fun getKotlinDeclInfo(file: PsiFile, declaration: KtNamedDeclaration, type: MemberType) = Info.Member(
    declaration,
    type,
    declaration.name ?: "<anonymous>",
    declaration.containingClassOrObject?.name,
    file.name,
    declaration.toAddress()
)

private fun PsiFile.toPath() = originalFile.virtualFile.path
private fun PsiElement.toAddress() = containingFile.toPath() + "@" + textOffset

fun String.replaceOffset(newOffset: Int): String = split("@")[0] + "@" + newOffset