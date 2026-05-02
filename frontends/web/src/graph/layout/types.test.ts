import { describe, expect, it } from 'vitest';
import { wrapLabelLines } from './types';

/** Fixed “glyph width” for deterministic wrapping tests. */
function monospaceWidth(charW: number): (s: string) => number {
  return (s: string) => [...s].length * charW;
}

describe('wrapLabelLines', () => {
  it('wraps a long single line to the content width cap', () => {
    const m = monospaceWidth(8);
    const maxContent = 80;
    const lines = wrapLabelLines('aaaa bbbb cccc dddd', maxContent, m);
    expect(lines.length).toBeGreaterThan(1);
    for (const ln of lines) {
      expect(m(ln)).toBeLessThanOrEqual(maxContent + 0.001);
    }
  });

  it('preserves explicit blank lines between paragraphs', () => {
    const m = monospaceWidth(8);
    const lines = wrapLabelLines('aa\n\nbb', 100, m);
    expect(lines).toEqual(['aa', '', 'bb']);
  });

  it('breaks an oversized token by character', () => {
    const m = monospaceWidth(10);
    const lines = wrapLabelLines('abcdefghij', 35, m);
    expect(lines.length).toBeGreaterThan(1);
  });
});
