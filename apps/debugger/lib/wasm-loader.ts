export async function fetchWasmAsset(assetUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(`Failed to load WASM asset: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}
