import { languageFrom } from "./grammar_symbols";
import { SourceType, SymbolInfo, SymbolProvider, stripUrl, timeout } from "./shared";

export interface LineAndName {
    line: number;
    name: string;
}

export interface BaseSymbolInfo {
    line: number;
    method: LineAndName | null;
    clazz: LineAndName | null;
}

export abstract class BaseSymbolProvider implements SymbolProvider {
    abstract sourceType: SourceType;
    abstract isSupported(): boolean;

    abstract getFileName(): string;

    private cacheCode: string | null = null;
    private cachedCodeUrl: string = "";

    protected abstract getCodeInternal(): Promise<string>;
    async getCode(): Promise<string> {
        const currentUrl = stripUrl(document.location.href);
        if (this.cacheCode == null || currentUrl != this.cachedCodeUrl) {
            this.cacheCode = await timeout(this.getCodeInternal(), 2000);
        }
        return this.cacheCode;
    }

    abstract getCurrentLine(x: number, y: number): number | null;

    protected async getCurrentSymbolBase(x: number, y: number): Promise<BaseSymbolInfo> {
        const line = this.getCurrentLine(x, y);
        if (line == null) {
            throw new Error("Failed to get current line");
        }
        const code = await this.getCode();
        const fileName = this.getFileName();
        const extension = getExtension(fileName);

        let language = await languageFrom(code, line, extension);
        if (language == null) {
            throw new Error("graffiti doesn't support the file's language");
        }

        const symbol = language.getBaseSymbolInfo();
        if (symbol == null) throw new Error("Failed get symbol info from language");

        return symbol;
    }

    async getCurrentSymbol(x: number, y: number): Promise<SymbolInfo> {
        const base = await this.getCurrentSymbolBase(x, y);
        if (base.method == null) {
            throw new Error("Failed to detect the current symbol");
        }
        const url = new URL(document.location.href);
        const fileName = this.getFileName();
        const clazz = base.clazz?.name || fileName;
        const info: SymbolInfo = {
            sourceType: this.sourceType,
            site: url.host,
            address: this.overrideLine(url, base.method.line),
            fileName,
            sig: `${clazz}::\n${base.method.name}`,
        };
        return info;
    }

    async getCurrentLineSymbol(x: number, y: number): Promise<SymbolInfo> {
        let base: BaseSymbolInfo;
        try {
            base = await this.getCurrentSymbolBase(x, y);
        } catch (e) {
            const currentLine = this.getCurrentLine(x, y);
            if (currentLine == null) {
                throw new Error("Failed to detect the current line");
            }

            base = {
                method: null,
                clazz: null,
                line: currentLine,
            };
        }

        const fileName = this.getFileName();
        const sig: string = (() => {
            const clazz = base.clazz?.name || fileName;
            if (base.method == null) {
                return `${clazz}:${base.line}`;
            } else {
                return `${clazz}::\n${base.method.name}:${base.line}`;
            }
        })();

        const url = new URL(document.location.href);

        return {
            sourceType: this.sourceType,
            site: url.host,
            address: this.overrideLine(url, base.line),
            fileName,
            sig,
            line: base.line,
        };
    }

    protected overrideLine(url: URL, line: number): string {
        const newUrl = new URL(url);
        newUrl.hash = "#" + line;
        return newUrl.href;
    }
}

const getExtension = (filename: string): string => {
    const fileName = filename;
    const lastIndexOfDot = fileName.lastIndexOf(".");
    if (lastIndexOfDot < 0) throw new Error("Filename without extension");
    return fileName.substring(lastIndexOfDot + 1).toLowerCase();
};
