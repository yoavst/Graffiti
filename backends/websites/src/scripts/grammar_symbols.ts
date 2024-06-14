import Parser from "web-tree-sitter";
import { BaseSymbolInfo, LineAndName } from "./symbol_provider";
import { lazyPromise } from "./shared";

const initParser = (): Promise<void> =>
    Parser.init({
        locateFile(scriptName: string, scriptDirectory: string) {
            return getWasm(scriptName);
        },
    });

export abstract class Language {
    protected tree: Parser.Tree;
    constructor(
        protected code: string,
        // Zero based
        protected line: number,
        language: Parser.Language,
    ) {
        const parser = new Parser();
        parser.setLanguage(language);
        this.tree = parser.parse(code);
    }
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
        node: Parser.SyntaxNode | null,
        force_name: string | null = null,
    ): LineAndName | null {
        if (node == null) return null;
        return {
            name: force_name || this.code.substring(node.startIndex, node.endIndex),
            line: node.startPosition.row + 1,
        };
    }

    protected goToParent(cursor: Parser.TreeCursor, ...types: string[]): boolean {
        while (!types.includes(cursor.nodeType)) {
            if (!cursor.gotoParent()) return false;
        }
        return true;
    }

    protected getCursor(): Parser.TreeCursor {
        // Tries to find a leaf node in the given line, by selecting the first node each time that contains the line
        // If no such leaf, it will select the first parent that should have contained it.
        const cursor = this.tree.walk();
        outer: while (cursor.gotoFirstChild()) {
            do {
                if (cursor.startPosition.row <= this.line - 1 && this.line - 1 <= cursor.endPosition.row) {
                    continue outer;
                }
            } while (cursor.gotoNextSibling());
            // No child in this line, but the parent contains the line
            cursor.gotoParent();
            return cursor;
        }
        // Leaf in this line
        return cursor;
    }

    protected gotoChildForType(cursor: Parser.TreeCursor, type: string, stopAtType?: string): boolean {
        if (!cursor.gotoFirstChild()) return false;
        do {
            if (cursor.nodeType === type) return true;
            else if (cursor.nodeType == stopAtType) break;
        } while (cursor.gotoNextSibling());

        cursor.gotoParent();
        return false;
    }

    protected gotoChildForFieldName(cursor: Parser.TreeCursor, field: string): boolean {
        if (!cursor.gotoFirstChild()) return false;
        do {
            if (cursor.currentFieldName === field) return true;
        } while (cursor.gotoNextSibling());

        cursor.gotoParent();
        return false;
    }

    protected getLineAndNameFromNameField(cursor: Parser.TreeCursor): LineAndName | null {
        if (!this.gotoChildForFieldName(cursor, "name")) {
            return null;
        }

        return this.lineAndNameFromNode(cursor.currentNode);
    }

    protected getLineAndNameFromType(cursor: Parser.TreeCursor, type: string, stopAtType: string): LineAndName | null {
        if (!this.gotoChildForType(cursor, type, stopAtType)) {
            return null;
        }

        return this.lineAndNameFromNode(cursor.currentNode);
    }
}

class Java extends Language {
    static treeSitterLang: Promise<Parser.Language> = lazyPromise(() =>
        initParser().then(() => Parser.Language.load(getWasm("tree-sitter-java.wasm"))),
    );

    protected override getMethod(): LineAndName | null {
        const cursor = this.getCursor();

        if (!this.goToParent(cursor, "method_declaration", "constructor_declaration", "static_initializer"))
            return null;

        if (cursor.nodeType == "method_declaration") {
            return this.getLineAndNameFromNameField(cursor);
        } else if (cursor.nodeType == "static_initializer") {
            return this.lineAndNameFromNode(cursor.currentNode, "<clinit>");
        } else {
            return this.lineAndNameFromNode(cursor.currentNode, "<init>");
        }
    }
    protected override getClass(): LineAndName | null {
        const cursor = this.getCursor();

        if (
            !this.goToParent(
                cursor,
                "class_declaration",
                "interface_declaration",
                "annotation_type_declaration",
                "enum_declaration",
            )
        ) {
            return null;
        }
        return this.getLineAndNameFromNameField(cursor);
    }
}

