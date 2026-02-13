import { NextResponse } from 'next/server';
import { debuggerSelectors, useDebuggerStore } from '../../../../store/debugger-store';

export async function GET(): Promise<Response> {
  const state = useDebuggerStore.getState();
  const payload = {
    readOnly: true,
    frame: debuggerSelectors.frameMetadata(state),
    latestChecksums: debuggerSelectors.latestChecksums(state),
    events: debuggerSelectors.eventStream(state).slice(-50),
    snapshots: debuggerSelectors.snapshots(state).slice(-10),
  };
  return NextResponse.json(payload);
}
