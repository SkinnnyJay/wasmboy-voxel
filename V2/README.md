# V2 layout (migration stack + strict TS surfaces)

V2 represents the migration-era stack:

- Workspace contracts/tooling (`../packages`)
- Next.js debugger app (`../apps/debugger`)
- Strict TypeScript wrapper entry surfaces (`../lib/**/*.ts`, `../index.ts`, `../voxel-wrapper.ts`)
- TS build outputs (`../dist/wasmboy.ts.*`, `../dist/worker/wasmboy.ts.worker.js`)

This directory is a stable entry/documentation surface for the V2 stack without
relocating core source directories.

## V2 commands

From repository root:

- `make v2-build`
- `make v2-test`
- `make v2-run`

## V2 artifact map

| Component              | Canonical path                                 |
| ---------------------- | ---------------------------------------------- |
| API + CLI packages     | `../packages`                                  |
| Debugger app           | `../apps/debugger`                             |
| Typed wrapper surfaces | `../lib`, `../index.ts`, `../voxel-wrapper.ts` |
| TS build outputs       | `../dist/wasmboy.ts.*`                         |
