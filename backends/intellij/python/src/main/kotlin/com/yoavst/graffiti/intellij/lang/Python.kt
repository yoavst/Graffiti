package com.yoavst.graffiti.intellij.lang

import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiNamedElement
import com.intellij.psi.util.PsiTreeUtil
import com.jetbrains.python.psi.*
import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.models.MemberType
import com.yoavst.graffiti.intellij.toAddress
import com.yoavst.graffiti.intellij.toPath


object Python : Language {
    override val name get() = "Python"

    override fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? {
        if (element != null) {
            if (psiFile is PyFile) {
                val method = PsiTreeUtil.getParentOfType(element, PyFunction::class.java)
                if (method != null) return getPythonMemberInfo(psiFile, method, MemberType.Method)

                val field = PsiTreeUtil.getParentOfType(element, PyTargetExpression::class.java)
                if (field != null) return getPythonMemberInfo(psiFile, field, MemberType.Field)

                val assignment = PsiTreeUtil.getParentOfType(element, PyAssignmentStatement::class.java)
                if (assignment != null && assignment.targets.isNotEmpty()) {
                    return Info.Member(
                        assignment,
                        MemberType.Field,
                        assignment.targets.mapNotNull { it.name }.joinToString(separator = ", "),
                        PsiTreeUtil.getParentOfType(element, PyClass::class.java)?.name,
                        psiFile.name,
                        assignment.toAddress()
                    )
                }

                val clazz = PsiTreeUtil.getParentOfType(element, PyClass::class.java)
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

    private fun <T> getPythonMemberInfo(
        file: PsiFile,
        member: T,
        type: MemberType
    ) where T : PsiNamedElement, T : PyPossibleClassMember = Info.Member(
        member,
        type,
        member.name!!,
        member.containingClass?.name,
        file.name,
        member.toAddress()
    )

}