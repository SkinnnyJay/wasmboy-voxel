import { describe, expect, it } from 'vitest';
import { debuggerSelectors, useDebuggerStore } from '../store/debugger-store';

describe('debugger selectors', () => {
  it('frame scalar selectors stay stable across non-frame state mutations', () => {
    const originalState = useDebuggerStore.getState();
    useDebuggerStore.setState({
      ...originalState,
      frameId: 42,
      timestampMs: 1234,
      events: [],
      snapshots: [],
    });

    try {
      const stateBeforeMutation = useDebuggerStore.getState();
      const frameIdBefore = debuggerSelectors.frameId(stateBeforeMutation);
      const timestampBefore = debuggerSelectors.frameTimestampMs(stateBeforeMutation);

      useDebuggerStore.setState((state) => ({
        ...state,
        events: [
          ...state.events,
          {
            type: 'input',
            frameId: state.frameId,
            timestampMs: state.timestampMs + 1,
            payload: {
              action: 'press-a',
            },
          },
        ],
      }));

      const stateAfterMutation = useDebuggerStore.getState();
      const frameIdAfter = debuggerSelectors.frameId(stateAfterMutation);
      const timestampAfter = debuggerSelectors.frameTimestampMs(stateAfterMutation);

      expect(frameIdAfter).toBe(frameIdBefore);
      expect(timestampAfter).toBe(timestampBefore);
    } finally {
      useDebuggerStore.setState(originalState);
    }
  });
});
