.PHONY: *

all: init backends frontends server

clean:
	rm -rf out

init:
	mkdir -p out

backends: jeb intellij ida vscode opengrok jadx
frontends: web visio

ida: check-env
	@echo "Building Graffiti for IDA"
	echo "# Graffiti for IDA, Version: $(VERSION)" | cat - backends/ida/graffiti.py > out/graffiti_v$(VERSION)_for_ida.py

jadx: check-env
	@echo "Building Graffiti for Jadx"
	cp backends/jadx/graffiti.jadx.kts out/graffiti_v$(VERSION).jadx.kts

jeb: check-env
	@echo "Building Graffiti for JEB"
	# We cannot add the beginning of the files, as JEB parses them.
	echo $(VERSION) > .graffiti_version
	zip -j out/graffiti_v$(VERSION)_for_jeb.zip backends/jeb/*.py .graffiti_version
	rm .graffiti_version

vscode: check-env
	@echo "Building Graffiti for VSCode"

	@echo "Updating the version in package.json"
	cd backends/vscode && npm pkg set version=$(VERSION)

	@echo "Compiling the extension"
	cd backends/vscode && vsce package

	@echo "Moving the file"
	mv backends/vscode/graffiti-$(VERSION).vsix out/graffiti_v$(VERSION)_for_vscode.vsix

intellij: check-env
	@echo "Building Graffiti for Intellij"
	
	@echo "Updating the version in build.gradle.kts"
	sed -i 's/version = "[^"]*"/version = "$(VERSION)"/' backends/intellij/build.gradle.kts

	@echo "Compiling the extension"
	cd backends/intellij && ./gradlew jar

	@echo "Copying the file"
	cp backends/intellij//build/libs/intellij-$(VERSION).jar out/grafffiti_v$(VERSION)_for_intellij.jar

opengrok: check-env
	@echo "Building Graffiti for OpenGrok"
	@echo "Since chrome dropped support for CRXs not from store, just zipping the folder"

	cd backends/opengrok && zip -r ../../out/graffiti_v$(VERSION)_for_opengrok.zip *

web: check-env
	@echo "Building Graffiti for Web"
	sed -i.bak "s/Version _VERSION_/Version $(VERSION)/" frontends/web/index.html
	cd frontends/web; find . -type f ! -name '*.bak' -exec zip ../../out/graffiti_v$(VERSION)_frontend_web.zip {} +
	mv frontends/web/index.html.bak frontends/web/index.html

visio: check-env
	@echo "Building visio via makefile is not yet supported"

server: check-env
	@echo "Building the graffiti Server"
	cp server/main.py out/graffiti_v$(VERSION)_server.py

check-env:
ifndef VERSION
	$(error VERSION environment variable is undefined)
endif