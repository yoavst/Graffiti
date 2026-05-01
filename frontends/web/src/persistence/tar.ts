// Minimal TAR (USTAR) encoder/decoder — text files only, no symlinks.
// Spec ref: https://www.gnu.org/software/tar/manual/html_node/Standard.html
//
// Each entry is a 512-byte header followed by file content padded to a
// multiple of 512 bytes. Archive ends with two empty 512-byte blocks.

const BLOCK = 512;
const enc = new TextEncoder();
const dec = new TextDecoder();

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + '\0'.repeat(n - s.length);
}

function octal(n: number, len: number): string {
  // TAR uses zero-padded ASCII octal numbers terminated by NUL.
  const s = n.toString(8);
  return s.padStart(len - 1, '0') + '\0';
}

function checksum(header: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < header.length; i++) sum += header[i]!;
  return sum;
}

export interface TarFile {
  name: string;
  content: string;
}

export function packTar(files: TarFile[]): Uint8Array {
  const blocks: Uint8Array[] = [];
  for (const file of files) {
    const data = enc.encode(file.content);
    const header = new Uint8Array(BLOCK);
    // name (100), mode (8), uid (8), gid (8), size (12), mtime (12), checksum (8 spaces -> filled), typeflag (1), linkname (100),
    // magic 'ustar\0' (6), version '00' (2), uname (32), gname (32), devmajor (8), devminor (8), prefix (155), pad (12)
    header.set(enc.encode(pad(file.name, 100)), 0);
    header.set(enc.encode(octal(0o644, 8)), 100);
    header.set(enc.encode(octal(0, 8)), 108);
    header.set(enc.encode(octal(0, 8)), 116);
    header.set(enc.encode(octal(data.length, 12)), 124);
    header.set(enc.encode(octal(Math.floor(Date.now() / 1000), 12)), 136);
    // checksum field - 8 spaces during checksum computation
    for (let i = 148; i < 156; i++) header[i] = 0x20;
    header[156] = '0'.charCodeAt(0); // typeflag = regular file
    header.set(enc.encode('ustar\0'), 257);
    header.set(enc.encode('00'), 263);
    const c = checksum(header);
    header.set(enc.encode(octal(c, 8).slice(0, -1) + '\0' + ' '), 148);
    blocks.push(header);
    blocks.push(data);
    const padBytes = (BLOCK - (data.length % BLOCK)) % BLOCK;
    if (padBytes > 0) blocks.push(new Uint8Array(padBytes));
  }
  blocks.push(new Uint8Array(BLOCK), new Uint8Array(BLOCK));
  const total = blocks.reduce((acc, b) => acc + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of blocks) {
    out.set(b, off);
    off += b.length;
  }
  return out;
}

export function unpackTar(buf: ArrayBuffer): TarFile[] {
  const data = new Uint8Array(buf);
  const out: TarFile[] = [];
  let offset = 0;
  while (offset + BLOCK <= data.length) {
    const header = data.subarray(offset, offset + BLOCK);
    if (header.every((b) => b === 0)) break;
    const name = readString(header, 0, 100);
    const sizeStr = readString(header, 124, 12).trim();
    const size = parseInt(sizeStr || '0', 8);
    if (!name) {
      offset += BLOCK;
      continue;
    }
    offset += BLOCK;
    const content = dec.decode(data.subarray(offset, offset + size));
    out.push({ name, content });
    offset += size;
    const pad = (BLOCK - (size % BLOCK)) % BLOCK;
    offset += pad;
  }
  return out;
}

function readString(buf: Uint8Array, start: number, len: number): string {
  const slice = buf.subarray(start, start + len);
  const end = slice.indexOf(0);
  return dec.decode(slice.subarray(0, end < 0 ? len : end));
}

export function isTarBuffer(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 263) return false;
  const view = new DataView(buf);
  let s = '';
  for (let i = 257; i < 262; i++) s += String.fromCharCode(view.getUint8(i));
  return s === 'ustar';
}
