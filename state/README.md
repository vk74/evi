<!--
Version: 1.1.0
Purpose: Developer guide for evi-state (Valkey): key namespaces, task queues, cache patterns.
File: README.md (docs)
Changes in v1.1.0:
  - Added key namespace structure (cache:db:*, op:*, stream:*)
  - Added DB-backed cache sync section (evi-be handles invalidation)
  - Added memory and persistence section (maxmemory, no rotation)
  - Removed Redis mentions (kept only where client package names require it)
  - Fixed typo in Node.js import quote
Changes in v1.0.0: Initial guide.
-->

# evi-state: Valkey usage guide

`evi-state` runs **Valkey 8** in the internal network `evi-net`. No port is published to the host; only `evi-be` and `evi-worker` can connect.

Connect via `VALKEY_URL` environment variable (injected by install into `evi-be`).  
Format: `redis://:password@evi-state:6379` — `redis://` is the connection protocol name used by Valkey-compatible clients.

---

## Key namespace structure

All keys follow a three-namespace convention based on the **source of truth** and **usage type**:

| Namespace | Source of truth | TTL | Example keys |
|-----------|----------------|-----|--------------|
| `cache:db:*` | PostgreSQL (evi-db) | Yes (default 300 s) | `cache:db:settings`, `cache:db:catalog` |
| `op:*` | Valkey only | Yes (per use-case) | `op:ratelimit:user:123`, `op:lock:job:42` |
| `stream:*` | Valkey only | **No TTL** — protected from eviction | `stream:tasks:email`, `stream:tasks:notify` |

> **Why no TTL on streams?**  
> `maxmemory-policy volatile-lru` only evicts keys that have a TTL.  
> Streams have no TTL → queue entries are never silently discarded under memory pressure.  
> Cache and operational keys have TTL → they are eligible for eviction when memory is tight.

---

## 1. DB-backed cache (`cache:db:*`)

Valkey does not poll the database. Cache stays in sync because **evi-be updates or invalidates the Valkey key on every write to PostgreSQL**.

### Pattern: cache-aside with write-through invalidation

**Read path (cache-aside):**
1. `HGETALL cache:db:settings` — if the key exists, return data from Valkey.
2. On miss (key expired or invalidated) — query PostgreSQL, write result to Valkey, set TTL.

**Write path (admin changes settings in UI):**
1. evi-be writes new values to PostgreSQL (transaction commit).
2. Immediately after commit: either update the key in Valkey or delete it.
   - **Update:** `DEL cache:db:settings` → `HSET cache:db:settings k1 v1 k2 v2 ...` → `EXPIRE cache:db:settings 300`
   - **Invalidate only:** `DEL cache:db:settings` — next read will reload from DB.
3. Optional (multiple evi-be instances): `PUBLISH cache:invalidated settings` so all instances drop their local in-memory copy.

Default TTL: **300 s (5 minutes)**. Individual keys may use a longer TTL for rarely changing data.

### TTL reference

| Use case | Key pattern | TTL |
|----------|-------------|-----|
| Application settings | `cache:db:settings` | 300 s (default) |
| Rarely changing catalog | `cache:db:catalog:*` | 3600 s |
| Per-user data | `cache:db:user:<id>` | 300 s |

### Node.js example — cache-aside + invalidation (ioredis)

```typescript
import Valkey from 'ioredis';

const valkey = new Valkey(process.env.VALKEY_URL!);
const CACHE_KEY = 'cache:db:settings';
const DEFAULT_TTL = 300;

async function getSettings(db: Db): Promise<Record<string, string>> {
  const cached = await valkey.hgetall(CACHE_KEY);
  if (Object.keys(cached).length) return cached;
  const rows = await db.query('SELECT key, value FROM app_settings');
  const map = Object.fromEntries(rows.rows.map((r: any) => [r.key, r.value]));
  if (Object.keys(map).length) {
    await valkey.hset(CACHE_KEY, map);
    await valkey.expire(CACHE_KEY, DEFAULT_TTL);
  }
  return map;
}

// Call after writing to DB
async function invalidateSettings(): Promise<void> {
  await valkey.del(CACHE_KEY);
  await valkey.publish('cache:invalidated', 'settings');
}
```

### Go example — cache-aside (go-redis client)

```go
// Note: go-redis is the client library name; the server is Valkey.
import "github.com/redis/go-redis/v9"

const cacheKey = "cache:db:settings"
const defaultTTL = 300 * time.Second

func GetSettings(ctx context.Context, v *redis.Client, db *sql.DB) (map[string]string, error) {
    m, err := v.HGetAll(ctx, cacheKey).Result()
    if err == nil && len(m) > 0 {
        return m, nil
    }
    rows, err := db.QueryContext(ctx, "SELECT key, value FROM app_settings")
    // ... scan rows into m ...
    if len(m) > 0 {
        v.HSet(ctx, cacheKey, m)
        v.Expire(ctx, cacheKey, defaultTTL)
    }
    return m, nil
}

// Call after writing to DB
func InvalidateSettings(ctx context.Context, v *redis.Client) error {
    v.Del(ctx, cacheKey)
    return v.Publish(ctx, "cache:invalidated", "settings").Err()
}
```

