const DEFAULT_MAX_TRACKED_BUFFERS = 32;
const DEFAULT_MAX_TRACKED_BYTES = 16 * 1024 * 1024;

/**
 * @param {{
 *   maxTrackedBuffers?: number;
 *   maxTrackedBytes?: number;
 }} [options]
 */
export function createNutjsMemoryGuard(options = {}) {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('[nutjs:memory-guard] Expected options to be an object.');
  }

  const maxTrackedBuffers = options.maxTrackedBuffers ?? DEFAULT_MAX_TRACKED_BUFFERS;
  const maxTrackedBytes = options.maxTrackedBytes ?? DEFAULT_MAX_TRACKED_BYTES;
  if (!Number.isInteger(maxTrackedBuffers) || maxTrackedBuffers <= 0) {
    throw new TypeError('[nutjs:memory-guard] Expected options.maxTrackedBuffers to be a positive integer when provided.');
  }
  if (!Number.isInteger(maxTrackedBytes) || maxTrackedBytes <= 0) {
    throw new TypeError('[nutjs:memory-guard] Expected options.maxTrackedBytes to be a positive integer when provided.');
  }

  /** @type {{ label: string; byteLength: number }[]} */
  const trackedBuffers = [];
  let trackedBytes = 0;
  let evictedBuffers = 0;
  let evictedBytes = 0;

  function evictOldestBuffer() {
    const oldestEntry = trackedBuffers.shift();
    if (!oldestEntry) {
      return;
    }
    trackedBytes -= oldestEntry.byteLength;
    evictedBuffers += 1;
    evictedBytes += oldestEntry.byteLength;
  }

  return {
    /**
     * @param {Uint8Array} snapshotBytes
     * @param {string} [label]
     */
    trackSnapshot(snapshotBytes, label = 'snapshot') {
      if (!(snapshotBytes instanceof Uint8Array)) {
        throw new TypeError('[nutjs:memory-guard] Expected snapshotBytes to be a Uint8Array.');
      }
      if (typeof label !== 'string' || label.trim().length === 0) {
        throw new TypeError('[nutjs:memory-guard] Expected label to be a non-empty string when provided.');
      }

      const snapshotByteLength = snapshotBytes.byteLength;
      trackedBuffers.push({
        label: label.trim(),
        byteLength: snapshotByteLength,
      });
      trackedBytes += snapshotByteLength;

      while (trackedBuffers.length > maxTrackedBuffers || trackedBytes > maxTrackedBytes) {
        evictOldestBuffer();
      }
    },

    getState() {
      return {
        maxTrackedBuffers,
        maxTrackedBytes,
        trackedBuffers: trackedBuffers.length,
        trackedBytes,
        evictedBuffers,
        evictedBytes,
      };
    },

    dispose() {
      trackedBuffers.length = 0;
      trackedBytes = 0;
    },
  };
}
