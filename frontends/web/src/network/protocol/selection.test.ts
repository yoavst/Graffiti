import { describe, expect, it } from 'vitest';
import { matchesSelection } from './selection';

describe('matchesSelection', () => {
  const extra = { baseAddress: '0x1234', project: 'IDA: a.bin', baseName: 'sub_1234' };

  it('v1: ANDs all clauses', () => {
    expect(matchesSelection(extra, [['baseAddress', '0x1234']], 1)).toBe(true);
    expect(
      matchesSelection(
        extra,
        [
          ['baseAddress', '0x1234'],
          ['project', 'IDA: a.bin'],
        ],
        1,
      ),
    ).toBe(true);
    expect(
      matchesSelection(
        extra,
        [
          ['baseAddress', '0x1234'],
          ['project', 'IDA: other.bin'],
        ],
        1,
      ),
    ).toBe(false);
  });

  it('v2: OR of ANDs', () => {
    expect(
      matchesSelection(
        extra,
        [
          [['baseAddress', '0x9999']],
          [['baseAddress', '0x1234']],
        ],
        2,
      ),
    ).toBe(true);
  });

  it('returns false when key missing', () => {
    expect(matchesSelection(extra, [['nonexistent', 'x']], 1)).toBe(false);
  });
});