---

## 2. Operational cache (`op:*`)

Pure Valkey keys — no database involved. Set TTL matching the use-case window.

### Rate limiting example

```
op:ratelimit:<scope>:<client_id>
```

- Increment on each request: `INCR op:ratelimit:api:user:123`
- Set TTL on first write: `EXPIRE op:ratelimit:api:user:123 60`
- evi-be reads the counter and rejects if over the limit. Valkey handles cleanup automatically when TTL expires.

---

## 3. Task queues (`stream:*`)

Use **Valkey Streams** with consumer groups. Do **not** use Lists + BRPOP for critical tasks: if a worker dies after taking a message but before finishing, the message is lost. Streams keep a Pending Entries List (PEL) until you `XACK`.

Queues are **not** synced to PostgreSQL. If event logging is needed later, a worker writes completed events to a separate store after `XACK` — the Valkey stream itself is not an event log.

### Commands

| Operation | Command | Who |
|-----------|---------|-----|
| Enqueue | `XADD stream:tasks:email * type welcome payload {...}` | evi-be |
| Consume | `XREADGROUP GROUP workers consumer1 COUNT 1 BLOCK 5000 STREAMS stream:tasks:email >` | evi-worker |
| Acknowledge | `XACK stream:tasks:email workers <id>` | evi-worker after success |
| Reclaim stuck | `XAUTOCLAIM stream:tasks:email workers consumer1 60000 0-0` | evi-worker on startup or periodic check |
| Trim delivered | `XTRIM stream:tasks:email MAXLEN ~ 10000` | Optional: keep stream bounded |

Create consumer group once (e.g. on worker startup):
```
XGROUP CREATE stream:tasks:email workers 0 MKSTREAM
```

### Node.js example (ioredis)

```typescript
import Valkey from 'ioredis';

const valkey = new Valkey(process.env.VALKEY_URL!);
const STREAM = 'stream:tasks:email';
const GROUP = 'workers';
const CONSUMER = `consumer-${process.pid}`;

await valkey.xgroup('CREATE', STREAM, GROUP, '0', 'MKSTREAM').catch(() => {});

async function consume() {
  const result = await valkey.xreadgroup(
    'GROUP', GROUP, CONSUMER,
    'COUNT', 1, 'BLOCK', 5000,
    'STREAMS', STREAM, '>'
  );
  if (!result?.length) return setImmediate(consume);
  const [, messages] = result[0];
  for (const [id, fields] of messages) {
    try {
      await processTask(fields);
      await valkey.xack(STREAM, GROUP, id);
    } catch {
      // Leave in PEL; XAUTOCLAIM reclaims after idle timeout
    }
  }
  setImmediate(consume);
}
consume();
```

### Go example (go-redis client)

```go
// Note: go-redis is the client library name; the server is Valkey.
import "github.com/redis/go-redis/v9"

const stream = "stream:tasks:email"
const group = "workers"

func Run(ctx context.Context, v *redis.Client, consumerID string) error {
    v.XGroupCreateMkStream(ctx, stream, group, "0")
    for {
        streams, err := v.XReadGroup(ctx, &redis.XReadGroupArgs{
            Group:    group,
            Consumer: consumerID,
            Streams:  []string{stream, ">"},
            Count:    1,
            Block:    5 * time.Second,
        }).Result()
        if err == redis.Nil || len(streams) == 0 {
            continue
        }
        if err != nil {
            return err
        }
        for _, msg := range streams[0].Messages {
            if processTask(ctx, msg.Values) == nil {
                v.XAck(ctx, stream, group, msg.ID)
            }
        }
    }
}
```

---

## 4. Memory and persistence

**Memory limit:** `maxmemory 1gb`. This also bounds the size of `dump.rdb` and `appendonly.aof` on disk, since they represent the in-memory dataset.

**Eviction:** `volatile-lru` — only keys with TTL are candidates for eviction. Stream keys have no TTL and are never evicted.

**Persistence files:**
- `dump.rdb` — a single file, replaced on each RDB snapshot. No accumulation of old snapshots.
- `appendonly.aof` — compacted automatically by AOF rewrite when it grows 100% beyond last rewrite size (minimum 64 MB). Old log entries are replaced; the file does not grow without bound.
- There is no built-in file rotation. File size is bounded indirectly by `maxmemory`.

**Recovery:** On restart, Valkey loads the AOF (preferred) or RDB from `/data` and restores the full in-memory state, including queued tasks and cached data.

---

## 5. Deployment note

Place `valkey.conf` at `EVI_STATE_DIR/valkey/valkey.conf` (install.sh copies it from `state/valkey.conf` automatically). The evi-state container mounts that path read-only and injects `requirepass` at runtime from a Podman secret — the password is never stored in the config file.
