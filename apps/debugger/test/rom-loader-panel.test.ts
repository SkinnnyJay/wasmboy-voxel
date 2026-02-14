import { describe, expect, it } from 'vitest';
import { resolveRomSelection } from '../components/RomLoaderPanel';

describe('RomLoaderPanel selection recovery', () => {
  it('reports unsupported extension errors and omits load events', () => {
    const result = resolveRomSelection({
      name: 'bad-file.txt',
      size: 1024,
    });

    expect(result.romName).toBe('bad-file.txt');
    expect(result.loadError).toMatch(/Unsupported ROM format/u);
    expect(result.eventPayload).toBeNull();
  });

  it('reports empty ROM file errors and omits load events', () => {
    const result = resolveRomSelection({
      name: 'empty.gb',
      size: 0,
    });

    expect(result.romName).toBe('empty.gb');
    expect(result.loadError).toMatch(/ROM file is empty/u);
    expect(result.eventPayload).toBeNull();
  });

  it('clears previous error state when a valid ROM is selected after a failure', () => {
    const invalidSelection = resolveRomSelection({
      name: 'invalid.doc',
      size: 500,
    });
    const validSelection = resolveRomSelection({
      name: 'pokemon.gbc',
      size: 2_097_152,
    });

    expect(invalidSelection.loadError).not.toBeNull();
    expect(validSelection.loadError).toBeNull();
    expect(validSelection.romName).toBe('pokemon.gbc');
    expect(validSelection.eventPayload).toEqual({
      action: 'load-rom',
      name: 'pokemon.gbc',
      size: 2_097_152,
    });
  });
});
