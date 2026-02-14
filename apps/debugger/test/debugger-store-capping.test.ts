import { describe, expect, it } from 'vitest';
import { useDebuggerStore } from '../store/debugger-store';

describe('debugger store payload capping', () => {
  it('compacts oversized event payloads before storing them', () => {
    const originalState = useDebuggerStore.getState();
    useDebuggerStore.setState({
      ...originalState,
      frameId: 1,
      timestampMs: 1,
      events: [],
      snapshots: [],
    });

    try {
      const payload: Record<string, unknown> = {
        hugeText: 'x'.repeat(1024),
        nested: {
          level1: {
            level2: {
              level3: {
                level4: 'deep-value',
              },
            },
          },
        },
        list: Array.from({ length: 80 }, (_, index) => index),
      };

      for (let index = 0; index < 50; index += 1) {
        payload[`extraKey${index}`] = index;
      }

      useDebuggerStore.getState().appendInputEvent(payload);
      const latestEvent = useDebuggerStore.getState().events.at(-1);
      expect(latestEvent).toBeDefined();
      if (!latestEvent) {
        return;
      }

      const hugeText = latestEvent.payload.hugeText;
      expect(typeof hugeText).toBe('string');
      if (typeof hugeText === 'string') {
        expect(hugeText.includes('chars omitted')).toBe(true);
      }

      const nested = latestEvent.payload.nested;
      expect(typeof nested).toBe('object');
      expect(JSON.stringify(nested)).toContain('truncated-depth');

      const list = latestEvent.payload.list;
      expect(Array.isArray(list)).toBe(true);
      if (Array.isArray(list)) {
        expect(list.length).toBe(33);
        expect(typeof list[list.length - 1]).toBe('string');
      }

      const truncatedKeys = latestEvent.payload.__truncatedKeys;
      expect(typeof truncatedKeys).toBe('number');
      if (typeof truncatedKeys === 'number') {
        expect(truncatedKeys > 0).toBe(true);
      }
    } finally {
      useDebuggerStore.setState(originalState);
    }
  });
});
