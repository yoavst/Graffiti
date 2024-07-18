package com.yoavst.graffiti.intellij.lang

import com.intellij.psi.*
import com.intellij.psi.util.PsiTreeUtil
import com.jetbrains.cidr.lang.psi.OCDeclarator
import com.jetbrains.cidr.lang.psi.OCFile
import com.jetbrains.cidr.lang.psi.OCFunctionDeclaration
import com.jetbrains.cidr.lang.psi.OCStruct
import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.models.MemberType
import com.yoavst.graffiti.intellij.toAddress

object Cpp : Language {
    override val name get() = "OCSlow"

    override fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? {
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
}