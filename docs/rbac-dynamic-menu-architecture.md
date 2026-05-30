# RBAC + Dynamic Menu Architecture

## Purpose

This phase defines the reusable access-control foundation for the multi-tenant
school portal. The goal is to keep roles dynamic, menus permission-driven, and
actions protected at both UI and API level.

## Core Rule

```text
User -> Role -> Permissions -> Menus + Actions
```

Tenant and role scopes are handled separately:

```text
Tenant scope = which college boundary the user belongs to
Role scope = where inside that boundary the user can act
```

Do not hardcode business logic against role names such as `HOD`. A college may
call that same responsibility `Department Coordinator`, `Programme Lead`, or
another local title. The app should check permissions and assignments instead.

## Permission Format

Permissions use the `module.action` format.

Examples:

```text
students.view
students.create
courses.create
courses.assign_staff
results.upload
results.approve
payments.verify
roles.assign_permissions
```

The current catalog lives in:

```text
lib/rbac/permissions.ts
```

The catalog is intentionally open-ended. New modules and actions can be added
later without changing the permission model.

## Menu Strategy

Each sidebar menu is mapped to one or more permissions.

Example:

```ts
{
  key: "courses",
  label: "Courses",
  requiredPermissions: ["courses.view"]
}
```

If the user does not have `courses.view`, the Courses menu is hidden.

The current menu catalog lives in:

```text
lib/rbac/menus.ts
```

The dashboard shell already reads from this catalog, so the sidebar is now ready
for backend-driven permissions.

## Action Strategy

Menus are not enough. Buttons and workflow actions also require permissions.

Examples:

```text
Add Course -> courses.create
Delete Course -> courses.delete
Upload Result -> results.upload
Approve Result -> results.approve
Verify Payment -> payments.verify
```

The current action catalog lives in:

```text
lib/rbac/actions.ts
```

Frontend usage:

```tsx
{can(user, "courses.create") && <Button>Add Course</Button>}
{can(user, "results.approve", { scope }) && <Button>Approve</Button>}
```

Backend must enforce the same permission checks. Hiding a button is only a UI
convenience, not security.

## Tenant Scope

Tenant scope controls the main data boundary.

Current MVP scopes:

```text
platform = all colleges
college = one college
```

Examples:

```text
Superadmin -> platform
College Admin -> college
Staff -> college
Student -> college
```

Future tenant extensions can include campus, branch, affiliate, or partner
school if the product needs them.

## Role Scope / Assignment Scope

Role scope controls where a permission applies inside a tenant.

Current scalable scopes:

```text
platform
college
faculty
department
course
self
```

Examples:

```ts
{
  scopeType: "department",
  collegeId: "college-1",
  departmentId: "computer-science"
}
```

This means the user can act inside the Computer Science department only.

If a HOD manages two departments, give two assignments:

```ts
[
  {
    scopeType: "department",
    collegeId: "college-1",
    departmentId: "computer-science"
  },
  {
    scopeType: "department",
    collegeId: "college-1",
    departmentId: "mathematics"
  }
]
```

If a teacher teaches two courses, give two course assignments:

```ts
[
  {
    scopeType: "course",
    collegeId: "college-1",
    departmentId: "computer-science",
    courseId: "csc101"
  },
  {
    scopeType: "course",
    collegeId: "college-1",
    departmentId: "mathematics",
    courseId: "mth201"
  }
]
```

This separates:

```text
What the user can do = permission
Where the user can do it = assignment
```

## Example Users

Superadmin:

```ts
{
  tenantScope: "platform",
  assignments: [{ scopeType: "platform" }],
  permissions: ["colleges.view", "colleges.create", "reports.view"]
}
```

College Admin:

```ts
{
  tenantScope: "college",
  collegeId: "college-1",
  assignments: [{ scopeType: "college", collegeId: "college-1" }],
  permissions: ["departments.create", "staff.create", "roles.assign_permissions"]
}
```

Department Lead:

```ts
{
  tenantScope: "college",
  collegeId: "college-1",
  assignments: [
    { scopeType: "department", collegeId: "college-1", departmentId: "dept-1" }
  ],
  permissions: ["courses.create", "results.approve"]
}
```

Student:

```ts
{
  tenantScope: "college",
  collegeId: "college-1",
  assignments: [{ scopeType: "self", collegeId: "college-1", userId: "student-1" }],
  permissions: ["courses.register", "payments.view", "results.view"]
}
```

## Future Strapi Response Shape

When Strapi integration starts, the login/session response should eventually
look like this:

```ts
{
  user: {
    id: "user-1",
    name: "Dr. Musa",
    email: "musa@example.com",
    domain: "staff",
    collegeId: "college-1"
  },
  role: {
    id: "role-1",
    name: "Department Coordinator",
    tenantScope: "college",
    scopeType: "department"
  },
  permissions: ["courses.view", "results.upload", "results.approve"],
  assignments: [
    {
      scopeType: "department",
      collegeId: "college-1",
      departmentId: "computer-science"
    }
  ]
}
```

The frontend should not need role-name checks. It should render from
`permissions` and validate scope through `assignments`.

## Phase 1 Files

```text
lib/rbac/types.ts
lib/rbac/permissions.ts
lib/rbac/menus.ts
lib/rbac/actions.ts
lib/rbac/guards.ts
lib/rbac/scopes.ts
lib/rbac/index.ts
features/dashboard/components/RoleDashboardShell.tsx
```

