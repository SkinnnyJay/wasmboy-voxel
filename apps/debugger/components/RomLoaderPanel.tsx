'use client';

import { useMemo, useState } from 'react';

const SUPPORTED_ACCEPT = '.gb,.gbc,.zip';

export function RomLoaderPanel() {
  const [romName, setRomName] = useState<string>('No ROM loaded');
  const acceptValue = useMemo(() => SUPPORTED_ACCEPT, []);

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
        }}
      />
    </section>
  );
}
