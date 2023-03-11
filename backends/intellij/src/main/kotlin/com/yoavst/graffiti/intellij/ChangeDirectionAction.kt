package com.yoavst.graffiti.intellij

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent

class ChangeDirectionAction : AnAction() {
    override fun update(event: AnActionEvent) {
        event.presentation.isEnabledAndVisible = event.project != null
    }

    override fun actionPerformed(e: AnActionEvent) {
        AddToGraffitiAction.direction = !AddToGraffitiAction.direction
    }
}