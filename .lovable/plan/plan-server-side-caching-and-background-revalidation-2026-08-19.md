# Plan: Server-Side Caching and Background Revalidation

We will implement a global caching strategy for the dashboard and critical data fetching routes to eliminate loading times during site entry. By caching database responses in memory and revalidating them in the background, we ensure the UI is always interactive immediately.

## User Review Required

> [!IMPORTANT]
> The cache will stay in memory on the server. If the server restarts (e.g., after a new deployment), the first user will still experience a cold start, but subsequent loads will be instant.

## Proposed Changes

### Database & Functions Otimization

#### [src/lib/db.server.ts]
- Implement a global cache object to store recent query results.
- Add TTL (Time-To-Live) logic to ensure data doesn't get too stale.

#### [src/lib/dashboard.functions.ts]
- Wrap the `getDashboardStats` handler with the new caching mechanism.
- Ensure that background revalidation is triggered when data is older than a specific threshold (e.g., 5 minutes).

### Routing & Loading

#### [src/routes/index.tsx]
- Update the loader to use the cached data if available.
- Refine the prefetch logic to prioritize cache hits.

## Technical Details

- **Cache Strategy**: "Stale-While-Revalidate" (SWR) on the server side.
- **TTL**: 5 minutes for strict validity, 30 minutes for stale serving.
- **Concurrency**: Use `Promise.all` to maintain parallel fetching while updating the cache.
