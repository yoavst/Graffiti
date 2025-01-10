.SHELLFLAGS := -ec

# Load version
FILE := version.txt
ifeq ($(wildcard $(FILE)),)
$(error File $(FILE) does not exist)
else
VERSION := $(shell cat $(FILE))
export VERSION
endif

.PHONY: *

all: pre-package web-collect

pre-package: init server backends frontends web

clean:
	rm -rf out

init:
	mkdir -p out

backends: jeb intellij ida ghidra vscode websites jadx
frontends: web visio

ida: 
	@echo "Building Graffiti for IDA"
	echo "# Graffiti for IDA, Version: $(VERSION)" > graffiti.py
	python3 -m pybunch -d backends/ida -e graffiti -so -o graffiti.py
	zip -j out/graffiti_v$(VERSION)_for_ida.zip graffiti.py
	rm graffiti.py

jadx:
	@echo "Building Graffiti for Jadx"
	
	@echo "Updating the version in build.gradle.kts"
	sed -i 's/version = "[^"]*"/version = "$(VERSION)"/' backends/jadx/build.gradle.kts

	@echo "Compiling the plugin"
	cd backends/jadx && ./gradlew dist

	@echo "Copying the file"
	cp backends/jadx/build/dist/jadx-$(VERSION).jar out/graffiti_v$(VERSION)_for_jadx.jar


jeb_packed_%:
	@echo Packing $*
	mkdir -p backends/jeb/packed && \
	( (cat backends/jeb/$*.py | awk '/^#/ {print} !/^#/ {exit}') &&\
	   echo && echo &&\
	   python3 -m pybunch -d backends/jeb -e $* -so ) | cat > backends/jeb/packed/$*.py

JEB_SCRIPTS := $(shell grep -rlP '^#\?' backends/jeb | sed 's/.*\///;s/\.[^.]*$$//')

jeb: $(addprefix jeb_packed_, $(JEB_SCRIPTS))
	@echo "Building Graffiti for JEB"
	# We cannot add the beginning of the files, as JEB parses them.
	echo $(VERSION) > .graffiti_version
	zip -j out/graffiti_v$(VERSION)_for_jeb.zip backends/jeb/packed/*.py .graffiti_version
	rm .graffiti_version
	rm -rf backends/jeb/packed

vscode:
	@echo "Building Graffiti for VSCode"

	@echo "Updating the version in package.json"
	cd backends/vscode && npm pkg set version=$(VERSION)

	@echo "npm install"
	cd backends/vscode && npm install

	@echo "Compiling the extension"
	cd backends/vscode && npx @vscode/vsce package

	@echo "Moving the file"
	mv backends/vscode/graffiti-$(VERSION).vsix out/graffiti_v$(VERSION)_for_vscode.vsix

intellij:
	@echo "Building Graffiti for Intellij"
	
	@echo "Updating the version in build.gradle.kts"
	sed -i 's/version = "[^"]*"/version = "$(VERSION)"/' backends/intellij/plugin/build.gradle.kts

	@echo "Compiling the extension"
	cd backends/intellij && ./gradlew plugin:buildPlugin

	@echo "Copying the file"
	cp backends/intellij/plugin/build/distributions/plugin-$(VERSION).zip out/graffiti_v$(VERSION)_for_jetbrains.zip

ghidra:
	@echo "Building Graffiti for Ghidra"
ifndef GHIDRA_INSTALL_DIR
	$(error GHIDRA_INSTALL_DIR is undefined, cannot build graffiti for ghidra)
endif
	
	@echo "Updating the version in extension.properties"
	sed -i 's/version=.*/version=$(VERSION)/' backends/ghidra/extension.properties

	@echo "Compiling the extension"
	cd backends/ghidra && ./gradlew buildExtension

	@echo "Copying the file"
	cp backends/ghidra/dist/*.zip out/graffiti_v$(VERSION)_for_ghidra.zip

websites:
	@echo "Building Graffiti for OpenGrok, Sourcegraph, Github and Gitlab"

	@echo "Updating the version in manifest.json and package.json"
	sed -i 's/"version": "[^"]*",/"version": "$(VERSION)",/' backends/websites/public/manifest.json
	cd backends/websites && npm pkg set version=$(VERSION)
	
	@echo "Compile the typescript"
	cd backends/websites && npm install && npm run build

	@echo "Since chrome dropped support for CRXs not from store, just zipping the folder"
	cd backends/websites/dist && zip -r ../../../out/graffiti_v$(VERSION)_for_opengrok_sourcegraph_github_gitlab.zip *

web:
	@echo "Building Graffiti for Web"
	sed -i.bak "s/_VERSION_/$(VERSION)/g" frontends/web/index.html
	cd frontends/web; find -L . -type f ! -name '*.bak' ! -path './out/*' -exec zip --symlinks ../../out/graffiti_v$(VERSION)_frontend_web.zip {} +
	mv frontends/web/index.html.bak frontends/web/index.html

web-collect:
	@echo "Building Graffiti for Web again"
	sed -i.bak "s/_VERSION_/$(VERSION)/g" frontends/web/index.html
	ln -s `realpath out` frontends/web/out
	cd frontends/web; find -L . -type f ! -name '*.bak' -exec zip ../../out/graffiti_v$(VERSION)_frontend_web_with_deps.zip {} +
	mv frontends/web/index.html.bak frontends/web/index.html
	rm frontends/web/out

visio:
	@echo "Building visio via makefile is not yet supported"

server:
	@echo "Updating the version in pyproject.toml"
	sed -i 's/version = "[^"]*"/version = "$(VERSION)"/' server/pyproject.toml
	@echo "Building the graffiti Server"
	mkdir tmp
	python3 -m pip install websockets==10.3.0 --target tmp
	cp -R server/graffiti tmp/
	python3 -m zipapp tmp -m "graffiti.__main__:main_cli" -p "/usr/bin/env python3" -o out/graffiti_v$(VERSION)_server.pyz
	rm -rf tmp
