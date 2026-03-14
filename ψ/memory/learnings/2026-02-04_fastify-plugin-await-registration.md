# Fastify Plugins Must Be Awaited Before Route Registration

**Date**: 2026-02-04
**Context**: trackattendance-api rate limiter silently not enforcing
**Confidence**: High

## Key Learning

When registering Fastify plugins (like `@fastify/rate-limit`) that add hooks, decorators, or middleware used by routes, the `app.register()` call must be awaited before routes are defined. Without `await`, routes are added synchronously before the async plugin initialization completes, causing the plugin to have no effect.

This is especially tricky in TypeScript/ESM where top-level `await` may not be available. The solution is to wrap all server setup (plugin registration, route definitions, hooks, and `app.listen()`) inside an `async function bootstrap()` and call it at the end.

## The Pattern

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

## Why This Matters

A plugin that registers without error but has no effect is a silent failure — the worst kind of bug. Everything appears to work (server starts, routes respond) but the security/rate-limiting behavior is missing. This was only caught through explicit testing (sending more requests than the limit).

Always verify plugin behavior with an explicit test after installation, especially for security-critical plugins like rate limiters and auth middleware.

## Tags

`fastify`, `rate-limiting`, `async`, `plugin-registration`, `silent-failure`, `typescript`
