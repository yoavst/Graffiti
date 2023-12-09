plugins {
    kotlin("jvm") version "1.6.21"
    id("org.jetbrains.intellij") version "1.13.3"
    java
}

group = "com.yoavst.graffiti"
version = "1.8.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation("com.google.code.gson:gson:2.9.0")
}

// See https://github.com/JetBrains/gradle-intellij-plugin/
intellij {
    version.set("2022.1.1")
    type.set("IC")
    plugins.set(listOf("com.intellij.java", "org.jetbrains.kotlin"))
    updateSinceUntilBuild.set(false)
}

tasks.getByName<Test>("test") {
    useJUnitPlatform()
}