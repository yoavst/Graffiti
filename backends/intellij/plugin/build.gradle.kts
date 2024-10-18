plugins {
    kotlin("jvm") version "2.0.0"
    id("org.jetbrains.intellij.platform") version "2.1.0"
    java
}

group = "com.yoavst.graffiti"
version = "1.17.0"

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation("com.google.code.gson:gson:2.9.0")
    implementation(project(":base"))
    implementation(project(":java"))
    implementation(project(":kotlin"))
    implementation(project(":php"))
    implementation(project(":cpp"))
    implementation(project(":go"))
    implementation(project(":python"))

    intellijPlatform {
        intellijIdeaCommunity("2024.2.3")
        instrumentationTools()
        pluginVerifier()
    }
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "223.*"
        }
    }
}