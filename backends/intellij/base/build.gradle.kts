plugins {
    kotlin("jvm") version "2.0.0"
    id("org.jetbrains.intellij.platform.base") version "2.3.0"
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
    intellijPlatform {
        intellijIdeaCommunity("2022.3")
        instrumentationTools()
    }
}