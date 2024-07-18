package com.yoavst.graffiti.intellij.models

enum class MemberType(val prefix: String) {
    Field("_"), Method("");

    fun toName() = when (this) {
        Field -> "field"
        Method -> "method"
    }
}