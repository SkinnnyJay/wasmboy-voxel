# Admin API & Analytics

## Cost Analytics
- `GET /api/admin/analytics/costs` -- LLM cost by provider/model
  - Params: `days` (default: 30)
  - Returns: provider breakdown, daily trends, projected monthly costs

## User Engagement
- `GET /api/admin/analytics/engagement` -- DAU/MAU, messages/day, chat engagement
  - Params: `days` (default: 30)

## Memory Statistics
- `GET /api/admin/analytics/memory` -- total memories, storage stats, top agents

## Data Export
- `GET /api/admin/analytics/export` -- export analytics
  - Params: `type` (metrics|audit_logs|agent_runs|messages), `format` (json|csv), `days`, `limit`

## Chat Sentiment
- `GET /api/chats/[id]/sentiment` -- daily sentiment breakdown
  - Params: `days` (default: 7)

## Alerting System

`lib/server/analytics/alerting.ts` -- threshold-based monitoring with webhook handlers.

```typescript
import { alertingService, createWebhookAlertHandler } from "@/lib/server/analytics/alerting";
alertingService.onAlert(createWebhookAlertHandler(webhookUrl, "slack"));
await alertingService.checkMetric("llm.error.count", errorCount);
```

Config: `ALERTING_ENABLED`, `ALERT_WEBHOOK_URL`, `ALERT_WEBHOOK_PLATFORM` ("slack" | "discord")

## Background Jobs (`lib/features/jobs/`)

| Job Type | Purpose |
|----------|---------|
| `sentiment-analysis` | Analyze message sentiment |
| `analytics-track` | Track events/metrics |
| `cache-invalidation` | Invalidate cache keys |
| `audit-log` | Record audit entries |
| `webhook-delivery` | HTTP POST with retry |

## Post-Operation Hooks (`lib/features/hooks/`)

| Hook | Priority | Effect |
|------|----------|--------|
| `audit-log` | 10 | Creates audit log entry |
| `cache-invalidation` | 20 | Invalidates cache keys |
| `analytics` | 30 | Tracks event |
| `event-publish` | 40 | Publishes realtime events |

Operations: `chat.create`, `chat.update`, `chat.delete`, `agent.create`, `message.create`, `deliberation.create`, etc.
