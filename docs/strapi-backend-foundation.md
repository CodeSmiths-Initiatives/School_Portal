# Strapi Backend Foundation

## Current Backend Layout

The Strapi backend lives inside the monorepo:

```text
backend/
```

Use this value in Strapi Cloud:

```text
Base directory: /backend
```

## Local Scripts

From the repository root:

```text
npm run backend:dev
npm run backend:build
npm run backend:start
```

From the backend folder:

```text
npm run develop
npm run build
npm run start
```

## Cloud Project Settings

Recommended Strapi Cloud setup after this backend foundation is pushed:

```text
Repository: School_Portal
Branch: main
Base directory: /backend
Region: Europe (West)
Node version: Default or Node 20+
Auto deploy: Off during setup, on after first stable deployment
```

## Environment Variables

Local development should use PostgreSQL:

```text
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=iums_backend
DATABASE_USERNAME=iums_user
DATABASE_PASSWORD=iums_password
DATABASE_SSL=false
```

Start local PostgreSQL from `backend/`:

```text
docker compose up -d
```

Strapi Cloud / managed Postgres should use injected Cloud database variables or:

```text
DATABASE_CLIENT=postgres
DATABASE_URL=<provided by cloud if applicable>
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

The backend includes its own `postcss.config.mjs` so the Strapi admin build does
not load the frontend Tailwind PostCSS config from the monorepo root.

Required secrets:

```text
APP_KEYS
API_TOKEN_SALT
ADMIN_JWT_SECRET
TRANSFER_TOKEN_SALT
JWT_SECRET
ENCRYPTION_KEY
```

Do not commit real secrets. Use `backend/.env.example` as the template.

## Foundation Content Types

The first backend foundation includes:

```text
College
Faculty
Department
Course
Permission
Portal Role
Menu Item
Role Assignment
Audit Log
```

The access model follows the frontend RBAC architecture:

```text
Role = permission package
Permission = module.action
Assignment = where the role applies
Tenant scope = platform or college
Role scope = platform, college, faculty, department, course, or self
```
