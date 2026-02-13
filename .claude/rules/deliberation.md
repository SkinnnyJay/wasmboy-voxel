# Deliberation Mode

Structured decision-making workflow for multi-agent conversations with anonymous peer review and judicial oversight.

## Phases

1. **Idle** -- awaiting question/topic
2. **Collecting Responses** -- agents submit independently
3. **Peer Review** -- anonymous cross-review
4. **Awaiting Judgment** -- ready for judge
5. **Judgment Rendered** -- verdict delivered
6. **Documenting** -- chain of custody generation
7. **Complete** -- full audit trail available

## Architecture (`lib/features/deliberation/`)

- `orchestrator.ts` -- `DeliberationOrchestrator` manages workflow state
- `anonymizer.ts` -- `ResponseAnonymizer` for consistent anonymous IDs
- `confidence.ts` -- `ConfidenceCalculator` for scoring consensus
- `context-filter.ts` -- message visibility per phase
- `prompts.ts` -- LLM prompt builders for judge, reviewer, documenter
- `types.ts` -- type definitions, Zod schemas, phase constants

## Configuration

```typescript
{
  defaultJudgeId?: string;
  judgeStyle: "socratic" | "analytical" | "synthesis";
  judgeConfidence: number;           // 0-100
  peerReviewMode: "anonymous" | "attributed" | "disabled";
  reviewConfidence: number;          // 0-100
  maxIterations: number;
  autoInvokeJudge: boolean;
  participatingAgentIds: string[];
}
```

## API Endpoints

- `GET /api/deliberations?chat_id=X` -- list deliberations
- `POST /api/deliberations` -- create new
- `GET /api/deliberations/[id]` -- full details
- `POST /api/deliberations/[id]/invoke-judge` -- manual judge invocation
- `GET /api/deliberations/[id]/documentation` -- chain of custody

## UI Components (`components/deliberation/`)

`DeliberationStatusBadge`, `DeliberationProgress`, `DeliberationHistory`, `DeliberationReportViewer`, `InvokeJudgeButton`

## Frontend Hooks

- `useDeliberation` -- real-time phase updates, `createDeliberation()`, `invokeJudge()`
- `useDeliberationMessages` -- transforms messages per phase, handles anonymization

## Database Tables

`deliberations`, `deliberation_responses`, `deliberation_reviews`, `deliberation_judgments`, `deliberation_documentation`
