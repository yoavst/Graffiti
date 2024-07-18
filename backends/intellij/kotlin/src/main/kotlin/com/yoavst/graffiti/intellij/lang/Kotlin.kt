package com.yoavst.graffiti.intellij.lang

import com.intellij.psi.*
import com.intellij.psi.util.PsiTreeUtil
import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.models.MemberType
import com.yoavst.graffiti.intellij.toAddress
import com.yoavst.graffiti.intellij.toPath
import org.jetbrains.kotlin.idea.search.usagesSearch.searchReferencesOrMethodReferences
import org.jetbrains.kotlin.psi.*
import org.jetbrains.kotlin.psi.psiUtil.containingClassOrObject

object Kotlin : Language {
    override val name get() = "Kotlin"

    override fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? {
        if (element != null) {
            if (psiFile is KtFile) {
                val method = PsiTreeUtil.getParentOfType(element, KtNamedFunction::class.java)
                if (method != null) return getKotlinDeclInfo(psiFile, method, MemberType.Method)

                val field = PsiTreeUtil.getParentOfType(element, KtProperty::class.java)
                if (field != null) return getKotlinDeclInfo(psiFile, field, MemberType.Field)

                val clazz = PsiTreeUtil.getParentOfType(element, KtClassOrObject::class.java)
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

    override fun searchReferencesOrMethodReferences(element: PsiElement): List<PsiReference> = element.searchReferencesOrMethodReferences().toList()



    private fun getKotlinDeclInfo(file: PsiFile, declaration: KtNamedDeclaration, type: MemberType) = Info.Member(
        declaration,
        type,
        declaration.name ?: "<anonymous>",
        declaration.containingClassOrObject?.name,
        file.name,
        declaration.toAddress()
    )
}