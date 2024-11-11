package com.yoavst.graffiti.intellij.lang

import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.util.PsiTreeUtil
import com.intellij.psi.util.parents

import com.yoavst.graffiti.intellij.models.Info
import com.yoavst.graffiti.intellij.models.MemberType
import com.yoavst.graffiti.intellij.toAddress
import com.yoavst.graffiti.intellij.toPath
import org.jetbrains.plugins.ruby.ruby.lang.psi.RFile
import org.jetbrains.plugins.ruby.ruby.lang.psi.controlStructures.classes.RClass
import org.jetbrains.plugins.ruby.ruby.lang.psi.controlStructures.methods.RMethod
import org.jetbrains.plugins.ruby.ruby.lang.psi.controlStructures.modules.RModule

object Ruby : Language {
    override val name get() = "Ruby"

    override fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? {
        if (element != null) {
            if (psiFile is RFile) {
                val method = PsiTreeUtil.getParentOfType(element, RMethod::class.java)
                if (method != null) return getRubiMethodInfo(psiFile, method)

                val clazz = PsiTreeUtil.getParentOfType(element, RClass::class.java)
                if (clazz != null) return Info.Class(clazz, clazz.name, psiFile.name, clazz.toAddress())

                val module = PsiTreeUtil.getParentOfType(element, RModule::class.java)
                if (module != null) return Info.Class(module, module.name, psiFile.name, module.toAddress())
            } else return null
        }

        // No element or couldn't wrap in method, field or class
        return Info.File(psiFile.name, psiFile.toPath() + "@0")
    }

    private fun getRubiMethodInfo(file: PsiFile, method: RMethod) = Info.Member(
        method,
        MemberType.Method,
        method.name,
        PsiTreeUtil.getParentOfType(method, RClass::class.java)?.name ?: PsiTreeUtil.getParentOfType(
            method,
            RModule::class.java
        )?.name,
        file.name,
        method.toAddress()
    )
}