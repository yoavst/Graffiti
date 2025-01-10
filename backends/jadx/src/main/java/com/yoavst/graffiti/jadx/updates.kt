package com.yoavst.graffiti.jadx

import jadx.api.metadata.ICodeNodeRef
import jadx.core.dex.nodes.FieldNode
import jadx.core.dex.nodes.MethodNode
import java.lang.IllegalArgumentException

fun ICodeNodeRef.toAddress(): String {
    return when (this) {
        is MethodNode -> "1|${parentClass.classInfo.fullName}|${methodInfo.shortId}"
        is FieldNode -> "2|${parentClass.classInfo.fullName}|${fieldInfo.shortId}"
        else -> throw IllegalArgumentException("Should not be called with a node that is not a method nor field")
    }
}

fun createUpdate(node: ICodeNodeRef, projectName: String): Map<String, Any>? {
    return when (node) {
        is MethodNode -> {
            val methodName = if (node.isConstructor) "\$init" else node.alias
            val classAddress = node.parentClass.fullName

            createMethodUpdate(
                projectName = projectName,
                className = node.parentClass.alias,
                methodName = methodName,
                classAddress = classAddress,
                address = node.toAddress()
            )
        }

        is FieldNode -> {
            val classAddress = node.parentClass.fullName

            createFieldUpdate(
                projectName = projectName,
                className = node.parentClass.alias,
                fieldName = node.alias,
                classAddress = classAddress,
                address = node.toAddress()
            )
        }

        else -> null
    }
}

fun createMethodUpdate(
    projectName: String,
    className: String,
    classAddress: String,
    methodName: String,
    address: String,
): MutableMap<String, Any> {
    return mutableMapOf(
        "type" to "addData",
        "node" to mapOf(
            "project" to "Jadx: $projectName",
            "class" to className,
            "classAddress" to classAddress,
            "method" to methodName,
            "address" to address,
            "computedProperties" to arrayOf(
                mapOf(
                    "name" to "label",
                    "format" to "{0}::\n{1}",
                    "replacements" to arrayOf("class", "method"),
                ),
            ),
        ),
    )
}

fun createFieldUpdate(
    projectName: String,
    className: String,
    classAddress: String,
    fieldName: String,
    address: String,
): MutableMap<String, Any> {
    return mutableMapOf(
        "type" to "addData",
        "node" to mapOf(
            "project" to "Jadx: $projectName",
            "class" to className,
            "classAddress" to classAddress,
            "field" to fieldName,
            "address" to address,
            "computedProperties" to arrayOf(
                mapOf(
                    "name" to "label",
                    "format" to "{0}::\n_{1}",
                    "replacements" to arrayOf("class", "field"),
                ),
            ),
        ),
    )
}
