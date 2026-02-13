# Migration Completion Summary (2026-02-13)

## Outcome

The migration plan phases were executed end-to-end, including:

- typed contracts package (`@wasmboy/api`)
- wrapper contract gates and compatibility export
- debugger app scaffold + state/events + read-only debug API
- CLI tooling package (`@wasmboy/cli`)
- regression safety suite expansion
- CI/release workflow automation
- dependency hardening and audit cleanup

## Validation snapshot

Primary command used for final continuous validation:

```bash
npm run test:all:nobuild
```

This executes:

- workspace lint/typecheck/tests
- integration regressions
- core regressions
- headless throughput baseline
- dependency audit check

Stability hardening:

- headless integration command now includes a single Mocha retry (`--retries 1`) to reduce intermittent golden-frame CI flakes while preserving strict golden comparison semantics.
- core save-state command now includes a single Mocha retry (`--retries 1`) to reduce intermittent screenshot-timing flakes while preserving golden-state assertions.
- retries are scoped to CI-specific commands (`test:integration:headless:ci`, `test:core:savestate:ci`), while default local commands remain strict single-run checks.
- `ci:local:strict` is available to run the full no-build gate using strict single-run integration/core commands.

CI automation now runs the same gate in:

- `ci.yml` (push/PR)
- `contract-checks.yml` (contract-focused gate + explicit contract payload validation)
- `nightly-regression.yml` (daily scheduled drift detection)
- `release.yml` (pre-publish release guard before changesets action)
- CI and nightly workflows invoke `npm run ci:local` directly to keep local/remote quality-gate parity exact

CI and contract workflows now include:

- `workflow_dispatch` manual trigger support
- push/PR path filters so full CI runs only for relevant runtime/package/test/workflow changes
- trigger path lists aligned to existing repo files (removed stale `pnpm-workspace.yaml` references)
- CI workflow path filters include `.github/workflows/*.yml` so workflow-only changes still get full quality-gate validation
- workflow trigger paths include `scripts/**` where scripts are used by CI/contract/release gates (e.g. `changeset:status:ci`)
- CI and nightly manual dispatch include `strict` input support to run no-retry full-gate verification on demand
- release manual dispatch supports `strict=true` for no-retry release verification
- contract manual dispatch supports `full_gate=true` with optional `strict=true` for strict full-gate contract verification

Release pipeline build uses:

- `npm run release:build` (root emulator/lib build + workspace package builds)
- `npm run release:verify` (full no-build quality gate + changeset status)
- push trigger path filters so release automation runs only when releasable/runtime/package metadata changes
- `release:verify` now composes `ci:local + changeset:status:ci` for direct local/CI gate parity
- `release:verify:strict` is available for strict no-retry release verification and is selectable in manual release workflow runs

Contract workflow uses:

- `npm run ci:packages` (package build + package typecheck/tests)
- `npm run contract:ci` (workflow checks + automation tests + package CI checks + changeset status + sample contract validation)
- `npm run contract:ci:full` (full `ci:local` gate + changeset status + sample contract validation)
- `npm run contract:ci:full:strict` (full `ci:local:strict` gate + changeset status + sample contract validation)
- `npm run changeset:status:ci` (deduplicated/suppressed expected local file-dependency notices in CI output)
- path filters so the workflow runs only when contract/package/release-metadata files change (including debugger package metadata used by changeset checks)
- contract workflow path filters include `contracts/**` so contract-schema/documentation edits still exercise contract CI gates
- contract workflow manual dispatch supports `full_gate=true`, with optional `strict=true` to run `contract:ci:full:strict`
- contract workflow validates dispatch input combinations (`strict=true` without `full_gate=true` fails fast)

Workflow hardening applied:

