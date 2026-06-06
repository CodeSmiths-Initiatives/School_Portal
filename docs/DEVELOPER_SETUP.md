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
PORTAL_REGISTRATION_SECRET=replace_with_internal_registration_secret
PORTAL_INTERNAL_API_SECRET=replace_with_internal_payment_secret
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
PORTAL_REGISTRATION_SECRET=replace_with_internal_registration_secret
PORTAL_INTERNAL_API_SECRET=replace_with_internal_payment_secret
```

Local development has a fallback internal secret so the app can run quickly, but production must set both `PORTAL_REGISTRATION_SECRET` and `PORTAL_INTERNAL_API_SECRET`. These protect the internal Strapi routes used by Next.js for student portal account registration and payment ledger persistence.

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
| Superadmin colleges | `/superadmin/colleges` | Create college tenants and their primary college admin |
| Superadmin roles | `/superadmin/roles` | Manage global Student and College Admin permission templates |
| Superadmin reports | `/superadmin/reports` | College-wise admission, payment, student, and revenue reports |
| Superadmin audit | `/superadmin/audit` | Platform-wide audit by college, actor, activity, and date range |

Current local seed data provisions five active demo colleges. `/apply` shows
only active colleges; archived local QA colleges stay hidden from applicant
entry.

| Code | College | Slug |
| ---- | ------- | ---- |
| KAS | Kwara State College of Applied Sciences | `kwara-applied-sciences` |
| KBH | Kwara State College of Business and Health | `kwara-business-health` |
| KCE | Kwara College of Education | `kwara-college-education` |
| KPI | Kwara Polytechnic Institute | `kwara-polytechnic-institute` |
| KAT | Kwara Agriculture and Technology | `kwara-agriculture-technology` |

Example admission URL:

```txt
http://localhost:3000/college/kwara-applied-sciences/apply
```

## 5. Dashboard Login Details

Use these exact seeded Strapi accounts:

| Dashboard | Login URL | Email / Username | Password |
| --------- | --------- | ---------------- | -------- |
| Superadmin | `/staff/signin` | `superadmin@iums.test` or `superadmin` | `Super@123` |
| KAS Admin | `/staff/signin` | `admin.kas@iums.test` or `admin.kas` | `Admin@123` |
| KAS Student 1 | `/signin` | `student1.kas@iums.test` or `student1.kas` | `Student@1` |
| KAS HOD | `/staff/signin` | `hod.kas@iums.test` or `hod.kas` | `Hod@1234` |
| KAS Clerk 1 | `/staff/signin` | `clerk1.kas@iums.test` or `clerk1.kas` | `Clerk@123` |
| KAS Clerk 2 | `/staff/signin` | `clerk2.kas@iums.test` or `clerk2.kas` | `Clerk@123` |
| KAS Cashier | `/staff/signin` | `cashier.kas@iums.test` or `cashier.kas` | `Cashier@1` |

The same pattern is available for every seeded college code: `kas`, `kbh`,
`kce`, `kpi`, and `kat`.

Examples:

| Role | KBH | KCE | KPI | KAT |
| ---- | --- | --- | --- | --- |
| Admin | `admin.kbh@iums.test` | `admin.kce@iums.test` | `admin.kpi@iums.test` | `admin.kat@iums.test` |
| Student 1 | `student1.kbh@iums.test` | `student1.kce@iums.test` | `student1.kpi@iums.test` | `student1.kat@iums.test` |
| HOD | `hod.kbh@iums.test` | `hod.kce@iums.test` | `hod.kpi@iums.test` | `hod.kat@iums.test` |
| Clerk 1 | `clerk1.kbh@iums.test` | `clerk1.kce@iums.test` | `clerk1.kpi@iums.test` | `clerk1.kat@iums.test` |
| Clerk 2 | `clerk2.kbh@iums.test` | `clerk2.kce@iums.test` | `clerk2.kpi@iums.test` | `clerk2.kat@iums.test` |
| Cashier | `cashier.kbh@iums.test` | `cashier.kce@iums.test` | `cashier.kpi@iums.test` | `cashier.kat@iums.test` |

Per college, the seed creates:

- 1 college admin
- 5 students: `student1.<code>` through `student5.<code>`
- 1 HOD
- 2 clerks
- 1 cashier

Additional local QA student accounts created for payment testing:

| Dashboard | Login URL | Email / Username | Password |
| --------- | --------- | ---------------- | -------- |
| Student payment QA 1 | `/signin` | `qa.student.pay1@example.com` or `qa.student.pay1` | `Password@1` |
| Student payment QA 2 | `/signin` | `qa.student.pay2@example.com` or `qa.student.pay2` | `Password@1` |

Use `.com` emails for Paystack initialization tests. Paystack rejects `.test`
addresses with `Invalid Email Address Passed`.

Expected routes after login:

```txt
Student       -> /college/[collegeSlug]/student/dashboard
College Admin -> /college/[collegeSlug]/admin/dashboard
HOD           -> /college/[collegeSlug]/staff/dashboard
Clerk         -> /college/[collegeSlug]/staff/dashboard
Cashier       -> /college/[collegeSlug]/staff/dashboard
Superadmin    -> /superadmin/dashboard
```

For KAS, `[collegeSlug]` is `kwara-applied-sciences`.

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
- Student and College Admin are global platform role templates:
  - `platform-student`
  - `platform-college-admin`
- Those two role permissions are managed by the Superadmin and reused across all colleges.
- Their tenant context comes from `role_assignments.college`, not from a separate role per college.
- College Admin-created roles such as HOD, Clerk, Supervisor, Teacher, or Bursary are college-scoped custom roles and can have different permissions per college.

This allows one user table while still supporting:

- Platform superadmin
- One reusable College Admin role assigned per college
- Dynamic staff roles per college
- One reusable Student role assigned per applicant's college

## 7. Admission and Payment Persistence Checks

The admission wizard now saves a draft application on Step 1 and updates the
same application record as the user continues.

Main APIs:

```txt
POST  /api/auth/register-student
GET   /api/superadmin/colleges
POST  /api/superadmin/colleges
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

