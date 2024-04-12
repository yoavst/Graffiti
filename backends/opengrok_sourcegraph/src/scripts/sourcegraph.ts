import { SymbolInfo, SymbolProvider, timeout, reject } from "./shared";
import { parser as CppParser } from "@lezer/cpp";
import { parser as JavaParser } from "@lezer/java";
import { TreeCursor, Tree, SyntaxNode } from "@lezer/common";

export default class SourceGraphProvider implements SymbolProvider {
    isSupported(): boolean {
        return document.querySelectorAll(".RepositoryFileTreePage-module__page-content").length != 0;
    }
    getCurrentSymbol(x: number, y: number): Promise<SymbolInfo> {
        return this.getCurrentSymbolBase(x, y).then((base) => {
            if (base.method == null) {
                return reject();
            }

            const url = new URL(document.location.href);
            const fileName = this.getFilename();
            const clazz = base.clazz?.name || fileName;
            // const sig = (() => {
            //     if (base.method.name.includes("::"))
            // })()
            return {
                sourceType: "SourceGraph",
                site: url.host,
                address: this.overrideLine(url, base.method.line),
                fileName,
                sig: `${clazz}::\n${base.method.name}`,
            };
        });
    }
    getCurrentLineSymbol(x: number, y: number): Promise<SymbolInfo> {
        return this.getCurrentSymbolBase(x, y)
            .catch<BaseSymbolInfo>(() => {
                // Line nodes should support unsupported languages as well
                const currentLine = this.getCurrentLine(y);
                if (currentLine == null) {
                    return reject();
                }

                return {
                    method: null,
                    clazz: null,
                    line: currentLine,
                };
            })
            .then((base) => {
                const fileName = this.getFilename();
                const sig: string = (() => {
                    const clazz = base.clazz?.name || fileName;
                    if (base.method == null) {
                        return `${clazz}:${base.line}`;
                    } else {
                        return `${clazz}::\n${base.method.name}:${base.line}`;
                    }
                })();

                const url = new URL(document.location.href);

                return Promise.resolve({
                    sourceType: "SourceGraph",
                    site: url.host,
                    address: this.overrideLine(url, base.line),
                    fileName: this.getFilename(),
                    sig,
                    line: base.line,
                });
            });
    }

    private getCurrentSymbolBase(x: number, y: number): Promise<BaseSymbolInfo> {
        // Get line
        const currentLine = this.getCurrentLine(y);
        if (currentLine == null) {
            return reject();
        }

        const ret = timeout<string>(
            new Promise((resolve, _) => {
                const getCodeListener = (e: Event) => {
                    const code: string = (e as CustomEvent).detail;
                    resolve(code);
                };
                document.addEventListener("graffiti_sourcegraph_getCode_res", getCodeListener);
            }),
            1000,
        ).then<BaseSymbolInfo>((code) => {
            const userPos = findNthLineBreakIndex(code, currentLine + 1) - 1;

            const fileName = this.getFilename();
            const lastIndexOfDot = fileName.lastIndexOf(".");
            if (lastIndexOfDot < 0) return reject();
            const ext = fileName.substring(lastIndexOfDot + 1).toLowerCase();

            let language: Language;
            if (ext == "java") {
                language = new Java(code, currentLine, userPos);
            } else if (["c", "h", "cc", "cpp", "hpp", "hxx", "cxx", "h++", "cppm", "inl", "inc"].includes(ext)) {
                language = new Cpp(code, currentLine, userPos);
            } else {
                return reject();
            }

            const symbol = language.getBaseSymbolInfo();
            if (symbol == null) return reject();
            else return Promise.resolve(symbol);
        });

        document.dispatchEvent(new CustomEvent("graffiti_sourcegraph_getCode_req"));

        return ret;
    }

    private getCurrentLine(y: number): number | null {
        let line: number | null = null;
        for (const lineElement of document.querySelectorAll(".cm-gutterElement")) {
            const position = lineElement.getBoundingClientRect();
            if (position.top <= y && position.bottom >= y) {
                line = parseInt(lineElement.textContent!);
                break;
            }
        }
        return line;
    }

    private getFilename(): string {
        return document.querySelector(".test-breadcrumb-part-last")!.textContent!;
    }

    private overrideLine(url: URL, line: number): string {
        var urlObj = new URL(url);
        var params = urlObj.searchParams;

        let existingLineParam: string | null = null;
        for (const [key, _] of params.entries()) {
            if (key.startsWith("L")) {
                existingLineParam = key;
                break;
            }
        }

        if (existingLineParam != null) {
            params.delete(existingLineParam);
        }
        urlObj.hash = line.toString();

        return urlObj.href;
    }
}

interface LineAndName {
    line: number;
    name: string;
}

interface BaseSymbolInfo {
    line: number;
    method: LineAndName | null;
    clazz: LineAndName | null;
}

abstract class Language {
    protected tree: Tree;
    constructor(
        protected code: string,
        protected line: number,
        protected position: number,
    ) {
        this.tree = this.parse(code);
    }
    protected abstract parse(code: string): Tree;
    protected abstract getMethod(): LineAndName | null;
    protected abstract getClass(): LineAndName | null;

    public getBaseSymbolInfo(): BaseSymbolInfo {
        return {
            line: this.line,
            method: this.getMethod(),
            clazz: this.getClass(),
        };
    }