- explicit workflow permissions (least privilege defaults)
- concurrency groups with `cancel-in-progress` to avoid duplicate CI spend
- shared install command (`npm run install:stack`) to keep CI/release dependency setup consistent across workflows
- deterministic lockfile install command (`npm run install:stack:ci`) now used across all workflows
- CI install command uses `--ignore-scripts` to avoid redundant prepare builds during dependency bootstrap
- CI install command disables install-time audit/fund output (`--no-audit --fund=false`) since audit is enforced in the dedicated quality gate
- package-focused deterministic install command (`npm run install:packages:ci`) used by contract workflow to avoid unnecessary app dependency bootstrap
- stack-level deterministic install now composes package-level install (`install:stack:ci` -> `install:packages:ci` + debugger install) to reduce duplication
- setup-node cache dependency paths include all workspace lockfiles for stable multi-package npm cache keys
- contract workflow cache keys now omit debugger lockfile to better match package-only install inputs
- release workflow now also caches Next.js build artifacts for debugger app builds
- workflow formatting checks are enforced via `workflow:lint` and included in the unified quality gate
- workflow formatting can be auto-remediated locally via `workflow:format`
- automation helper scripts are linted via `scripts:lint` and included in the unified quality gate
- automation helper scripts can be auto-formatted via `scripts:format`
- `workflow:check` consolidates workflow + automation script format checks for reuse in CI scripts
- automation helper scripts are covered by `automation:test` (Node test runner), and this test step is included in the unified quality gate
- `automation:check` composes `workflow:check` + `automation:test` so quality-gate scripts can reuse one consolidated automation preflight command
- automation coverage includes diagnostics bundle behavior checks (matched files, empty-placeholder fallback, duplicate-pattern deduplication)
- automation coverage verifies directory matches are excluded so bundle inputs remain file-only
- automation coverage includes custom placeholder message behavior for empty diagnostics archives
- diagnostics archive file collection now sorts matches lexicographically for deterministic artifact structure across runs
- diagnostics placeholder files are now cleaned up after archive creation to avoid leaving temporary files in workflow workspaces
- diagnostics file deduplication now uses canonical resolved paths so mixed relative/absolute pattern inputs cannot archive the same file twice
- diagnostics archive command now inserts `--` before file entries so dash-prefixed filenames are handled safely
- diagnostics bundling now excludes the output archive path from matched inputs to avoid accidental self-inclusion when broad patterns are used
- diagnostics bundling now normalizes absolute file matches to relative archive paths (when under repo cwd) to keep artifact contents stable and portable
- diagnostics bundling now enforces a configurable tar timeout (`BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS`, default 120000ms) with explicit invalid-config and timeout failure handling
- diagnostics bundler now supports per-invocation tar timeout overrides (`--tar-timeout-ms`, `--tar-timeout-ms=<ms>`) with strict duplicate/missing/help-mixed argument guards
- diagnostics timeout token guards now include malformed split/inline flag-token value coverage (`--tar-timeout-ms --unexpected`, `--tar-timeout-ms=-x`), ensuring missing-value semantics stay stable
- helper timeout-override regression coverage now also includes whitespace-only CLI values for both wrappers (`--timeout-ms ' '`, `--tar-timeout-ms ' '`), locking invalid-value behavior at CLI entrypoints
- helper timeout-override regression coverage now includes plus-prefixed and negative CLI timeout overrides for both wrappers (`+5000`, `-5`) to keep strict numeric-input semantics consistent at wrapper boundaries
- helper timeout-override regression coverage now includes split/inline parity assertions for whitespace/plus/negative timeout overrides in both wrappers, ensuring both argument styles enforce identical strict validation behavior
- help/timeout exclusivity coverage now includes inline-timeout variants in both wrappers (`--help --timeout-ms=...`, `--help --tar-timeout-ms=...`) to preserve strict non-mixed help invocation semantics across argument styles
- help-mode strictness coverage now includes unknown short-flag combinations (`--help -x`) for both wrappers, ensuring unknown-short argument rejection remains enforced even in help-mixed invocations
- timeout-value token-guard coverage now includes help-alias tokens in split/inline timeout value positions for both wrappers (`--flag --help`, `--flag -h`, `--flag=--help`, `--flag=-h`), preserving missing-value semantics for option-token misuse
- duplicate-timeout regression coverage now includes inline-first ordering (`--flag=...` then `--flag ...`) in both wrappers, ensuring duplicate-detection behavior remains ordering-agnostic across split/inline forms
- help-timeout exclusivity regression coverage now includes short-help variants (`-h --flag ...`, `-h --flag=...`) in both wrappers, preserving help-flag exclusivity semantics across both help aliases and timeout argument styles
- help-mode strictness coverage now includes short-help + unknown-arg combinations (`-h --unknown`, `-h -x`) for both wrappers, preserving unknown-argument rejection semantics even when help alias mode is active
- diagnostics parser now treats whitespace-only `--output` / `--pattern` values (split and equals forms) as missing values, preventing accidental blank path-like argument acceptance
- duplicate-help regression coverage now includes short-first order (`-h --help`) in both wrappers, ensuring duplicate-help detection remains ordering-agnostic across help aliases
- duplicate-timeout regression coverage now includes split-only and inline-only duplicate forms in both wrappers (in addition to mixed split/inline orderings), ensuring duplicate-timeout detection remains syntax-order agnostic
- timeout-override precedence coverage now includes inline CLI override variants for both wrappers, ensuring `--flag=<ms>` overrides timeout env defaults just like split-form overrides
- diagnostics placeholder-message coverage now includes whitespace-only custom message values (split and equals forms), preserving intentional whitespace payload behavior for operator-supplied placeholder text
- diagnostics message parsing now explicitly allows help-token literals (`--help`, `-h`) for `--message` values (split and equals forms), with regression coverage to keep those literals available as intentional placeholder text
- diagnostics help-token message coverage now includes full split/equals parity for both literals (`--message --help`, `--message -h`, `--message=--help`, `--message=-h`) to lock intentional-literal behavior across argument styles
- timeout-value token-guard coverage now also includes self-flag misuse tokens (`--timeout-ms --timeout-ms`, `--timeout-ms=--timeout-ms`, and diagnostics equivalents), preserving missing-value semantics when a timeout flag token is repeated in value position
- diagnostics duplicate-flag regression coverage now includes equals-only duplicate paths for `--output` and `--message`, preserving duplicate-detection semantics across split-only, equals-only, and mixed argument forms
- diagnostics path-value token-guard coverage now includes help-token variants for `--output` / `--pattern` (split and equals forms), preserving missing-value semantics for help-token misuse in path-value positions
- help-timeout exclusivity regression coverage now includes trailing-help permutations (timeout args before help in both split/inline forms and both help aliases) for `changeset-status-ci` and `bundle-diagnostics`
- `changeset-status-ci` argument parsing now uses a shared `validateValue` helper (known-token + prefix guards), aligning timeout value-token validation structure with diagnostics helper parsing semantics while preserving existing error contracts
- diagnostics path-value token-guard coverage now includes timeout-flag token misuse variants for `--output` / `--pattern` (split and equals forms), preserving missing-value semantics for known flag tokens in path-value slots
- diagnostics message-value token-guard coverage now includes timeout-flag token misuse variants (`--message --tar-timeout-ms`, `--message=--tar-timeout-ms`), preserving current known-token missing-value semantics for non-whitelisted message tokens
- diagnostics message-value token-guard coverage now also includes operational known-flag misuse variants (`--message --output`, `--message --pattern`, plus equals forms), preserving known-token missing-value semantics for non-whitelisted message tokens while keeping explicit help-token literal allowances
- `bundle-diagnostics` parser internals now use shared flag constants (`--output`, `--pattern`, `--message`) across known-token sets, split/equals parsing, and duplicate-error paths to reduce literal drift risk while preserving CLI behavior and error text
- diagnostics timeout-value token-guard coverage now includes known operational-flag misuse variants (`--tar-timeout-ms --output`, `--tar-timeout-ms --pattern`, `--tar-timeout-ms --message`, plus inline forms), preserving missing-value semantics for known-flag tokens in timeout-value positions
- diagnostics help-literal message regression coverage now includes explicit-help follow-up permutations (`--message --help --help`, `--message -h -h`, plus equals-form variants), preserving help-flag exclusivity when help-token literals are used intentionally as message payloads
- diagnostics help-literal message coverage now includes timeout coexistence permutations (`--message --help --tar-timeout-ms ...` and equals-form `--message=-h` with inline timeout), preserving intentional help-literal payload semantics alongside timeout override arguments
- duplicate-help regression coverage now includes same-alias duplicates (`--help --help` and `-h -h`) for both helper wrappers, preserving duplicate-help failure semantics independent of alias mixing order
- `changeset-status-ci` parser now uses a shared `readRequiredValue` helper for split-form timeout parsing, aligning parser structure with diagnostics helper internals while preserving existing CLI behavior and timeout validation semantics
- wrapper-level CLI timeout boundary coverage now explicitly includes zero, non-numeric suffix (`50ms`), and above-ceiling (`2147483648`) overrides in split and inline forms for both `changeset-status-ci` and `bundle-diagnostics`
- wrapper-level timeout-environment boundary coverage now explicitly includes zero-value env rejection for both helpers (`CHANGESET_STATUS_CI_TIMEOUT_MS=0`, `BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS=0`), preserving strict positive-timeout semantics at wrapper entry points
- wrapper-level timeout-environment boundary coverage now also includes plus-prefixed and negative env rejection for both helpers, preserving strict positive integer semantics for env-driven timeout parsing in wrapper entry points
- wrapper-level CLI timeout boundary coverage now also includes acceptance tests at the maximum supported timeout (`2147483647`) in split and inline forms for both wrappers, preserving inclusive upper-bound semantics
- wrapper-level timeout-environment boundary coverage now includes acceptance tests at the maximum supported timeout (`2147483647`) for both wrappers, preserving inclusive upper-bound semantics for env-driven timeout resolution
- timeout-override precedence coverage now also includes failure-path assertions where invalid CLI timeout overrides still fail even when environment timeout values are valid, preserving strict CLI validation semantics under precedence rules
- diagnostics timeout regression fixtures now use a shared delayed-fake-tar helper in automation tests, reducing fixture duplication while preserving timeout-path behavior and assertions
- changeset timeout regression fixtures now use shared helper builders for delayed/no-bump fake changeset commands, reducing fixture duplication while preserving timeout and success-path behavior
- timeout-override precedence coverage now includes empty-env fallback permutations where CLI timeout overrides still enforce configured timeout behavior (`... --timeout-ms 50` with empty timeout env) for both wrappers
- timeout-override coverage now includes leading-zero CLI timeout permutations (`00050`) in split and inline forms for both wrappers, preserving numeric parsing semantics while enforcing configured timeout behavior
- timeout-override coverage now includes whitespace-padded timeout values (`' 50 '`) across environment and CLI override paths (split and inline) for both wrappers, preserving trimmed numeric parsing semantics while enforcing configured timeout behavior
- timeout-override precedence coverage now includes invalid-env/valid-CLI failure-path assertions (split and inline forms) for both wrappers, preserving current env-first timeout resolution semantics
- timeout-environment coverage now includes leading-zero acceptance (`00050`) for both wrappers, preserving trimmed numeric parsing semantics and timeout behavior for canonicalizable integer env inputs
- timeout-environment boundary coverage now includes whitespace-padded max-int acceptance (`' 2147483647 '`) for both wrappers, preserving trim semantics at the upper supported timeout boundary
- timeout CLI boundary coverage now includes whitespace-padded max-int override acceptance (`' 2147483647 '`) in split and inline forms for both wrappers, preserving trim semantics at the upper supported timeout boundary for CLI overrides
- timeout fixture defaults in automation tests now use shorter delayed-command sleeps (`0.1s`), reducing automation runtime while preserving timeout-path behavior and assertions
- timeout regression fixtures now use shorter synthetic delays, reducing automation-test runtime while preserving timeout-path coverage
- automation timeout-wrapper tests now share a reusable fake-executable fixture helper (`test-fixtures`), reducing duplicated executable setup logic across changeset and diagnostics harnesses
- shared fake-executable fixture helper now has focused unit coverage validating runnable command creation in fake-bin paths
- shared fake-executable fixture helper now rejects empty/path-segment executable names, hardening fixture path safety and preventing fake-bin escape via invalid command identifiers
- shared fake-executable fixture helper now also rejects backslash-separated names, enforcing cross-platform separator safety for fixture command identifiers
- shared fake-executable fixture helper now also rejects dot-segment names (`.` / `..`), preventing invalid directory-like executable identifiers in fake-bin setup
- shared fake-executable fixture helper now rejects whitespace-containing executable names, hardening fixture command identifier safety against ambiguous shell-token names
- `changeset-status-ci` output-filter helper coverage now includes whitespace-padded warning suppression and passthrough internal-blank-line preservation, locking output-formatting behavior under mixed warning/info streams
- `changeset-status-ci` output-filter helper coverage now also includes whitespace-variant warning deduplication and empty-output handling, locking normalization behavior for sparse and duplicate-heavy output streams
- timeout argument-value validation now uses a shared helper module (`cli-arg-values`) across both wrappers, reducing parser duplication while preserving split/equals token-guard semantics
- shared argument-value helper now has focused unit coverage for missing/known-token/whitespace/flag-like value validation and required-following-token reads
- shared argument-value helper coverage now includes unknown long-flag token rejection under double-dash-disallowed settings, explicit whitespace-only acceptance when enabled, and allowed-known-token read behavior (`--message --help`)
- shared argument-value helper internals now centralize missing-value error creation, reducing repeated error-construction logic while preserving existing error text contracts
- timeout env/CLI precedence resolution now uses a shared helper (`resolveTimeoutFromCliAndEnv`) across both wrappers, reducing duplicated timeout-resolution scaffolding while preserving current env-first validation + CLI-override semantics
- shared timeout-precedence helper now has focused unit coverage for default/env/CLI precedence plus invalid-env and invalid-CLI failure paths
- shared timeout-precedence helper coverage now also includes empty-env + CLI-override resolution, whitespace-padded max-int CLI override acceptance, and whitespace-only CLI rejection with valid env fallback
- timeout env parsing is now strict numeric-only (e.g. rejects suffix values like `50ms`) for both diagnostics and changeset wrappers
- shared timeout parser now rejects values above the supported process timeout ceiling (`2147483647ms`) to avoid runtime overflow ambiguity
- shared timeout parser tests now cover whitespace-only env values as invalid, preventing accidental silent coercion in CI configuration
- shared timeout parser tests now cover empty-string env values as default-fallback behavior, preserving predictable unset-env semantics
- shared timeout parser tests now cover plus-prefixed and negative numeric inputs as invalid, tightening timeout-config input contract clarity
- wrapper-level timeout regression coverage now includes above-ceiling env values for both helpers, ensuring shared timeout bounds enforcement is surfaced at CLI entrypoints
- README helper command examples now explicitly call out timeout env bounds (`1..2147483647`) for operator clarity
- diagnostics bundler help handling now remains strict about unknown flags (`--help --unknown` fails), matching stricter wrapper argument-guard behavior
- diagnostics bundler now emits consistent `[bundle-diagnostics] ...` prefixed CLI errors (with usage output on parse errors), improving CI log readability
- diagnostics/changeset wrappers now include usage text for invalid timeout configuration failures, improving remediation context in CI logs
- automation tests now explicitly assert helper-specific error prefixes (`[bundle-diagnostics]`, `[changeset:status:ci]`) for stable troubleshooting output contracts
- automation tests now also assert usage-text presence for key bundle argument/config failures, protecting CLI guidance output in error paths
- diagnostics helper now rejects mixed help + operational arguments to keep CLI intent explicit and avoid ambiguous invocation behavior
- changeset helper now also has regression coverage for `--help` mixed with unknown arguments, preserving strict invocation semantics across both wrappers
- changeset timeout-suffix failure tests now assert usage-text output, locking guidance quality for timeout-config error paths
- both helpers now reject duplicate help-flag combinations (e.g. `--help -h`) with explicit parse errors to keep invocation semantics strict
- both helpers now have explicit regression coverage for unknown short-flag arguments (e.g. `-x`) to protect strict argument-surface behavior
- diagnostics helper argument parsing now allows dash-prefixed message values (e.g. `--message "--custom note"`) while still treating known flags as missing-value sentinels
- diagnostics helper now treats unknown long-flag tokens as missing-value errors for `--output` / `--pattern`, preventing accidental flag-token capture as path values
- bundle argument parsing now tests both accepted dash-prefixed message payloads and rejected long-flag token capture for path-oriented args, documenting the intended parsing boundary
- bundle token-capture regression assertions now require usage-text output on those failures, preserving CLI guidance when path args are malformed
- bundle parser now rejects short-flag-like tokens (e.g. `-x`) in `--output` / `--pattern` value positions to reduce accidental option-token capture
- wrapper-level timeout coverage now includes empty-string env behavior for both helpers, confirming default-timeout fallback semantics remain stable at CLI entrypoints
- bundle helper now supports equals-form long options (`--output=...`, `--pattern=...`, `--message=...`) with dedicated empty-value validation coverage
- diagnostics helper regression coverage now includes mixed split/equals duplicate detection for `--output` and `--message` to keep duplicate-flag semantics stable across syntax styles
- automation coverage includes `changeset:status:ci` filtering behavior checks (expected warning suppression and deduplication)
- changeset status warning filter now tolerates version bumps by suppressing only `file:` workspace warnings from `@wasmboy/*` packages against `@wasmboy/api`
- suppressed changeset workspace warnings are now lexicographically sorted before reporting for deterministic CI log output
- automation coverage now includes `changeset-status-ci.mjs` wrapper behavior (filtered output passthrough, exit-code passthrough, and missing-command failure handling)
- changeset filter/wrapper tests now assert non-`@wasmboy/*` `file:` warnings remain visible and that suppressed warning logs are emitted in deterministic order
- changeset status wrapper now supports `--help` and `-h` usage output, with automation coverage for both help paths
- changeset filter tests now cover CRLF output handling to ensure cross-platform warning parsing stability
- changeset status wrapper now rejects unknown CLI arguments with usage guidance to keep automation invocation strict and predictable
- changeset status wrapper now enforces a configurable execution timeout (`CHANGESET_STATUS_CI_TIMEOUT_MS`, default 120000ms) with explicit timeout/invalid-config failures
- changeset status wrapper now supports per-invocation timeout overrides (`--timeout-ms`, `--timeout-ms=<ms>`) with strict duplicate/missing-value guards and precedence over env defaults
- changeset timeout split-arg parsing now treats unknown/short flag tokens as missing timeout values, avoiding accidental flag-token capture in timeout value positions
- changeset timeout inline-equals parsing now also treats unknown/short flag tokens as missing timeout values, aligning malformed-value handling with split-arg parsing
- helper command docs now include timeout override examples for both automation wrappers (`CHANGESET_STATUS_CI_TIMEOUT_MS`, `BUNDLE_DIAGNOSTICS_TAR_TIMEOUT_MS`)
- timeout parsing logic is now centralized in a shared automation helper (`scripts/cli-timeout.mjs`) with dedicated unit coverage, reducing duplication between wrappers
- automation coverage also validates diagnostics bundle CLI argument guards (missing `--output` and missing `--pattern`)
- automation coverage also validates diagnostics bundle argument parsing errors (unknown flags and missing flag values)
- diagnostics bundle tests now cover missing values for `--output` and `--message` flags to enforce strict CLI parsing behavior
- diagnostics bundle parser now rejects duplicate `--output` / `--message` flags, with automation coverage for both error paths
- diagnostics bundler now supports `--help` usage output (covered by automation tests) for easier local debugging/tooling introspection
- diagnostics bundler also supports `-h` short-help alias for standard CLI ergonomics
- README command reference now includes direct helper usage examples for both automation scripts (`changeset-status-ci` and `bundle-diagnostics`)
- CI and nightly workflows now capture full quality-gate logs and relevant screenshot outputs as artifacts on failure for faster triage
- contract and release workflows now capture gate logs as failure artifacts to support post-failure debugging without reruns
- release workflow failure artifacts now also include core/headless generated screenshots from release verification test failures
- failure diagnostics artifacts use a 14-day retention window to balance triage utility with storage footprint
- log-capturing workflow steps explicitly use `shell: bash` to guarantee `set -o pipefail` behavior
- failure artifact names include run id/attempt for clearer traceability in repeated or retried runs
- diagnostics upload steps now run on both failure and cancellation, preserving partial logs from interrupted pipelines
- workflows now set job-level `defaults.run.shell: bash` so bash semantics are consistently applied across all run steps
- diagnostics are archived into per-workflow tarballs before upload to keep artifacts compact and grouped for easier download/inspection
- diagnostics bundling now collects only existing files (with placeholder manifests when empty), avoiding noisy tar missing-file warnings on early-fail/early-cancel paths
- diagnostics bundling is centralized via `scripts/bundle-diagnostics.mjs`, reducing duplicated workflow shell logic across CI/contract/nightly/release pipelines

## Security posture at completion

```bash
npm audit --omit=optional
```

Result at completion: **0 vulnerabilities**.

## Release markers

- annotated tag: `v0.8.0-migration-preview.1`
- release changeset added for:
  - `@wasmboy/api` (minor)
  - `@wasmboy/cli` (minor)
