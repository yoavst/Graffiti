plugins {
    kotlin("jvm") version "1.6.21"
    id("org.jetbrains.intellij") version "1.13.3"
    java
}

group = "com.yoavst.graffiti"
version = "1.12.0"

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
    type.set("CL")
    plugins.set(listOf("com.intellij.clion", "com.intellij.cidr.lang","com.intellij.cidr.base"))
    updateSinceUntilBuild.set(false)
}

tasks.getByName<Test>("test") {
    useJUnitPlatform()
}