Superadmin college provisioning:

1. Superadmin signs in at `/staff/signin`.
2. Open `/superadmin/colleges`.
3. Enter college name/code and primary admin username, email, phone, and temporary password.
4. College name/slug, college code, contact email, admin username, and admin email must be unique.
5. The app creates the Strapi college, primary admin user, and college-scoped role assignment using the global `platform-college-admin` template.
6. The global `platform-student` template is reused when students register under any college.
7. The admin can sign in at `/staff/signin`, and the college appears on `/apply`.

Current seeded college verification:

```txt
Colleges: 5 active demo colleges
Admins: 5 total, 1 per college
Students: 25 total, 5 per college
Staff roles: 20 total, 1 HOD + 2 clerks + 1 cashier per college
Applications: 25 total, 5 per college
Invoices: 15 paid + 5 pending
Audit logs: 17 structured current demo rows
```

College lifecycle management:

1. Superadmin can edit college name, contact email, admin name, admin username, admin email, admin phone, and status from `/superadmin/colleges`.
2. College code is locked after creation.
3. College slug is locked after creation and does not change when the college name changes. Existing URLs, admissions, invoices, payments, and ledgers depend on it.
4. Admin email and admin username can be changed only when the new values are globally unique in `up_users`.
5. Setting a college to `inactive` hides it from `/apply`.
6. Users assigned to an inactive college cannot complete portal-session resolution, so college admin, staff, and student logins are blocked until the college is reactivated.
7. Superadmin remains platform-scoped and can still manage inactive colleges.

Superadmin global role management:

1. Superadmin opens `/superadmin/roles`.
2. The screen manages only `platform-college-admin` and `platform-student`.
3. Superadmin can create new `module.action` permission keys.
4. Superadmin can toggle permissions on either global role template.
5. College-local custom roles such as HOD, Clerk, Supervisor, and Teacher will be managed from the College Admin area in the next role-management phase.

Audit visibility model:

1. Superadmin audit is platform-wide and can filter/export activity across every college.
2. College Admin audit must be college-scoped only; it can show activity for users, payments, admissions, and modules inside that college.
3. College-created roles such as HOD, Clerk, Supervisor, or Teacher can see college audit only when their assigned role has `audit.view`.
4. Student audit must be self-scoped only. A student can see actions they performed and actions where their student record/application/payment was the target.
5. Audit records should store actor, actor role, college, target user/entity, action, timestamp, IP/device metadata, and before/after metadata for sensitive edits.

Report visibility model:

1. Superadmin reports are platform-wide and must start with a college filter plus date range.
2. Superadmin can compare all colleges or isolate one college across admissions, students, payments, unpaid balances, and revenue.
3. College Admin reports should reuse the same report model but force `collegeSlug` from the logged-in session.
4. College-created roles can view report modules only when their role has `reports.view`; data remains scoped to their college and later can be narrowed by department/course assignment.
5. Student reports are not platform reports. Students should see only their own payment/admission/profile summaries.

Superadmin report and audit APIs:

```txt
GET  /api/superadmin/reports
GET  /api/superadmin/audit
POST /api/superadmin/audit-events
```

These routes are internal Strapi endpoints. Next.js calls them with
`x-portal-internal-secret`. The report endpoint defaults to active colleges
only, aggregates live Strapi data, and supports `collegeSlug`, `from`, and `to`
query filters. The audit endpoint returns structured/current rows sorted by the
actual event timestamp.

Superadmin settings:

1. Superadmin settings are available at `/superadmin/settings`.
2. The side menu uses the existing `settings.view` permission and updates require `settings.update`.
3. The current settings workspace covers:
   - Superadmin password change through Strapi `/api/auth/change-password` when a JWT session token is available.
   - Platform notice creation for all users, students, staff, or college admins.
   - Maintenance-window messaging with start/end dates and impact level.
4. `GET /api/superadmin/settings` returns the current MVP settings contract.
5. `PATCH /api/superadmin/settings` validates password, notice, and maintenance updates.
6. Notice and maintenance updates write structured audit rows through the internal Strapi audit endpoint.
7. Notice and maintenance persistence is currently MVP/local-preview. The production backend slice should persist these records in Strapi settings/content types and expose active public notices to guest/auth layouts.

Payment flow:

1. Applicant starts at `/apply` and selects a college.
2. Applicant continues at `/college/[collegeSlug]/apply`.
3. Step 1 creates or updates a Strapi portal student account using the applicant email and password, then creates/returns a draft `admission_application`.
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

If a payment was completed but the ledger shows pending, re-run:

```txt
POST /api/payments/verify
```

with the Paystack reference. The local MVP can persist via the internal Strapi payment route when `STRAPI_API_TOKEN` is not configured. The print button in the payment module prints only the selected invoice detail, not the full browser page.

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
