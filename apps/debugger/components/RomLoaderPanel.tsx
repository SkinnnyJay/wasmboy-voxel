'use client';

import { useMemo, useState } from 'react';
import { useDebuggerStore } from '../store/debugger-store';

const SUPPORTED_ACCEPT = '.gb,.gbc,.zip';

export function RomLoaderPanel() {
  const [romName, setRomName] = useState<string>('No ROM loaded');
  const acceptValue = useMemo(() => SUPPORTED_ACCEPT, []);
  const appendInputEvent = useDebuggerStore((state) => state.appendInputEvent);

  return (
    <section className="panel">
      <h3>ROM Loader</h3>
      <p className="muted">{romName}</p>
      <input
        type="file"
        accept={acceptValue}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setRomName(file?.name ?? 'No ROM loaded');
          if (file) {
            appendInputEvent({
              action: 'load-rom',
              name: file.name,
              size: file.size,
            });
          }
        }}
      />
    </section>
  );
}
