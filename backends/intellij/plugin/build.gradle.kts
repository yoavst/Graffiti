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

    intellijPlatform {
        intellijIdeaCommunity("2024.2.3")
        instrumentationTools()
        pluginVerifier()

        pluginModule(implementation(project(":base")))
        pluginModule(implementation(project(":java")))
        pluginModule(implementation(project(":kotlin")))
        pluginModule(implementation(project(":php")))
        pluginModule(implementation(project(":cpp")))
        pluginModule(implementation(project(":go")))
        pluginModule(implementation(project(":python")))
        pluginModule(implementation(project(":ruby")))
    }
}

intellijPlatform {
    pluginConfiguration {
        ideaVersion {
            sinceBuild = "223.*"
        }
    }
}