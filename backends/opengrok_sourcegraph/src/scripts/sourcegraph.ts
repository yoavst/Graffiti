import { SourceType } from "./shared";
import { BaseSymbolProvider } from "./symbol_provider";

export default class SourceGraphProvider extends BaseSymbolProvider {
    private providers: BaseSymbolProvider[] = [new SourceGraphProviderV5(), new SourceGraphProviderV4()];
    private supportedProvider: BaseSymbolProvider | null = null;
    override sourceType: SourceType = "SourceGraph";

    override isSupported(): boolean {
        const matchingProvider = this.providers.find((provider) => provider.isSupported());
        if (matchingProvider != undefined) {
            this.supportedProvider = matchingProvider;
            return true;
        }
        return false;
    }

    override getFileName(): string {
        return this.supportedProvider!.getFileName();
    }

    protected override async getCodeInternal(): Promise<string> {
        return this.supportedProvider!.getCode();
    }

    override getCurrentLine(x: number, y: number): number | null {
        return this.supportedProvider!.getCurrentLine(x, y);
    }

    override overrideLine(url: URL, line: number): string {
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

class SourceGraphProviderV4 extends BaseSymbolProvider {
    override sourceType: SourceType = "SourceGraph";
    override isSupported(): boolean {
        return document.querySelectorAll("[class^='BlobPage-module__blob']").length != 0;
    }
    override getFileName(): string {
        return document.querySelector(".test-breadcrumb-part-last")!.textContent!;
    }
    protected override async getCodeInternal(): Promise<string> {
        const rawSource = document.querySelector('a[aria-label="Raw (download file)"]')!.getAttribute("href")!;
        const response = await fetch(rawSource);
        return await response.text();
    }
    override getCurrentLine(x: number, y: number): number | null {
        let line: number | null = null;
        for (const lineElement of document.querySelectorAll(".line")) {
            const position = lineElement.getBoundingClientRect();
            if (position.top <= y && position.bottom >= y) {
                line = parseInt((lineElement as HTMLElement).dataset.line!);
                break;
            }
        }
        return line;
    }
}

class SourceGraphProviderV5 extends BaseSymbolProvider {
    override sourceType: SourceType = "SourceGraph";
    override isSupported(): boolean {
        return document.querySelectorAll(".RepositoryFileTreePage-module__page-content").length != 0;
    }
    override getFileName(): string {
        return document.querySelector(".test-breadcrumb-part-last")!.textContent!;
    }
    protected override getCodeInternal(): Promise<string> {
        const ret = new Promise<string>((resolve, _) => {
            const getCodeListener = (e: Event) => {
                resolve((e as CustomEvent).detail);
            };
            document.addEventListener("graffiti_sourcegraph_getCode_res", getCodeListener);
        });

        document.dispatchEvent(new CustomEvent("graffiti_sourcegraph_getCode_req"));

        return ret;
    }
    override getCurrentLine(x: number, y: number): number | null {
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
}
