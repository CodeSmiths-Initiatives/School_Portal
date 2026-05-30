# Strapi API Integration Layer

Phase 2C adds the frontend data-access foundation for Strapi without coupling UI
components to Strapi response shapes.

## Files

```text
lib/api/
  endpoints.ts
  strapi-client.ts
  strapi-mappers.ts
  strapi-query.ts
  strapi-types.ts
  index.ts

lib/services/
  college.service.ts
  menu.service.ts
  rbac.service.ts
  system.service.ts
  index.ts

app/api/system/strapi/route.ts
```

## Rules

- UI components should call service functions, not raw Strapi URLs.
- Service functions should map Strapi data into frontend-friendly types.
- Strapi auth tokens must stay server-side in `STRAPI_API_TOKEN`.
- Public environment variables are only for safe browser configuration such as
  `NEXT_PUBLIC_STRAPI_API_URL`.
- Auth pages are intentionally not integrated in Phase 2C.

## Environment

```text
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=
```

`STRAPI_API_TOKEN` is required for protected collection reads unless collection
permissions are explicitly opened in Strapi. The current local Strapi content
APIs correctly return `403 Forbidden` without that token.

## Health Check

The diagnostic route checks backend reachability without exposing protected data:

```text
GET /api/system/strapi
```

Expected local response while no content API token is configured:

```json
{
  "reachable": true,
  "status": 204,
  "message": "Strapi is reachable.",
  "authConfigured": false
}
```

## Next Phase

Phase 2D should add tenant-aware auth/session behavior and then consume the
Phase 2C services to fetch permissions, role assignments, and menu items for the
logged-in user.
