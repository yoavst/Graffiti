plugins {
    kotlin("jvm") version "2.0.0"
    id("org.jetbrains.intellij") version "1.17.4"
    id("java-library")
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation(project(":base"))
}

intellij {
    version.set("2022.1.1")
    type.set("IC")
    plugins.set(listOf("com.intellij.java"))
    updateSinceUntilBuild.set(false)
}

tasks{
    buildSearchableOptions {
        enabled = false
    }
    runIde{
        enabled = false
    }
}