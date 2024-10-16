plugins {
    kotlin("jvm") version "2.0.0"
    id("org.jetbrains.intellij.platform") version "2.1.0"
    id("java-library")
}

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation(project(":base"))
    intellijPlatform {
        intellijIdeaUltimate("2024.2.3")
        plugin("org.jetbrains.plugins.go:242.23339.11")
        instrumentationTools()
    }
}

intellijPlatform {
    buildSearchableOptions.set(false)
}

tasks {
    runIde {
        enabled = false
    }
}