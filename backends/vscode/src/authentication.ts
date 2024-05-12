import { homedir } from "os";
import * as fs from "fs";
import * as path from "path";
import { debugChannel } from "./extension";

function getTokenBaseDir(): string {
  return path.join(homedir(), ".graffiti");
}

function getTokenPath(): string {
  const baseDir = getTokenBaseDir();
  mkdirsSync(baseDir);
  return path.join(baseDir, "token");
}

function validateToken(token: string): boolean {
  return isValidUUIDv4(token);
}

function getTokenFromFile(): string | null {
  const tokenPath = getTokenPath();
  if (fs.existsSync(tokenPath)) {
    const token = fs.readFileSync(tokenPath, "utf-8")?.trim();
    if (!token || token.length == 0) {
      debugChannel.appendLine("Token file is empty!");
      return null;
    } else if (!validateToken(token)) {
      debugChannel.appendLine(`Token is not valid uuid v4: ${token}`);
      return null;
    } else {
      return token;
    }
  }
}

function saveTokenToFile(token: string) {
  fs.writeFileSync(getTokenPath(), token, "utf-8");
}

export function getTokenOrElse(
  askForToken: () => Thenable<string | null>,
): Thenable<string | null> {
  const tokenFromFile = getTokenFromFile();
  if (tokenFromFile != null) return Promise.resolve(tokenFromFile);
  return askForToken().then((inputToken) => {
    if (inputToken == null) {
      debugChannel.appendLine("Authentication canceled");
      return null;
    } else if (!isValidUUIDv4(inputToken)) {
      debugChannel.appendLine(`Token is not valid uuid v4: ${inputToken}`);
      return null;
    } else {
      saveTokenToFile(inputToken);
      return inputToken;
    }
  });
}

function mkdirsSync(dirPath: string): void {
  const parts = dirPath.split(path.sep);
  for (let i = 1; i <= parts.length; i++) {
    const current = path.join(...parts.slice(0, i));
    if (!fs.existsSync(current)) {
      fs.mkdirSync(current);
    }
  }
}

function isValidUUIDv4(uuid: string): boolean {
  const uuidv4Regex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i;
  return uuidv4Regex.test(uuid);
}
