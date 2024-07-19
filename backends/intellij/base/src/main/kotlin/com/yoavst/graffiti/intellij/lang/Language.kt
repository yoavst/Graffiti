package com.yoavst.graffiti.intellij.lang

import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import com.intellij.psi.PsiReference
import com.intellij.psi.search.searches.ReferencesSearch
import com.yoavst.graffiti.intellij.isPluginEnabled
import com.yoavst.graffiti.intellij.models.Info

interface Language {
    val name: String
    fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info?

    fun searchReferencesOrMethodReferences(element: PsiElement): List<PsiReference>? = ReferencesSearch.search(element).findAll().toList()


    companion object {
        private val languages: Map<String, Language>
        init {
            val languages = mutableMapOf<String, Language>()
            if (isPluginEnabled("com.intellij.java")) {
                val lang = newLang("com.yoavst.graffiti.intellij.lang.Java")
                languages[lang.name] = lang
            }
            if (isPluginEnabled("org.jetbrains.kotlin")) {
                val lang = newLang("com.yoavst.graffiti.intellij.lang.Kotlin")
                languages[lang.name] = lang
            }
            if (isPluginEnabled("com.intellij.modules.clion") || isPluginEnabled("com.intellij.clion")) {
                val lang = newLang("com.yoavst.graffiti.intellij.lang.Cpp")
                languages[lang.name] = lang
            }
            if (isPluginEnabled("com.jetbrains.php")) {
                val lang = newLang("com.yoavst.graffiti.intellij.lang.PHP")
                languages[lang.name] = lang
            }

            this.languages = languages
        }

        fun getNodeInfo(element: PsiElement?, psiFile: PsiFile): Info? = languages[psiFile.fileType.name]?.getNodeInfo(element, psiFile)
        fun searchReferencesOrMethodReferences(element: PsiElement, psiFile: PsiFile): List<PsiReference>? =  languages[psiFile.fileType.name]?.searchReferencesOrMethodReferences(element)
        fun supportedLanguages() = languages.keys

        private fun newLang(clazzName: String): Language = Class.forName(clazzName).getDeclaredField("INSTANCE").get(null) as Language
    }
}