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
}

intellij {
    version.set("2022.1.1")
    type.set("IC")
}

tasks{
    buildSearchableOptions {
        enabled = false
    }
    runIde{
        enabled = false
    }
}