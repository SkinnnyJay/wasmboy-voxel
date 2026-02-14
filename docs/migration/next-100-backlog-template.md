# Next 100 Backlog Template

Use this template to instantiate each new 100-item cycle.

| id      | title | subsystem | risk | impact (1-5) | effort (1-5) | confidence (1-5) | ownerTag | validation | status  |
| ------- | ----- | --------- | ---- | ------------ | ------------ | ---------------- | -------- | ---------- | ------- |
| task001 |       |           |      |              |              |                  |          |            | pending |
| task002 |       |           |      |              |              |                  |          |            | pending |
| task003 |       |           |      |              |              |                  |          |            | pending |
| ...     |       |           |      |              |              |                  |          |            | pending |
| task100 |       |           |      |              |              |                  |          |            | pending |

## Scoring helper

`priorityScore = (impact * 2) + confidence - effort + riskBonus`

- `riskBonus = 2` (security/correctness)
- `riskBonus = 1` (reliability/performance)
- `riskBonus = 0` (DX/docs)
