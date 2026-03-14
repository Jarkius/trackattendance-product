---
title: # Fastify Plugins Must Be Awaited Before Route Registration
tags: [fastify, rate-limiting, async, plugin-registration, silent-failure, typescript, trackattendance-api]
created: 2026-02-04
source: rrr: Jarkius/trackattendance-api
---

# # Fastify Plugins Must Be Awaited Before Route Registration

# Fastify Plugins Must Be Awaited Before Route Registration

When registering Fastify plugins (like `@fastify/rate-limit`) that add hooks, decorators, or middleware used by routes, the `app.register()` call must be awaited before routes are defined. Without `await`, routes are added synchronously before the async plugin initialization completes, causing the plugin to have no effect.

The solution is to wrap all server setup inside an `async function bootstrap()`:

```typescript
// BROKEN: plugin not ready when routes register
app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
app.get('/api', handler); // rate limit not applied

// FIXED: await ensures plugin is ready
async function bootstrap() {
  await app.register(rateLimit, { max: 60, timeWindow: '1 minute' });
  app.get('/api', handler); // rate limit applied
  await app.listen({ host: '0.0.0.0', port });
}
bootstrap().catch(err => { console.error(err); process.exit(1); });
```

A plugin that registers without error but has no effect is a silent failure — the worst kind of bug. Always verify plugin behavior with explicit testing.

---
*Added via Oracle Learn*
