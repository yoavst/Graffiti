import { SourceType } from "../shared";
import { BaseSymbolProvider } from "../symbol_provider";

export default class GitlabProvider extends BaseSymbolProvider {
    override sourceType: SourceType = "Gitlab";
    override isSupported(): boolean {
        return document.querySelectorAll("#fileHolder").length != 0;
    }
    override getFileName(): string {
        return document.querySelector('[data-testid="file-title-content"]')!.textContent!;
    }
    protected override async getCodeInternal(): Promise<string> {
        return document.querySelector("code")!.textContent!;
    }
    override getCurrentLine(x: number, y: number): number | null {
        let line: number | null = null;
        for (const lineElement of document.querySelectorAll(".file-line-num")) {
            const position = lineElement.getBoundingClientRect();
            if (position.top <= y && position.bottom >= y) {
                line = parseInt((lineElement as HTMLElement).dataset.lineNumber!);
                break;
            }
        }
        return line;
    }
}
