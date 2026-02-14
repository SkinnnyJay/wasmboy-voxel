'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel">
      <h3>Debugger failed to render</h3>
      <p className="muted">{error.message}</p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
