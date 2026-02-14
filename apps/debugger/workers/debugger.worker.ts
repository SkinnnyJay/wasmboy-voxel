self.onmessage = (event: MessageEvent) => {
  const payload = event.data ?? {};
  self.postMessage({
    type: 'debugger-worker:echo',
    payload,
  });
};
