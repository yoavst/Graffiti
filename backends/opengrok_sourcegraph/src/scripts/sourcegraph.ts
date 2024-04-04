import { SymbolInfo, SymbolProvider } from "./shared";

export default class SourceGraphProvider implements SymbolProvider {
    isSupported(): boolean {
        return false;
    }
    getCurrentSymbol(x: number, y: number): SymbolInfo | null {
        throw new Error("Method not implemented.");
    }
    getCurrentLineSymbol(x: number, y: number): SymbolInfo | null {
        throw new Error("Method not implemented.");
    }
}
