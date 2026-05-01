import { describe, expect, it } from 'vitest';
import {
  applyAndRecord,
  applyTransaction,
  descendants,
  makeGraphDoc,
  makeHistory,
  nextId,
  redo,
  undo,
  type Op,
} from './reducer';

function makeNode(id: number, label = `n${id}`) {
  return { id, label, extra: {} };
}

describe('graph reducer', () => {
  it('addNode/removeNode roundtrip via undo/redo', () => {
    const doc = makeGraphDoc();
    const history = makeHistory();
    const id = nextId(doc);
    applyAndRecord(doc, history, { type: 'addNode', data: makeNode(id) });
    expect(doc.nodes).toHaveLength(1);

    undo(doc, history);
    expect(doc.nodes).toHaveLength(0);

    redo(doc, history);
    expect(doc.nodes).toHaveLength(1);
  });

  it('transaction collapses to single undo step', () => {
    const doc = makeGraphDoc();
    const history = makeHistory();
    const a = nextId(doc);
    const b = nextId(doc);
    const c = nextId(doc);
    const ops: Op[] = [
      { type: 'addNode', data: makeNode(a) },
      { type: 'addNode', data: makeNode(b) },
      { type: 'addEdge', data: { id: c, from: a, to: b } },
    ];
    applyTransaction(doc, history, ops);

    expect(doc.nodes).toHaveLength(2);
    expect(doc.edges).toHaveLength(1);

    undo(doc, history);
    expect(doc.nodes).toHaveLength(0);
    expect(doc.edges).toHaveLength(0);

    redo(doc, history);
    expect(doc.nodes).toHaveLength(2);
    expect(doc.edges).toHaveLength(1);
  });

  it('descendants is cycle-safe', () => {
    const doc = makeGraphDoc();
    const history = makeHistory();
    for (const id of [1, 2, 3, 4]) {
      applyAndRecord(doc, history, { type: 'addNode', data: makeNode(id) });
    }
    let eId = 100;
    for (const [from, to] of [
      [1, 2],
      [2, 3],
      [3, 1], // cycle back to 1
      [3, 4],
    ] as const) {
      applyAndRecord(doc, history, {
        type: 'addEdge',
        data: { id: eId++, from, to },
      });
    }

    const desc = descendants(doc, 1);
    expect(desc).toEqual(new Set([1, 2, 3, 4]));
  });

  it('setExtra triggers computed-properties recompute', () => {
    const doc = makeGraphDoc();
    const history = makeHistory();
    const id = nextId(doc);
    const node = {
      id,
      label: 'foo',
      extra: {
        baseName: 'foo',
        computedProperties: [
          { name: 'label', format: '{0}', replacements: ['baseName'] },
        ],
      },
    };
    applyAndRecord(doc, history, { type: 'addNode', data: node });
    applyAndRecord(doc, history, {
      type: 'setExtra',
      id,
      key: 'baseName',
      oldValue: 'foo',
      newValue: 'bar',
    });
    expect(doc.nodes[0]!.label).toBe('bar');
  });

  it('swapIds rewires both edges', () => {
    const doc = makeGraphDoc();
    const history = makeHistory();
    for (const id of [1, 2]) {
      applyAndRecord(doc, history, { type: 'addNode', data: makeNode(id) });
    }
    applyAndRecord(doc, history, { type: 'addEdge', data: { id: 10, from: 1, to: 2 } });

    applyAndRecord(doc, history, { type: 'swapIds', id1: 1, id2: 2 });
    expect(doc.edges[0]!.from).toBe(2);
    expect(doc.edges[0]!.to).toBe(1);
  });
});
