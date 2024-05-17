# Graffiti for Ghidra
Based on [this](https://github.com/fmagin/ghidra-kotlin-extension-template) template for Gradle Ghidra project.

## Setup
* Add the line `GHIDRA_INSTALL_DIR=/path/to/your/ghidra_XXX_PUBLIC/` to `$HOME/.gradle/gradle.properties`
* Open IntelliJ, create a new `Project from Existing Sources...` and select the `build.gradle`
* Run the task gradle:build_extension
* Then, use Run Ghidra from the IDE to launch ghidra with the plugin installed.