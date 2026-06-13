# AI Context

Use this file at the start of a new AI chat to avoid replaying project history.
Keep it compact and update it only when architecture, routes, auth, tenant rules,
or current phase changes.

## Startup Prompt

```text
Read docs/AI_CONTEXT.md first.
Task: <specific task>.
Follow Engineering Instructions.
Implement, test, cleanup, commit.
```

## Current Goal

Build a tenant-first school portal with Strapi/Postgres backend, Next.js
frontend, reusable role-aware modules, student admission/profile flow, payment
ledger, audit trail, and dashboards for superadmin, college admin, staff roles,
and students.

## Architecture Rules

- Tenant-first app: college context is required for college admin, staff, and
  student data.
- Use `/apply` only as the public college selector.
- After college selection, admission must continue under
  `/college/[collegeSlug]/apply`.
- Every college-scoped API/data operation must carry or resolve `collegeId` /
  `collegeSlug`.
- Static global role templates are `platform-superadmin`,
  `platform-college-admin`, and `platform-student`.
- Do not create one student/admin role per college. College membership comes
  from `role_assignments`.
- Dynamic roles such as HOD, Clerk, Cashier, Teacher, and Supervisor are
  college-scoped custom roles.
- Shared modules such as courses, results, hostel, and payments should be
  reusable college modules with role/permission-based actions.
- Strapi/Postgres is the source of truth. Static MVP login fallback should not
  be used unless explicitly enabled for preview.

## Tenant/RBAC Rules

- Superadmin is platform-scoped and can manage all colleges, global roles,
  reports, and audit.
- College Admin is scoped to one college and can manage college users, dynamic
  roles, students, payments, reports, courses, hostel, and related data.
- Staff roles are dynamic and college-scoped. Their side menu and actions come
  from permissions.
- Student role is global but data is self-scoped within the assigned college.
- Permissions use `module.action` format, for example `students.view`,
  `students.export`, `courses.create`, `payments.verify`, `audit.view`.
- Side menus and action buttons should be permission-aware.
- Login must be blocked when the assigned college is inactive.

## Important Routes

- `/` public landing page
- `/apply` college selector
- `/college/[collegeSlug]/apply` tenant admission wizard
- `/signin` student/applicant login
- `/forgot-password` student password reset flow
- `/staff/signin` staff, college admin, and superadmin login
- `/staff/forgot-password` internal password reset flow
- `/college/[collegeSlug]/student/dashboard`
- `/college/[collegeSlug]/student/admission`
- `/college/[collegeSlug]/student/profile`
- `/college/[collegeSlug]/admin/dashboard`
- `/college/[collegeSlug]/staff/dashboard`
- `/college/[collegeSlug]/modules/[moduleKey]`
- `/superadmin/dashboard`
- `/superadmin/colleges`
- `/superadmin/roles`
- `/superadmin/reports`
- `/superadmin/audit`
- `/superadmin/settings`

## Backend Collections

- `plugin::users-permissions.user`: one login table for portal users.
- `api::college.college`: tenant boundary.
- `api::portal-role.portal-role`: global/system and college/custom role
  templates.
- `api::role-assignment.role-assignment`: connects user, role, college, and
  optional faculty/department/course/self scope.
- `api::permission.permission`: `module.action` permission registry.
- `api::menu-item.menu-item`: permission-backed menu registry.
- `api::admission-application.admission-application`: student admission,
  payment state, and profile step metadata.
- `api::payment-invoice.payment-invoice`: raised bill per module.
- `api::payment-transaction.payment-transaction`: gateway attempt/verification.
- `api::payment-ledger-entry.payment-ledger-entry`: append-style accounting
  movement.
- `api::audit-log.audit-log`: who did what, when, where, and to which entity.
- `api::faculty.faculty`, `api::department.department`, `api::course.course`:
  academic structure within a college.

## Key Flows

- Student signup starts at `/apply`, then `/college/[collegeSlug]/apply`.
- If account is created before payment and payment is not complete, login should
  resume the admission/payment flow instead of opening the student dashboard.
- Student dashboard access should happen only when the account is in an allowed
  state after successful payment/submission rules.
- Student profile/admission has five saved sections: Bio Data, Contact,
  O-Level, Programme, Declaration.
- Each student profile section saves on Continue because the form is long and
  must be resumable.
- Final declaration/submission creates or confirms the unique admission ID.
- Admin Students screen should be a full-width paginated table with filters,
  reset, view, print, and export actions.
- Payment records must link invoice, transaction, ledger entry, college,
  student, and admission application.
- Print actions should print only the target invoice/admission slip/detail
  section, not the full browser page.

## Engineering Instructions

Act as a senior software engineer and senior software architect.

For every implementation:

- Inspect existing code before editing.
- Follow current folder structure, theme, and reusable patterns.
- Prefer shared components, shared services, and typed helpers over duplicated
  role-specific code.
- Keep changes scoped to the requested module.
- Keep API responses tenant-scoped and reasonably small.
- Keep time complexity low; avoid repeated filtering, unnecessary nested loops,
  and repeated API calls.
- Add or preserve indexes for fields used in tenant filters, lookups, joins,
  sorting, and search.
- Avoid slow queries, deadlocks, and heavy blocking I/O.
- Add audit logs for sensitive create/update/delete/login/payment/admin actions.
- Keep JWT/session handling secure. Do not store JWT in localStorage.
- Never expose Paystack secret keys or Strapi internal secrets to the browser.
- Use append-style ledger entries for payment movements.
- Maintain responsive UI for desktop, tablet, and mobile.
- After changes, run relevant TypeScript/build/API checks when feasible.
- Clean up unused imports, redundant files, and stale preview routes when they
  are inside scope.

## Run Commands

Detailed commands live in `docs/EXECUTION_RUNBOOK.md`.

- Backend: `npm run backend:dev`
- Frontend: `npm run dev`
- Frontend build: `npm run build`
- Backend build: `npm run backend:build`
- Strapi health: `http://localhost:1337/_health`
- Frontend: `http://localhost:3000`

## Default Completion Contract

Unless told otherwise:

1. Implement the smallest clean slice.
2. Verify with relevant checks.
3. Review cleanup.
4. Commit only related files.
5. Final response should include changed files, tests, commit hash/message, and
   next recommended step.

## Do Not Change

- Do not reintroduce non-tenant student/admin preview routes.
- Do not create per-college static student/admin role templates.
- Do not trust browser-provided tenant, invoice, transaction, or role authority
  without server-side validation.
- Do not store secrets or JWTs in client-accessible storage.
- Do not change college slug automatically after college creation.
- Do not stage unrelated files such as local backups.

## Current Phase

Active work is around student admission/profile polish and college admin student
management:

- Student profile image upload/display needs reliable Strapi media handling.
- Student profile/admission summary must be responsive and printable.
- College admin Students page should use the full-width table pattern with
  view/print/export actions.
- Next larger slice is college admin roles/permissions, reports, and payment
  reconciliation using live Strapi data.

## Last Stable Commit

`5675dee` - `refactor: present admin students as table`
