# Multi-Tenant Backend Collections

## Purpose

This document explains how the Strapi backend is structured for the school
portal, why each collection exists, and how users, colleges, roles,
permissions, admissions, and payments connect.

The key principle is:

```text
One platform -> many colleges -> many users -> scoped role assignments
```

## Role Model

The platform should have only three global/static role templates:

```text
platform-superadmin
platform-college-admin
platform-student
```

These are system roles. They should not be duplicated per college.

Correct examples:

```text
student1.kas@iums.test -> platform-student -> Kwara Applied Sciences
student1.kat@iums.test -> platform-student -> Kwara Agriculture and Technology
admin.kas@iums.test    -> platform-college-admin -> Kwara Applied Sciences
admin.kat@iums.test    -> platform-college-admin -> Kwara Agriculture and Technology
superadmin@iums.test   -> platform-superadmin -> platform
```

College-created roles are different. They are custom roles scoped to one
college.

Correct custom examples:

```text
kas-hod
kas-clerk
kas-cashier
kat-hod
kat-clerk
kat-cashier
```

So yes: Student, College Admin, and Superadmin are static global role templates.
HOD, Clerk, Cashier, Teacher, Lab Technician, and similar roles are dynamic
college roles.

## Important Current Data Note

If the Strapi Portal Roles screen shows roles such as `mgm-student`,
`kdc785-student`, or old per-college student/admin roles, those are legacy/demo
or early-test records. They are not the final target model.

The final model should keep:

```text
platform-superadmin
platform-college-admin
platform-student
college custom roles only, such as kas-hod or kat-cashier
```

The user assignment table is what makes a student belong to a college. We do
not need a separate student role for each college.

## Collection Map

### users-permissions User

Strapi built-in collection:

```text
plugin::users-permissions.user
```

Purpose:

- Stores login identity.
- Holds username, email, password hash, confirmed/blocked status.
- Returns JWT from `/api/auth/local`.
- Does not by itself decide portal permissions.

Connected to:

- `role-assignment` for application role and tenant scope.
- `admission-application` as applicant.
- payment collections as payer.
- `audit-log` as actor.

### College

Strapi collection:

```text
api::college.college
```

Purpose:

- Tenant boundary.
- Every student/admin/staff user must be scoped to one college, except
  superadmin.
- Apply page should show only active colleges.
- If a college is inactive, users under that college should not be able to use
  the platform.

Important fields:

```text
name
slug
code
status
contactEmail
metadata
```

Connected to:

- faculties
- departments
- courses
- college custom roles
- admission applications
- payment invoices, transactions, ledger entries
- audit logs

### Portal Role

Strapi collection:

```text
api::portal-role.portal-role
```

Purpose:

- Application role template.
- Holds permission list.
- Can be global/system or college/custom.

Important fields:

```text
name
code
roleType: system | custom
tenantScope: platform | college
scopeType: platform | college | faculty | department | course | self
college
permissions
```

Correct usage:

- `platform-superadmin`: system, platform scope.
- `platform-college-admin`: system, college scope.
- `platform-student`: system, college/self scope.
- `kas-hod`: custom, college role owned by KAS.

### Role Assignment

Strapi collection:

```text
api::role-assignment.role-assignment
```

Purpose:

- Connects one user to one portal role under a specific scope.
- This is where college membership is enforced.

Important fields:

```text
user
role
college
faculty
department
course
scopeType
status
isPrimary
startsAt
endsAt
```

Examples:

```text
Student in KAS:
user = student1.kas
role = platform-student
college = Kwara Applied Sciences
scopeType = self

College admin in KAT:
user = admin.kat
role = platform-college-admin
college = Kwara Agriculture and Technology
scopeType = college

HOD in KAS:
user = hod.kas
role = kas-hod
college = Kwara Applied Sciences
department = Engineering
scopeType = department
```

### Permission

Strapi collection:

```text
api::permission.permission
```

Purpose:

- Stores permission keys in `module.action` format.
- Permissions drive side menus and button/action access.

Examples:

```text
students.view
students.export
courses.create
results.upload
payments.verify
roles.assign_permissions
```

### Menu Item

Strapi collection:

```text
api::menu-item.menu-item
```

Purpose:

- Permission-backed sidebar menu registry.
- Lets us hide or show menu items from permissions instead of hardcoding by
  role name.

Important fields:

```text
key
label
href
icon
order
domains
isActive
requiredPermissions
parent
children
```

Example:

