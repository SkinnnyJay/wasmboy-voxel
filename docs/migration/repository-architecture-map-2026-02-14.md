# Repository Architecture Map (2026-02-14)

This onboarding map summarizes how core runtime code, wrappers, workspaces, and
quality automation connect.

```mermaid
flowchart TD
  subgraph Core["Emulator Core Layer"]
    A["core/**<br/>AssemblyScript CPU/PPU/APU/memory"]
    B["dist/core/*<br/>WASM loader bundles"]
  end

  subgraph Runtime["Runtime Wrapper Layer"]
    C["lib/**<br/>JS runtime + workers + debug hooks"]
    D["voxel-wrapper.ts<br/>typed snapshot/debt-safe adapter"]
    E["index.ts<br/>public entrypoint exports"]
  end

  subgraph Workspaces["Workspace Packages / App"]
    F["packages/api<br/>contracts + schemas"]
    G["packages/cli<br/>CLI commands + validation"]
    H["apps/debugger<br/>Next.js debugger UI"]
  end

  subgraph Quality["Quality + Automation"]
    I["test/**<br/>integration/core/perf regressions"]
    J["scripts/**<br/>automation guards + tooling checks"]
    K[".github/workflows/**<br/>CI/contract/nightly/release"]
  end

  A --> B
  B --> C
  C --> D
  D --> E
  F --> D
  F --> G
  F --> H
  E --> G
  E --> H
  I --> A
  I --> D
  I --> F
  J --> K
  J --> I
  K --> I
  K --> J
```

## Reading guide

- **Core** is the emulator truth source; wrapper/package layers consume it.
- **Runtime wrapper** (`lib/**`, `voxel-wrapper.ts`) translates WASM internals
  into stable APIs/contracts.
- **Workspace packages/app** consume shared contract surfaces from
  `packages/api`.
- **Quality layer** enforces cross-layer guarantees (tests + scripts + CI).

## First-stop files for new contributors

1. `README.md` (commands + workflow overview)
2. `voxel-wrapper.ts` (typed public runtime adapter)
3. `packages/api/src/index.ts` (contract registry + validators)
4. `packages/cli/src/index.ts` (CLI command routing)
5. `apps/debugger/app/page.tsx` (debugger entry UI)
6. `PLAN.md` + migration docs for current hardening priorities
