package com.yoavst.graffiti.intellij

import com.intellij.openapi.diagnostic.Logger
import java.io.File
import java.util.*

private val logger = Logger.getInstance(EnableGraffitiSyncAction::class.java)

private fun getTokenBaseDir() = File(System.getProperty("user.home"), ".graffiti")

private fun getTokenPath(): File {
    val baseDir = getTokenBaseDir()
    baseDir.mkdirs()
    return File(baseDir, "token")
}
private fun validateToken(token: String): Boolean = try {
    UUID.fromString(token).version() == 4
} catch (ignored: IllegalArgumentException){
    false
}

private fun getTokenFromFile(): String? {
    val tokenFile = getTokenPath()
    if (!tokenFile.exists()) return null
    val token = tokenFile.readText().trim()
    return when {
        token.isEmpty() -> {
            logger.info("token file is empty!")
            null
        }
        !validateToken(token) -> {
            logger.info("Token is not valid uuid v4: $token")
            null
        }
        else -> {
            token
        }
    }
}

fun saveTokenToFile(token: String) {
    getTokenPath().writeText(token)
}

fun getTokenOrElse(askForToken: () -> String?): String? {
    val fileToken = getTokenFromFile()
    if (fileToken != null) return fileToken

    val inputToken = askForToken()
    return when {
        inputToken == null -> {
            logger.info("Authentication canceled")
            null
        }
        !validateToken(inputToken) -> {
            logger.info("Token is not valid uuid v4: $inputToken")
            null
        }
        else -> {
            saveTokenToFile(inputToken)
            inputToken
        }
    }
}