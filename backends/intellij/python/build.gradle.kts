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
    type.set("PC")
    plugins.set(listOf("PythonCore"))
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