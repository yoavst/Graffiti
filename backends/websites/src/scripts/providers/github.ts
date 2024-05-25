import { SourceType } from "../shared";
import { BaseSymbolProvider } from "../symbol_provider";

export default class GithubProvider extends BaseSymbolProvider {
    override sourceType: SourceType = "Github";
    override isSupported(): boolean {
        return document.querySelectorAll("#repo-content-pjax-container").length != 0;
    }
    override getFileName(): string {
        return document.querySelectorAll('[id*="file-name-id"]').item(0).textContent!;
    }
    protected override async getCodeInternal(): Promise<string> {
        return document.getElementById("read-only-cursor-text-area")!.textContent!;
    }
    override getCurrentLine(x: number, y: number): number | null {
        let line: number | null = null;
        for (const lineElement of document.querySelectorAll(".react-line-number")) {
            const position = lineElement.getBoundingClientRect();
            if (position.top <= y && position.bottom >= y) {
                line = parseInt(lineElement.textContent!);
                break;
            }
        }
        return line;
    }
}