    protected lineAndNameFromNode(
        node: SyntaxNode | TreeCursor | null,
        force_name: string | null = null,
    ): LineAndName | null {
        if (node == null) return null;
        return {
            name: force_name || this.code.substring(node.from, node.to),
            line: findIndexOfLineBreakFromIndex(this.code, node.from),
        };
    }

    protected goToParent(cursor: TreeCursor, ...types: string[]): boolean {
        while (!types.includes(cursor.name)) {
            if (cursor.type.isTop) return false;
            cursor.parent();
        }
        return true;
    }
}

class Java extends Language {
    protected parse(code: string): Tree {
        return JavaParser.parse(code);
    }
    protected getMethod(): LineAndName | null {
        const cursor = this.tree.cursorAt(this.position);

        if (!this.goToParent(cursor, "MethodDeclaration", "ConstructorDeclaration", "StaticInitializer")) return null;
        if (cursor.name == "MethodDeclaration") {
            /*
            MethodDeclaration { Modifiers? methodHeader (Block | ";") }
            methodHeader { (TypeParameters annotation*)? unannotatedType methodDeclarator Throws? }
            methodDeclarator { Definition FormalParameters Dimension* }
            Definition { identifier ~identifier | capitalIdentifier ~identifier }
            */
            return this.lineAndNameFromNode(cursor.node.getChild("Definition"));
        } else if (cursor.name == "StaticInitializer") {
            return this.lineAndNameFromNode(cursor, "<clinit>");
        } else {
            return this.lineAndNameFromNode(cursor, "<init>");
        }
    }
    protected getClass(): LineAndName | null {
        const cursor = this.tree.cursorAt(this.position);

        if (
            !this.goToParent(
                cursor,
                "ClassDeclaration",
                "InterfaceDeclaration",
                "AnnotationTypeDeclaration",
                "EnumDeclaration",
            )
        )
            return null;

        if (cursor.name == "AnnotationTypeDeclaration") {
            /*
            AnnotationTypeDeclaration { Modifiers? "@interface" Identifier AnnotationTypeBody }
            */
            return this.lineAndNameFromNode(cursor.node.getChild("Identifier"));
        } else {
            /*
            ClassDeclaration { Modifiers? kw<"class"> Definition TypeParameters? Superclass? SuperInterfaces? ClassBody }
            InterfaceDeclaration { Modifiers? kw<"interface"> Definition TypeParameters? ExtendsInterfaces? InterfaceBody }
            EnumDeclaration { Modifiers? kw<"enum"> Definition SuperInterfaces? EnumBody }
    
            Definition { identifier ~identifier | capitalIdentifier ~identifier }
            */
            return this.lineAndNameFromNode(cursor.node.getChild("Definition"));
        }
    }
}

class Cpp extends Language {
    protected parse(code: string): Tree {
        return CppParser.parse(code);
    }
    protected getMethod(): LineAndName | null {
        let possibleName = this.getPossibleName();
        if (possibleName == null) return null;
        if (possibleName.name.toLowerCase().includes("scope")) {
            possibleName = possibleName.lastChild;
        }
        return this.lineAndNameFromNode(possibleName);
    }
    protected getClass(): LineAndName | null {
        // Two different ways to declare class:
        // 1. void Class::method() {}
        // 2. class X { void method() {} }

        // Start with the first way
        const possibleName = this.getPossibleName();
        if (possibleName == null || !possibleName.name.toLowerCase().includes("scope")) {
            // try the second way
            const cursor = this.tree.cursorAt(this.position);
            if (!this.goToParent(cursor, "StructSpecifier", "UnionSpecifier", "ClassSpecifier")) return null;
            cursor.firstChild();
            while (!cursor.name.includes("Identifier") && cursor.nextSibling()) {}
            if (cursor.name.includes("Identifier")) {
                return this.lineAndNameFromNode(cursor);
            }
            return null;
        } else {
            return this.lineAndNameFromNode(possibleName.firstChild);
        }
    }

    private getPossibleName(): SyntaxNode | null {
        const cursor = this.tree.cursorAt(this.position);
        if (!this.goToParent(cursor, "FunctionDefinition", "TemplateDeclaration")) {
            return null;
        }

        const queue = [cursor.node];
        while (queue.length) {
            const current = queue.shift()!;
            for (let child = current.firstChild; child != null; child = child.nextSibling) {
                if (child.name == "FunctionDeclarator") {
                    return child.firstChild;
                } else if (child.name.includes("Declarator") || child.name.includes("Declaration")) {
                    queue.push(child);
                }
            }
        }
        return null;
    }
}

function findNthLineBreakIndex(input: string, n: number): number {
    let lineBreakCount = 0;
    let index = 0;

    if (n == 1) return 0;

    while (index < input.length) {
        if (input[index] === "\n") {
            lineBreakCount++;
            if (lineBreakCount === n - 1) {
                return index;
            }
        }
        index++;
    }
    return -1;
}

function findIndexOfLineBreakFromIndex(input: string, n: number): number {
    let lineBreakCount = 0;
    for (let i = 0; i < n; i++) {
        if (input[i] == "\n") {
            lineBreakCount++;
        }
    }
    return lineBreakCount + 1;
}