class Kotlin extends Language {
    static treeSitterLang: Promise<Parser.Language> = lazyPromise(() =>
        initParser().then(() => Parser.Language.load(getWasm("tree-sitter-kotlin.wasm"))),
    );

    protected override getMethod(): LineAndName | null {
        const cursor = this.getCursor();

        if (!this.goToParent(cursor, "function_declaration", "secondary_constructor", "anonymous_initializer"))
            return null;

        if (cursor.nodeType == "function_declaration") {
            return this.getLineAndNameFromType(cursor, "simple_identifier", "function_value_parameters");
        } else if (cursor.nodeType == "secondary_constructor") {
            return this.lineAndNameFromNode(cursor.currentNode, "<init>");
        } else {
            return this.lineAndNameFromNode(cursor.currentNode, "<annon_init>");
        }
    }
    protected override getClass(): LineAndName | null {
        const possibleReceiverName = this.getPossibleExtReceiverName();
        if (possibleReceiverName != null) return possibleReceiverName;

        const cursor = this.getCursor();

        if (!this.goToParent(cursor, "class_declaration")) {
            return null;
        }
        return this.getLineAndNameFromType(cursor, "type_identifier", "type_parameters");
    }

    private getPossibleExtReceiverName(): LineAndName | null {
        const cursor = this.getCursor();
        if (!this.goToParent(cursor, "function_declaration")) {
            return null;
        }

        return this.getLineAndNameFromType(cursor, "user_type", "function_value_parameters");
    }
}

class Cpp extends Language {
    static treeSitterLang: Promise<Parser.Language> = lazyPromise(() =>
        initParser().then(() => Parser.Language.load(getWasm("tree-sitter-cpp.wasm"))),
    );

    private extractName(node: Parser.SyntaxNode): Parser.SyntaxNode {
        let currentNode = node;
        while (true) {
            const name = currentNode.childForFieldName("name");
            if (name == null) break;
            currentNode = name;
        }

        return currentNode;
    }

    protected override getMethod(): LineAndName | null {
        let possibleName = this.getPossibleName();
        if (possibleName == null) return null;
        return this.lineAndNameFromNode(this.extractName(possibleName));
    }
    protected override getClass(): LineAndName | null {
        // Two different ways to declare class:
        // 1. void Class::method() {}
        // 2. class X { void method() {} }

        // Start with the first way
        const possibleName = this.getPossibleName();
        if (possibleName != null) {
            // TODO: support nested scoped
            const scope = possibleName.childForFieldName("scope");
            if (scope != null) {
                return this.lineAndNameFromNode(scope);
            }
        }
        // try the second way
        const cursor = this.getCursor();
        if (!this.goToParent(cursor, "struct_specifier", "union_specifier", "class_specifier")) {
            return null;
        }

        return this.getLineAndNameFromNameField(cursor);
    }

    private getPossibleName(): Parser.SyntaxNode | null {
        const cursor = this.getCursor();
        if (!this.goToParent(cursor, "function_definition", "template_declaration", "field_declaration")) {
            return null;
        }

        const queue = [cursor.currentNode];
        while (queue.length) {
            const current = queue.shift()!;
            for (let child = current.firstChild; child != null; child = child.nextSibling) {
                if (child.type == "function_declarator") {
                    return child.childForFieldName("declarator");
                } else if (child.type.includes("declarator") || child.type.includes("declaration")) {
                    queue.push(child);
                }
            }
        }
        return null;
    }
}

export const languageFrom = async (code: string, line: number, extension: string): Promise<Language | null> => {
    if (extension == "java") {
        return await Java.treeSitterLang.then((lang) => new Java(code, line, lang));
    } else if (extension == "kt" || extension == "kts") {
        return await Kotlin.treeSitterLang.then((lang) => new Kotlin(code, line, lang));
    } else if (["c", "h", "cc", "cpp", "hpp", "hxx", "cxx", "h++", "cppm", "inl", "inc"].includes(extension)) {
        return await Cpp.treeSitterLang.then((lang) => new Cpp(code, line, lang));
    }
    return null;
};

const getWasm = (name: string): string => chrome.runtime.getURL(`wasm/${name}`);
