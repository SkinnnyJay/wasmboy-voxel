# @wasmboy/cli

Command-line tooling for migration-time validation and regression workflows.

## Commands

- `wasmboy-voxel run <rom>`
- `wasmboy-voxel snapshot <rom> [--out <jsonPath>]`
- `wasmboy-voxel compare <baselineSummary> [--current <summaryPath>]`
- `wasmboy-voxel contract-check --contract <name> --file <jsonPath>`

## Examples

```bash
wasmboy-voxel run test/performance/testroms/tobutobugirl/tobutobugirl.gb
wasmboy-voxel snapshot test/performance/testroms/back-to-color/back-to-color.gbc --out ./snapshot.json
wasmboy-voxel compare test/baseline/snapshots/summary.json
wasmboy-voxel contract-check --contract registers --file ./registers.json
```
