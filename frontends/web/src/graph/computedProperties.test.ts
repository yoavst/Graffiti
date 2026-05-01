import { describe, expect, it } from 'vitest';
import { applyComputedProperties } from './computedProperties';

describe('applyComputedProperties', () => {
  it('formats a label from extra fields', () => {
    const extra = {
      baseName: 'foo',
      line: 'a4',
      computedProperties: [
        { name: 'label', format: '{0}+{1}', replacements: ['baseName', 'line'] },
      ],
    } as Record<string, unknown>;
    applyComputedProperties(extra as never);
    expect((extra as Record<string, unknown>).label).toBe('foo+a4');
  });

  it('is a no-op when no computed properties', () => {
    const extra = { baseName: 'foo' } as Record<string, unknown>;
    applyComputedProperties(extra as never);
    expect((extra as Record<string, unknown>).label).toBeUndefined();
  });
});
