# Agent Memory System

Comprehensive hybrid memory system enabling agents to store, retrieve, and use context across conversations.

## Storage Architecture

| Backend | Location | Purpose | TTL |
|---------|----------|---------|-----|
| Redis | `lib/memory/storage/redis-memory-storage.ts` | Fast short-term memory | 24h default |
| PostgreSQL | `lib/memory/storage/db-memory-storage.ts` | Durable long-term memories | None |
| JSON Files | `lib/memory/storage/json-memory-storage.ts` | Persistent archives in `./data/` | None |
| Hybrid | `lib/memory/storage/index.ts` | Orchestrates all backends (Redis -> DB -> JSON) | Varies |

## Memory Types

- `conversation` -- recent chat context (Redis + DB)
- `facts` -- explicit knowledge (DB + JSON)
- `embeddings` -- vector representations (DB)
- `summaries` -- compressed history (JSON)
- `preferences` -- learned patterns (DB)

## Memory Service API (`lib/memory/memory-service.ts`)

- `storeMemory()` -- save with automatic storage selection
- `retrieveMemory()` -- get with fallback chain
- `getConversationContext()` -- format for LLM prompts
- `getFacts()` / `getPreferences()` -- retrieve stored knowledge

## Kybernetes Integration

Memories are injected into agent system prompts during `processRun()`. Conversation context is stored after each agent response.

## Semantic Search

- Embeddings via OpenAI `text-embedding-3-small` (`lib/memory/embeddings/`)
- Cosine similarity search, `/recall` command for natural language queries
- Falls back to mock embeddings when OpenAI unavailable

## Commands

- `/recall <query>` -- semantic memory search
- `/remember <key> <value>` -- store explicit memory
- `/forget <key>` -- delete memory

## Compression (Phase 3)

Auto-summarizes conversations exceeding 50 messages via `lib/memory/compression/summarization-service.ts`.

## Cross-Channel (Phase 4)

`lib/memory/cross-channel/cross-channel-memory.ts` -- agents access memories across channels, global preference aggregation.

## Config

```
MEMORY_REDIS_TTL=86400, MEMORY_CLEANUP_INTERVAL=3600000,
MEMORY_MAX_FILE_SIZE=10485760, MEMORY_ENABLE_JSON_STORAGE=true, MEMORY_DATA_PATH=./data
```
