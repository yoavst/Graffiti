import { describe, expect, it } from 'vitest';
import { isTarBuffer, packTar, unpackTar } from './tar';

describe('tar', () => {
  it('round-trips files', () => {
    const files = [
      { name: 'a.json', content: '{"x":1}' },
      { name: 'longer-name.json', content: 'a'.repeat(1024) },
    ];
    const bytes = packTar(files);
    expect(isTarBuffer(bytes.buffer as ArrayBuffer)).toBe(true);
    const out = unpackTar(bytes.buffer as ArrayBuffer);
    expect(out).toEqual(files);
  });
});
