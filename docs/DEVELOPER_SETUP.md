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

## 4. Current Public and Tenant Routes

The application is now tenant-first. Use `/apply` only as the college selector.
After choosing a college, applicants should continue under the selected college
slug so every application, invoice, transaction, and ledger entry can carry
`collegeSlug`/`collegeId`.

Important routes:

| Area | Route | Purpose |
| ---- | ----- | ------- |
| Public landing page | `/` | Website entry page |
| College selector | `/apply` | Pick the college before starting admission |
| Tenant admission wizard | `/college/[collegeSlug]/apply` | Student applicant account, programme, Paystack payment |
| Student login | `/signin` | Student/applicant sign in |
| Student forgot password | `/forgot-password` | Student reset email flow |
| Staff/admin login | `/staff/signin` | Staff, college admin, and superadmin sign in |
| Staff forgot password | `/staff/forgot-password` | Internal reset email flow |
| Student dashboard | `/college/[collegeSlug]/student/dashboard` | Student overview |
| Student admission form | `/college/[collegeSlug]/student/admission` | Long 5-step student admission form with resumable saves |
| Student profile | `/college/[collegeSlug]/student/profile` | Student profile workspace |
| Shared college modules | `/college/[collegeSlug]/modules/[moduleKey]` | `courses`, `results`, `hostel`, `payments` |
| College admin dashboard | `/college/[collegeSlug]/admin/dashboard` | College admin workspace |
| Staff dashboard | `/college/[collegeSlug]/staff/dashboard` | Dynamic staff-role workspace |
| Superadmin dashboard | `/superadmin/dashboard` | Platform dashboard |

For current local seed data, the main college slug is:

```txt
kwara-applied-sciences
```

Example admission URL:

```txt
http://localhost:3000/college/kwara-applied-sciences/apply
```

## 5. Dashboard Login Details

Use these exact seeded Strapi accounts:

| Dashboard     | Login URL       | Email / Username                             | Password     |
| ------------- | --------------- | -------------------------------------------- | ------------ |
| Superadmin    | `/staff/signin` | `superadmin@iums.test` or `superadmin`       | `Super@123`  |
| College Admin | `/staff/signin` | `admin.kwara@iums.test` or `kwara.admin`     | `Admin@123`  |
| Student       | `/signin`       | `student.kwara@iums.test` or `kwara.student` | `Password@1` |
| HOD           | `/staff/signin` | `hod.kwara@iums.test` or `kwara.hod`         | `Hod@1234`   |
| Clerk         | `/staff/signin` | `clerk.kwara@iums.test` or `kwara.clerk`     | `Clerk@123`  |

Additional local QA student accounts created for payment testing:

| Dashboard | Login URL | Email / Username | Password |
| --------- | --------- | ---------------- | -------- |
| Student payment QA 1 | `/signin` | `qa.student.pay1@example.com` or `qa.student.pay1` | `Password@1` |
| Student payment QA 2 | `/signin` | `qa.student.pay2@example.com` or `qa.student.pay2` | `Password@1` |

Use `.com` emails for Paystack initialization tests. Paystack rejects `.test`
addresses with `Invalid Email Address Passed`.

Expected routes after login:

```txt
Student       -> /college/kwara-applied-sciences/student/dashboard
College Admin -> /college/kwara-applied-sciences/admin/dashboard
HOD           -> /college/kwara-applied-sciences/staff/dashboard
Clerk         -> /college/kwara-applied-sciences/staff/dashboard
Superadmin    -> /superadmin/dashboard
```

## 6. Current Auth and User Storage Architecture

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

User storage:

- Portal login users are stored in Strapi Users & Permissions table `up_users`.
- The Strapi admin panel has its own admin table `admin_users`; this is not used for portal login.
- We do not create separate login tables for superadmin, college admin, staff, and student.
- User type/dashboard access is resolved through `portal_roles` and `role_assignments`.
- `role_assignments` links one `up_users` record to a `portal_role`, college, and optional faculty/department/course/self scope.

This allows one user table while still supporting:

- Platform superadmin
- College admin per college
- Dynamic staff roles per college
- Student/applicant accounts per college

## 7. Admission and Payment Persistence Checks

The admission wizard now saves a draft application on Step 1 and updates the
same application record as the user continues.

Main APIs:

```txt
GET   /api/admissions/applications?collegeSlug=kwara-applied-sciences&email=student@example.com
POST  /api/admissions/applications
PATCH /api/admissions/applications/[applicationId]
POST  /api/payments/initialize
POST  /api/payments/verify
GET   /api/payments/ledger?collegeSlug=kwara-applied-sciences
```

Important Strapi tables:

```txt
admission_applications
payment_invoices
payment_transactions
payment_ledger_entries
up_users
portal_roles
role_assignments
```

Payment flow:

1. Applicant starts at `/apply` and selects a college.
2. Applicant continues at `/college/[collegeSlug]/apply`.
3. Step 1 creates/returns a draft `admission_application`.
4. Step 2 updates that same application with programme/session and marks payment pending.
5. Step 3 initializes Paystack and persists:
   - `payment_invoice`
   - `payment_transaction`
   - debit `payment_ledger_entry`
6. When Paystack verification succeeds, `/api/payments/verify` marks:
   - transaction `success`
   - invoice `paid`
   - admission application `submitted` and `paymentStatus=paid`
   - credit ledger entry

The payments module at:

```txt
/college/kwara-applied-sciences/modules/payments
```

uses the authenticated session. Students see their own payment records; college
admins and finance-capable roles see college-wide payment records.

## 8. Build Checks

Run before handoff:

```bash
npm run build
npm run backend:build
```

## 9. Next Backend Work

Remaining production auth work:

- Add student profile records linked to `plugin::users-permissions.user`.
- Add staff profile records linked to role assignments, departments, and courses.
- Add API permission policies so Strapi also enforces tenant scope server-side.
- Add refresh-token strategy if we need sessions longer than the current cookie TTL.
