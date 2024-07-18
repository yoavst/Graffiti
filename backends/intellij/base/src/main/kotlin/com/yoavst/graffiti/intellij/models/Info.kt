package com.yoavst.graffiti.intellij.models

import com.intellij.psi.PsiElement

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