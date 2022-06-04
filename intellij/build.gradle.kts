plugins {
    kotlin("jvm") version "1.6.21"
    id("org.jetbrains.intellij") version "1.6.0"
    java
}

group = "com.yoavst.graffiti"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation("com.google.code.gson:gson:2.9.0")
}

// See https://github.com/JetBrains/gradle-intellij-plugin/
intellij {
    version.set("2021.2.4")
    type.set("IC")
    plugins.set(listOf("com.intellij.java"))
}
tasks {
    patchPluginXml {
        changeNotes.set("""
            Add change notes here.<br>
            <em>most HTML tags may be used</em>        """.trimIndent())
    }
}
tasks.getByName<Test>("test") {
    useJUnitPlatform()
}