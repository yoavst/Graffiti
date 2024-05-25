import { parser as CppParser } from "@lezer/cpp";
import { parser as JavaParser } from "@lezer/java";
import { TreeCursor, Tree, SyntaxNode } from "@lezer/common";
import { BaseSymbolInfo, LineAndName } from "./symbol_provider";

export abstract class Language {
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
    protected override parse(code: string): Tree {
        return JavaParser.parse(code);
    }
    protected override getMethod(): LineAndName | null {
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
    protected override getClass(): LineAndName | null {
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
    protected override parse(code: string): Tree {
        return CppParser.parse(code);
    }
    protected override getMethod(): LineAndName | null {
        let possibleName = this.getPossibleName();
        if (possibleName == null) return null;
        if (possibleName.name.toLowerCase().includes("scope")) {
            possibleName = possibleName.lastChild;
        }
        return this.lineAndNameFromNode(possibleName);
    }
    protected override getClass(): LineAndName | null {
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

export const languageFrom = (code: string, line: number, extension: string): Language | null => {
    const userPos = findNthLineBreakIndex(code, line + 1) - 1;
    let language: Language | null = null;
    if (extension == "java") {
        language = new Java(code, line, userPos);
    } else if (["c", "h", "cc", "cpp", "hpp", "hxx", "cxx", "h++", "cppm", "inl", "inc"].includes(extension)) {
        language = new Cpp(code, line, userPos);
    }
    return language;
};

const findNthLineBreakIndex = (input: string, n: number): number => {
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
};

const findIndexOfLineBreakFromIndex = (input: string, n: number): number => {
    let lineBreakCount = 0;
    for (let i = 0; i < n; i++) {
        if (input[i] == "\n") {
            lineBreakCount++;
        }
    }
    return lineBreakCount + 1;
};
