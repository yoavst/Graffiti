import { describe, expect, it } from 'vitest';
import { HANDLE, handlesForEdgeToComment } from './nodeHandles';

describe('handlesForEdgeToComment', () => {
  it('returns undefined when positions are missing', () => {
    expect(handlesForEdgeToComment(1, 2, new Map())).toBeUndefined();
  });

  it('uses left/right when comment is mostly lateral even if |dy| > |dx| slightly', () => {
    const positions = new Map([
      [1, { x: 400, y: 100, width: 40, height: 20 }],
      [2, { x: 280, y: 120, width: 30, height: 18 }], // left and a bit below
    ]);
    expect(handlesForEdgeToComment(1, 2, positions)).toEqual({
      sourceHandle: HANDLE.srcL,
      targetHandle: HANDLE.tgtR,
    });
  });

  it('uses left/right when horizontal separation dominates', () => {
    const positions = new Map([
      [1, { x: 100, y: 50, width: 40, height: 20 }],
      [2, { x: 0, y: 52, width: 30, height: 18 }], // comment left of source
    ]);
    expect(handlesForEdgeToComment(1, 2, positions)).toEqual({
      sourceHandle: HANDLE.srcL,
      targetHandle: HANDLE.tgtR,
    });
  });

  it('uses right/left when comment is to the right', () => {
    const positions = new Map([
      [1, { x: 0, y: 0, width: 40, height: 20 }],
      [2, { x: 200, y: 2, width: 30, height: 18 }],
    ]);
    expect(handlesForEdgeToComment(1, 2, positions)).toEqual({
      sourceHandle: HANDLE.srcR,
      targetHandle: HANDLE.tgtL,
    });
  });

  it('uses top/bottom when vertical separation clearly dominates', () => {
    const positions = new Map([
      [1, { x: 50, y: 0, width: 40, height: 20 }],
      [2, { x: 52, y: 220, width: 30, height: 18 }],
    ]);
    expect(handlesForEdgeToComment(1, 2, positions)).toEqual({
      sourceHandle: HANDLE.srcB,
      targetHandle: HANDLE.tgtT,
    });
  });

  it('uses bottom/top when comment is above', () => {
    const positions = new Map([
      [1, { x: 50, y: 200, width: 40, height: 20 }],
      [2, { x: 52, y: 0, width: 30, height: 18 }],
    ]);
    expect(handlesForEdgeToComment(1, 2, positions)).toEqual({
      sourceHandle: HANDLE.srcT,
      targetHandle: HANDLE.tgtB,
    });
  });
});
