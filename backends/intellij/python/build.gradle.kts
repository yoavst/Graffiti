plugins {
    kotlin("jvm") version "2.0.0"
    id("org.jetbrains.intellij.platform.base") version "2.1.0"
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
        pycharmCommunity("2024.2.3")
        bundledPlugin("PythonCore")
        instrumentationTools()
    }
}