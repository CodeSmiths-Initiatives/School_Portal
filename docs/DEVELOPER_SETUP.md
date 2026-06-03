# School Portal Developer Setup

This project runs a Next.js frontend and a Strapi backend. For the current MVP, auth can run in `auto` mode:

- First it tries Strapi Users & Permissions auth.
- After Strapi validates credentials, Next.js calls Strapi `/api/auth/portal-session` to resolve the user's college, role, scope, and permissions.
- If Strapi is not reachable or the Strapi user is not ready, `auto` mode can fall back to the seeded MVP accounts.

## 1. Install Packages

From the project root:

```bash
npm install
npm install --prefix backend
```

## 2. Environment Files

Frontend `.env.local` should include:

```env
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
STRAPI_API_URL=http://localhost:1337
NEXT_PUBLIC_AUTH_PROVIDER=auto
AUTH_SESSION_SECRET=replace_with_32_plus_random_characters
```

Auth provider options:

- `auto`: try Strapi first, then MVP fallback.
- `strapi`: Strapi auth only.
- `mvp`: local seeded frontend auth only.

Backend `backend/.env` should include PostgreSQL settings:

```env
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=skillzncert
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=mail_123
DATABASE_SSL=false
STRAPI_SEED_DEFAULT_DATA=true
FRONTEND_URL=http://localhost:3000
```

Backend email reset support uses Gmail SMTP through Strapi Nodemailer. Use a Gmail app password, not the normal account password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your_gmail_address@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=your_gmail_address@gmail.com
SMTP_REPLY_TO=your_gmail_address@gmail.com
JWT_EXPIRES_IN=30d
```

The seed step also keeps Strapi Users & Permissions reset emails pointed at:

```txt
http://localhost:3000/reset-password
```

## 3. Run Applications

Before starting Strapi, make sure PostgreSQL is running. On this Windows machine the service name is:

```txt
postgresql-x64-18
```

If Strapi shows `ECONNREFUSED 127.0.0.1:5432`, PostgreSQL is stopped or not accepting local connections.

Terminal 1, start Strapi:

```bash
npm run backend:dev
```

Strapi runs at:

```txt
http://localhost:1337
```

Terminal 2, start Next.js:

```bash
npm run dev
```

Frontend runs at:

```txt
http://localhost:3000
```

## 4. Dashboard Login Details

Use these exact seeded Strapi accounts:

| Dashboard     | Login URL       | Email / Username                             | Password     |
| ------------- | --------------- | -------------------------------------------- | ------------ |
| Superadmin    | `/staff/signin` | `superadmin@iums.test` or `superadmin`       | `Super@123`  |
| College Admin | `/staff/signin` | `admin.kwara@iums.test` or `kwara.admin`     | `Admin@123`  |
| Student       | `/signin`       | `student.kwara@iums.test` or `kwara.student` | `Password@1` |
| HOD           | `/staff/signin` | `hod.kwara@iums.test` or `kwara.hod`         | `Hod@1234`   |
| Clerk         | `/staff/signin` | `clerk.kwara@iums.test` or `kwara.clerk`     | `Clerk@123`  |

Expected routes after login:

```txt
Student       -> /college/kwara-applied-sciences/student/dashboard
College Admin -> /college/kwara-applied-sciences/admin/dashboard
HOD           -> /college/kwara-applied-sciences/staff/dashboard
Clerk         -> /college/kwara-applied-sciences/staff/dashboard
Superadmin    -> /platform/dashboard
```

## 5. Current Auth Architecture

Frontend login posts to:

```txt
POST /api/auth/login
```

The Next.js route verifies credentials through the configured provider, creates an auth session, and sets an `httpOnly` cookie for route guarding.

Auth session security:

- Strapi JWT is stored only in the `iums-auth-token` `httpOnly` cookie.
- The browser receives only a safe session snapshot without the JWT.
- The route guard reads `iums-auth-session`, which contains signed tenant and destination metadata only.
- Client state is only a UI snapshot for labels/redirects; it is not the security source of truth.

Logout posts to:

```txt
POST /api/auth/logout
```

Protected dashboard routing is handled in:

```txt
proxy.ts
```

## 6. Build Checks

Run before handoff:

```bash
npm run build
npm run backend:build
```

## 7. Next Backend Work

Remaining production auth work:

- Add student profile records linked to `plugin::users-permissions.user`.
- Add staff profile records linked to role assignments, departments, and courses.
- Add API permission policies so Strapi also enforces tenant scope server-side.
- Add refresh-token strategy if we need sessions longer than the current cookie TTL.
