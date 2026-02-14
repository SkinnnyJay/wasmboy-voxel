# V1 layout (classic JS/WASM stack)

V1 represents the classic runtime stack used by this repository:

- AssemblyScript core (`../core`)
- JS/WASM wrapper (`../lib`)
- Generated WASM/runtime artifacts (`../dist`)
- Legacy demo apps (`../demo`)

This directory is a stable entry/documentation surface for the V1 stack without
moving source directories (to avoid breaking existing import/build tooling).

## V1 commands

From repository root:

- `make v1-build`
- `make v1-test`
- `make v1-run`

## V1 artifact map

| Component                      | Canonical path |
| ------------------------------ | -------------- |
| Core (AS → WASM)               | `../core`      |
| Library (JS wrapper + workers) | `../lib`       |
| Built outputs                  | `../dist`      |
| Legacy demos (Preact/rollup)   | `../demo`      |
