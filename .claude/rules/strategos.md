# Strategos Reasoning Strategy System

Intelligent reasoning strategy selection that chooses the optimal reasoning pattern for each agent response.

## Decision Engine Types

| Engine | Pattern | Use Case | Latency |
|--------|---------|----------|---------|
| `auto` | Dynamic selection | Default, adapts to task | Variable |
| `direct` | Standard | Simple Q&A, greetings | <3s |
| `analytical` | ECoT | Complex reasoning, analysis | 10-30s |
| `researcher` | ReAct | Tool use, multi-step tasks | 15-60s |
| `meticulous` | Self-Critique | High-stakes, accuracy critical | 20-45s |
| `comprehensive` | Composite | Maximum quality, full pipeline | 45-120s |

## Reasoning Patterns

- **Standard** -- direct LLM response, no special processing
- **ECoT** -- multi-stage: decomposition, exploration, hypothesis testing, synthesis
- **ReAct** -- tool-augmented with observation-thought-action loops
- **Self-Critique** -- iterative refinement with quality scoring until threshold met
- **Composite** -- chains multiple patterns (e.g., ECoT -> ReAct -> Critique)

## Architecture (`lib/features/strategos/`)

- `task-analyzer.ts` -- keyword scoring, pattern detection, complexity estimation
- `agent-profiler.ts` -- resolves reasoning profile from `decision_engine` config
- `budget-manager.ts` -- token/latency/cost estimation and constraint checking
- `strategy-resolver.ts` -- hybrid rule-based + LLM meta-reasoning selection
- `pattern-executor.ts` -- unified interface to execute any pattern
- `strategos.ts` -- main service orchestrating all components

## Agent Configuration

```typescript
{
  type: "analytical",
  overrides: {
    maxTokenBudget: 8000,
    maxLatencyMs: 30000,
    costSensitivity: "high",
    preferredTools: ["search", "calculate"]
  }
}
```

## Environment Variables

- `STRATEGOS_ENABLED` -- enable/disable (default: false)
- `STRATEGOS_META_REASONER_ENABLED` -- allow LLM meta-reasoning for ambiguous cases

## Decision Engine Playground

Admin tool at `/admin/playground` -- 6-column comparison grid, SSE streaming, confidence scores, token/cost breakdown.

Tables: `playground_sessions`, `playground_threads`, `playground_messages`

## Integration

Integrated with Kybernetes orchestrator. OpenTelemetry spans: `strategos.select`, `strategos.execute`.
