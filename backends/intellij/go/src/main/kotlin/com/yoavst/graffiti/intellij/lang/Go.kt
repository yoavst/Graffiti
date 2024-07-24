package com.yoavst.graffiti.intellij.lang

import com.goide.psi.*
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.util.PsiTreeUtil
import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.models.MemberType
import com.yoavst.graffiti.intellij.toAddress
import com.yoavst.graffiti.intellij.toPath


object Go : Language {
    override val name get() = "Go"

    override fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? {
        if (element != null) {
            if (psiFile is GoFile) {
                val method = PsiTreeUtil.getParentOfType(element, GoFunctionOrMethodDeclaration::class.java)
                if (method != null) return getGoInfo(
                    psiFile, method, MemberType.Method, (method as? GoMethodDeclaration)?.receiverType?.text
                )

                val methodSpec = PsiTreeUtil.getParentOfType(element, GoMethodSpec::class.java)
                if (methodSpec != null) return getGoInfo(
                    psiFile,
                    methodSpec,
                    MemberType.Method,
                    methodSpec.structName()
                )

                val field = PsiTreeUtil.getParentOfType(element, GoFieldDefinition::class.java)
                if (field != null) return getGoInfo(psiFile, field, MemberType.Field, field.structName())

                val clazz = PsiTreeUtil.getParentOfType(element, GoTypeSpec::class.java)
                if (clazz != null) return Info.Class(
                    clazz,
                    clazz.name ?: "<anonymous>",
                    psiFile.name,
                    clazz.toAddress()
                )
            } else return null
        }

        // No element or couldn't wrap in method, field or class
        return Info.File(psiFile.name, psiFile.toPath() + "@0")
    }

    private fun GoNamedElement.structName() = PsiTreeUtil.getParentOfType(this, GoTypeSpec::class.java)?.identifier?.text

    private fun getGoInfo(file: PsiFile, member: GoNamedElement, type: MemberType, structName: String?) = Info.Member(
        member,
        type,
        member.name!!,
        structName,
        file.name,
        member.toAddress()
    )

}