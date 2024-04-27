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

backends: jeb intellij clion ida vscode opengrok_sourcegraph jadx
frontends: web visio

ida: 
	@echo "Building Graffiti for IDA"
	echo "# Graffiti for IDA, Version: $(VERSION)" | cat - backends/ida/graffiti.py > graffiti.py
	zip -j out/graffiti_v$(VERSION)_for_ida.zip graffiti.py
	rm graffiti.py

jadx:
	@echo "Building Graffiti for Jadx"
	cp backends/jadx/graffiti.jadx.kts out/graffiti_v$(VERSION).jadx.kts

jeb_packed_%:
	@echo Packing $*
	mkdir -p backends/jeb/packed && \
	( (cat backends/jeb/$*.py | awk '/^#/ {print} !/^#/ {exit}') &&\
	   echo && echo &&\
	   python3 -m pybunch -r backends/jeb -e $* -so ) | cat > backends/jeb/packed/$*.py

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
	sed -i 's/version = "[^"]*"/version = "$(VERSION)"/' backends/intellij/build.gradle.kts

	@echo "Compiling the extension"
	cd backends/intellij && ./gradlew jar

	@echo "Copying the file"
	cp backends/intellij/build/libs/intellij-$(VERSION).jar out/graffiti_v$(VERSION)_for_intellij.jar

clion:
	@echo "Building Graffiti for CLion"
	
	@echo "Updating the version in build.gradle.kts"
	sed -i 's/version = "[^"]*"/version = "$(VERSION)"/' backends/clion/build.gradle.kts

	@echo "Compiling the extension"
	cd backends/clion && ./gradlew jar

	@echo "Copying the file"
	cp backends/clion/build/libs/clion-$(VERSION).jar out/graffiti_v$(VERSION)_for_clion.jar

opengrok_sourcegraph:
	@echo "Building Graffiti for OpenGrok & Sourcegraph"

	@echo "Updating the version in manifest.json and package.json"
	sed -i 's/"version": "[^"]*",/"version": "$(VERSION)",/' backends/opengrok_sourcegraph/public/manifest.json
	cd backends/opengrok_sourcegraph && npm pkg set version=$(VERSION)
	
	@echo "Compile the typescript"
	cd backends/opengrok_sourcegraph && npm install && npm run build

	@echo "Since chrome dropped support for CRXs not from store, just zipping the folder"
	cd backends/opengrok_sourcegraph/dist && zip -r ../../../out/graffiti_v$(VERSION)_for_opengrok_sourcegraph.zip *

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
	@echo "Building the graffiti Server"
	cp server/main.py out/graffiti_v$(VERSION)_server.py