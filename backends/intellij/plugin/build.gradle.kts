plugins {
    kotlin("jvm") version "2.0.0"
    id("org.jetbrains.intellij") version "1.17.4"
    java
}

group = "com.yoavst.graffiti"
version = "1.17.0"

repositories {
    mavenCentral()
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
}

// See https://github.com/JetBrains/gradle-intellij-plugin/
intellij {
    version.set("2022.1.1")
    type.set("IC")
    updateSinceUntilBuild.set(false)
}