```text
Courses menu requires courses.view.
Payments menu requires payments.view.
Roles menu requires roles.view.
```

### Admission Application

Strapi collection:

```text
api::admission-application.admission-application
```

Purpose:

- College-scoped student admission record.
- Created for signup/payment flow and later extended by the student profile
  admission form.
- Stores profile draft steps in `metadata.admissionProfile`.

Important fields:

```text
applicationNumber
applicantUsername
applicantEmail
programmeType
facultyKey
departmentKey
entrySession
status
paymentStatus
currentStep
completedSteps
lastSavedAt
submittedAt
metadata
college
applicant
```

Profile draft data currently lives in:

```text
metadata.admissionProfile.bioData
metadata.admissionProfile.contactData
metadata.admissionProfile.oLevelData
metadata.admissionProfile.programmeData
metadata.admissionProfile.declarationData
```

### Payment Invoice

Strapi collection:

```text
api::payment-invoice.payment-invoice
```

Purpose:

- Raised bill for admission, hostel, tuition, result, transcript, or another
  module.
- College-scoped.

Important fields:

```text
invoiceNumber
module
description
amount
currency
status
payerName
payerEmail
payerIdentifier
college
payer
admissionApplication
transactions
ledgerEntries
```

### Payment Transaction

Strapi collection:

```text
api::payment-transaction.payment-transaction
```

Purpose:

- Gateway attempt/verification record.
- Stores Paystack reference, status, channel, and gateway response metadata.

Important fields:

```text
reference
gateway
gatewayReference
channel
amount
currency
status
gatewayStatus
paidAt
verifiedAt
college
invoice
payer
admissionApplication
```

### Payment Ledger Entry

Strapi collection:

```text
api::payment-ledger-entry.payment-ledger-entry
```

Purpose:

- Append-style accounting movement.
- Used for charges, payments, refunds, waivers, adjustments, and reversals.

Important fields:

```text
entryNumber
entryType
direction
amount
currency
module
reference
postedAt
college
invoice
transaction
payer
admissionApplication
```

### Audit Log

Strapi collection:

```text
api::audit-log.audit-log
```

Purpose:

- Append-only operational history.
- Answers: who did what, when, under which college, and against which entity.

Important fields:

```text
action
eventType
actorName
actorEmail
actorRole
entityType
entityId
targetLabel
occurredAt
summary
metadata
actor
college
```

Scope rule:

- Superadmin sees platform-wide audit.
- College admin sees only their college.
- Staff sees only allowed college/module audit.
- Student sees only their own relevant audit trail.

### Faculty, Department, Course

Collections:

```text
api::faculty.faculty
api::department.department
api::course.course
```

Purpose:

- Academic structure inside one college tenant.
- Course and result modules should always filter by college first, then
  faculty/department/course as needed.

## Login and Permission Flow

```text
1. User logs in through Strapi users-permissions.
2. Strapi returns JWT.
3. Portal session endpoint finds the user's active primary role assignment.
4. Role assignment gives:
   - portal role
   - permissions
   - college scope
   - faculty/department/course scope if applicable
5. Frontend stores signed session cookie.
6. Dashboard routes and API routes enforce collegeId/collegeSlug from session.
```

## Why One Student Role Is Enough

Students across colleges have the same product-level capability set:

```text
view own dashboard
edit own admission profile
view own payments
view own hostel status
view own notices
```

The college changes their data scope, not their role definition.

Correct:

```text
platform-student + role assignment to College A
platform-student + role assignment to College B
```

Avoid:

```text
college-a-student
college-b-student
college-c-student
```

That duplicates permissions and becomes hard to maintain.

## Recommended Cleanup Rule

When cleaning old data, keep only:

```text
platform-superadmin
platform-college-admin
platform-student
custom college roles created by college admins, such as kas-hod or kat-cashier
```

Remove legacy per-college system student/admin role templates after all users
are reassigned to the platform roles.

## Query Performance Guidance

Every tenant-sensitive query should filter by college first:

```text
collegeId -> module filters -> date/status/search filters
```

Recommended indexed fields:

```text
colleges.slug
colleges.code
portal_roles.code
permissions.key
admission_applications.application_number
admission_applications.applicant_email
payment_invoices.invoice_number
payment_transactions.reference
payment_ledger_entries.entry_number
audit_logs.occurred_at
```

For high volume production, add composite indexes around frequent filters:

```text
(college_id, status)
(college_id, created_at)
(college_id, applicant_email)
(college_id, module, status)
```

