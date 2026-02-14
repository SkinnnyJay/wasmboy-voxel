'use client';

import { useMemo, useState } from 'react';
import { useDebuggerStore } from '../store/debugger-store';

const SUPPORTED_ACCEPT = '.gb,.gbc,.zip';
const SUPPORTED_EXTENSIONS = new Set(['.gb', '.gbc', '.zip']);

interface RomSelection {
  name: string;
  size: number;
}

interface RomLoadSelectionResult {
  romName: string;
  loadError: string | null;
  eventPayload: Record<string, unknown> | null;
}

function getFileExtension(fileName: string): string {
  const extensionIndex = fileName.lastIndexOf('.');
  if (extensionIndex < 0) {
    return '';
  }
  return fileName.slice(extensionIndex).toLowerCase();
}

export function resolveRomSelection(file: RomSelection | null): RomLoadSelectionResult {
  if (!file) {
    return {
      romName: 'No ROM loaded',
      loadError: null,
      eventPayload: null,
    };
  }

  const extension = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return {
      romName: file.name,
      loadError: `Unsupported ROM format "${extension ||
        '[no extension]'}". Expected .gb, .gbc, or .zip.`,
      eventPayload: null,
    };
  }

  if (file.size <= 0) {
    return {
      romName: file.name,
      loadError: 'ROM file is empty. Please select a valid ROM file.',
      eventPayload: null,
    };
  }

  return {
    romName: file.name,
    loadError: null,
    eventPayload: {
      action: 'load-rom',
      name: file.name,
      size: file.size,
    },
  };
}

export function RomLoaderPanel() {
  const [romName, setRomName] = useState<string>('No ROM loaded');
  const [loadError, setLoadError] = useState<string | null>(null);
  const acceptValue = useMemo(() => SUPPORTED_ACCEPT, []);
  const appendInputEvent = useDebuggerStore(state => state.appendInputEvent);

  return (
    <section className="panel">
      <h3>ROM Loader</h3>
      <p className="muted">{romName}</p>
      <input
        type="file"
        accept={acceptValue}
        onChange={event => {
          const file = event.target.files?.[0];
          const selection = resolveRomSelection(file ? { name: file.name, size: file.size } : null);
          setRomName(selection.romName);
          setLoadError(selection.loadError);
          if (selection.eventPayload) {
            try {
              appendInputEvent(selection.eventPayload);
            } catch {
              setLoadError('Unable to queue ROM load event. Please try selecting the ROM again.');
            }
          }
        }}
      />
      {loadError ? (
        <p className="muted" role="alert">
          {loadError}
        </p>
      ) : null}
    </section>
  );
}
