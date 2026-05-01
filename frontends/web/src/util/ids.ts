import { v4 as uuidv4 } from 'uuid';

const UUID_V4_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function newId(): string {
  return uuidv4();
}

export function newShortId(): string {
  // 12 hex chars from a UUIDv4
  return uuidv4().replace(/-/g, '').slice(0, 12);
}

export function isValidUuidV4(s: string): boolean {
  return UUID_V4_RE.test(s);
}

export function generateAuthToken(): string {
  return uuidv4();
}
