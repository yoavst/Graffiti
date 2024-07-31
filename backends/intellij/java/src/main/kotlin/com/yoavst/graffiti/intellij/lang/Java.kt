package com.yoavst.graffiti.intellij.lang

import com.intellij.psi.*
import com.intellij.psi.search.searches.ReferencesSearch
import com.intellij.psi.util.PsiTreeUtil
import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.models.MemberType
import com.yoavst.graffiti.intellij.toAddress
import com.yoavst.graffiti.intellij.toPath

object Java : Language {
    override val name get() = "JAVA"

    override fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? {
        if (element != null) {
            if (psiFile is PsiJavaFile) {
                val method = PsiTreeUtil.getParentOfType(element, PsiMethod::class.java)
                if (method != null) return getJavaMemberInfo(psiFile, method, MemberType.Method)

                val field = PsiTreeUtil.getParentOfType(element, PsiField::class.java)
                if (field != null) return getJavaMemberInfo(psiFile, field, MemberType.Field)

                val clazz = PsiTreeUtil.getParentOfType(element, PsiClass::class.java)
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
        member.containingClass!!.name ?: "<anonymous>",
        file.name,
        member.toAddress()
    )
}