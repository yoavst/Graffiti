import PLazy from "p-lazy";

/* Prefs */
export type TabBehavior = "alwaysNew" | "sameIfExists";

export interface Prefs {
    tabBehavior: TabBehavior;
    token: string;
    lastConnectedServer: string;
}

const PREFS_DEFAULTS: Prefs = {
    tabBehavior: "alwaysNew",
    token: "",
    lastConnectedServer: "ws://localhost:8502",
};

export function getPrefs(onPrefs: (prefs: Prefs) => void) {
    chrome.storage.local
        .get(Object.keys(PREFS_DEFAULTS))
        .then((result) => onPrefs({ ...PREFS_DEFAULTS, ...(result as Partial<Prefs>) }));
}

export function setPrefs(prefs: Partial<Prefs>) {
    chrome.storage.local.set(prefs);
}

export function onPrefsChanged(onPrefs: (prefs: Prefs) => void) {
    chrome.storage.local.onChanged.addListener(function (changes) {
        getPrefs(onPrefs);
    });
}

/* Inner extension messaging */

export interface GetConnectPullResultMessage {
    action: "getConnectionPullResult";
    status: boolean;
}

export interface GetConnectPullRequestMessage {
    action: "getConnectionPullRequest";
}

export interface ConnectPullMessage {
    action: "connectPull";
    addr: string;
}

export interface GetSymbolRequestMessage {
    action: "getSymbolRequest";
    source: "command" | "contextMenu";
    isLine: boolean;
    askForEdgeText: boolean;
}

export interface GetBaseSymbolFromCodeRequestMessage {
    action: "getBaseSymbolFromCodeRequest";
    source: string;
    line: number;
    extension: string;
}

export interface GetBaseSymbolFromCodeResponseMessage {
    action: "getBaseSymbolFromCodeResponse";
    errorMessage: string | null;
    data: BaseSymbolInfo | null;
}

export interface UpdateServerConnectionFromWeb {
    action: "updateServerConnectionFromWeb";
    hostname: string;
    protocol: "ws" | "wss";
}

export type ExtMessage =
    | GetConnectPullRequestMessage
    | GetConnectPullResultMessage
    | ConnectPullMessage
    | GetSymbolRequestMessage
    | GetBaseSymbolFromCodeRequestMessage
    | GetBaseSymbolFromCodeResponseMessage
    | UpdateServerConnectionFromWeb;

export function sendExtMessage(extMsg: ExtMessage): Promise<ExtMessage> {
    return chrome.runtime.sendMessage(extMsg);
}

export function onExtMessage(callback: (msg: ExtMessage) => void) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        callback(msg as ExtMessage);

        sendResponse({});
        return true;
    });
}

export function onExtMessageEx(callback: (msg: ExtMessage, sendResponse: (response: any) => void) => void) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        callback(msg as ExtMessage, sendResponse);
        return true;
    });
}

/* Symbol related types */
export interface SymbolProvider {
    isSupported(): boolean;
    getCurrentSymbol(x: number, y: number): Promise<SymbolInfo>;
    getCurrentLineSymbol(x: number, y: number): Promise<SymbolInfo>;
}

export type SourceType = "OpenGrok" | "SourceGraph" | "Github" | "Gitlab";

export interface LineAndName {
    line: number;
    name: string;
}

export interface BaseSymbolInfo {
    line: number;
    method: LineAndName | null;
    clazz: LineAndName | null;
}

export interface SymbolInfo {
    sourceType: SourceType;
    site: string;
    address: string;
    fileName: string;
    sig: string | null;
    edgeLabel?: string;
    line?: number;
}

export interface SymbolResponse {
    isCorrectWebsite: boolean;
    info: SymbolInfo | null;
}

/* Utils */
export function timeout<T>(prom: Promise<T>, time: number): Promise<T> {
    return Promise.race<T>([prom, new Promise((_r, rej) => setTimeout(rej, time))]);
}

export function reject<T>(): Promise<T> {
    return Promise.reject(new Error());
}

export function lazyPromise<T>(gen: () => Promise<T>): Promise<T> {
    return new PLazy((resolve) => {
        gen().then(resolve, reject);
    });
}

export function isValidUUIDv4(uuid: string): boolean {
    const uuidv4Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i;
    return uuidv4Regex.test(uuid);
}

export function stripUrl(url: string): string {
    const urlWithoutHashBuilder = new URL(url);
    urlWithoutHashBuilder.hash = "";
    urlWithoutHashBuilder.search = "";
    return urlWithoutHashBuilder.toString();
}
