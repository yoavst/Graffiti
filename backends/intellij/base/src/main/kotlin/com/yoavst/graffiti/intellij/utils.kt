package com.yoavst.graffiti.intellij

import com.intellij.ide.plugins.PluginManagerCore
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.project.Project
import com.intellij.openapi.project.guessProjectDir
import com.intellij.openapi.util.io.FileUtil
import com.intellij.psi.PsiElement
import com.intellij.psi.PsiFile
import java.io.File


fun PsiFile.toPath() = FileUtil.getRelativePath(File(originalFile.project.guessProjectDir()!!.path), File(originalFile.virtualFile.path))
fun PsiElement.toAddress() = containingFile.toPath() + "@" + textOffset

fun String.replaceOffset(newOffset: Int): String = split("@")[0] + "@" + newOffset

fun isPluginEnabled(pluginId: String): Boolean =
    PluginManagerCore.getLoadedPlugins().any { it.pluginId.idString == pluginId }

fun Project.notify(message: String, type: NotificationType) {
    NotificationGroupManager.getInstance()
        .getNotificationGroup("Graffiti Notifications")
        .createNotification(message, type)
        .notify(this)
}

fun getLineNumber(text: String, offset: Int): Int {
    var n = 1
    var curIndex = -1
    while (true) {
        val nextIndex = text.indexOf('\n', curIndex + 1)
        if (nextIndex == -1 || nextIndex > offset) {
            return n
        }

        curIndex = nextIndex
        n++
    }
}