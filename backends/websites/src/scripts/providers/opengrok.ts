import { BaseSymbolInfo, SourceType } from "../shared";
import { BaseSymbolProvider } from "../symbol_provider";

export default class OpenGrokProvider extends BaseSymbolProvider {
    override sourceType: SourceType = "OpenGrok";
    override isSupported(): boolean {
        return document.querySelectorAll("#whole_header").length != 0;
    }
    override getFileName(): string {
        return document.querySelector("#Masthead > a:last-of-type")!.textContent!;
    }
    protected override async getCodeInternal(): Promise<string> {
        const rawSource = document.getElementById("raw")!.parentElement!.getAttribute("href")!;
        const response = await fetch(rawSource);
        return await response.text();
    }
    override getCurrentLine(x: number, y: number): number | null {
        const element = getLineElement(x, y);
        if (element == null) return null;

        return parseInt(element.getAttribute("name")!);
    }

    protected override async getCurrentSymbolBase(x: number, y: number): Promise<BaseSymbolInfo> {
        const fallback = () => super.getCurrentSymbolBase(x, y);

        let c = document.elementFromPoint(x, y);
        if (c == null || !document.getElementById("content")?.contains(c)) throw new Error("Not in opengrok code");
        const par = c.closest(".scope-body, .scope-head");
        if (par == null) return fallback();
        const head = par.classList.contains("scope-body") ? par.previousElementSibling : par;
        if (head == null) return fallback();

        const sig = head.firstChild!;
        let lineElement = head.querySelector("a.l");
        if (lineElement == null) {
            lineElement = head.querySelector("a.hl")!;
        }
        const methodLine = parseInt(lineElement.getAttribute("name")!);

        let sigMinimal = sig.textContent!;
        if (sigMinimal.includes("(")) {
            sigMinimal = sigMinimal.substring(0, sigMinimal.indexOf("(")).trim();
        }

        const line = this.getCurrentLine(x, y);
        if (line == null) throw new Error("Can't find current line");

        return {
            line,
            method: { name: sigMinimal, line: methodLine },
            clazz: null,
        };
    }
}

const getLineElement = (x: number, y: number): HTMLElement | null => {
    let element = document.elementFromPoint(x, y);

    if (element == null || !document.getElementById("content")?.contains(element)) return null;

    while (element && !(element.classList.contains("l") || element.classList.contains("hl"))) {
        element = element.previousElementSibling;
    }

    return element as HTMLElement;
};
