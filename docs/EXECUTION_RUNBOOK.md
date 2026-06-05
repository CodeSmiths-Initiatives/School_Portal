# IUMS Execution Runbook

This runbook is the repeatable working flow for local development, API
verification, database checks, and the admission/payment execution plan. Use it
at the start of every implementation or verification session so the same
sequence is followed consistently.

## Local Services

Run all commands from the repository root:

```powershell
cd H:\School_Portal
```

### 1. Backend: Strapi

Start Strapi in a separate background process and keep logs in `.codex/run-logs`:

```powershell
$logDir = Join-Path (Get-Location) ".codex\run-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$out = Join-Path $logDir "backend-dev.out.log"
$err = Join-Path $logDir "backend-dev.err.log"
Remove-Item -LiteralPath $out,$err -Force -ErrorAction SilentlyContinue
cmd /c start "" /b npm run backend:dev 1>"$out" 2>"$err"
```

Health check:

```powershell
Invoke-WebRequest -Uri http://localhost:1337/_health -UseBasicParsing
```

If Strapi does not start, inspect:

```powershell
Get-Content .codex\run-logs\backend-dev.out.log -Tail 160
Get-Content .codex\run-logs\backend-dev.err.log -Tail 160
```

Build check:

```powershell
npm run backend:build
```

### 2. Frontend: Next.js

Start Next.js in a separate background process and keep logs in `.codex/run-logs`:

```powershell
$logDir = Join-Path (Get-Location) ".codex\run-logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$out = Join-Path $logDir "frontend-dev.out.log"
$err = Join-Path $logDir "frontend-dev.err.log"
Remove-Item -LiteralPath $out,$err -Force -ErrorAction SilentlyContinue
cmd /c start "" /b npm run dev 1>"$out" 2>"$err"
```

Health check:

```powershell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing
```

If Next.js does not start, inspect:

```powershell
Get-Content .codex\run-logs\frontend-dev.out.log -Tail 160
Get-Content .codex\run-logs\frontend-dev.err.log -Tail 160
```

Production build check:

```powershell
& "C:\Users\Nitesh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "node_modules\next\dist\bin\next" build
```

## Environment Requirements

Frontend `.env.local` must include:

```text
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337
STRAPI_API_URL=http://localhost:1337
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=<public key only>
PAYSTACK_SECRET_KEY=<server-side secret key>
PAYSTACK_SUBACCOUNT_CODE=<subaccount code if used>
AUTH_SESSION_SECRET=<local secret>
```

`STRAPI_API_TOKEN` is required by the Next.js server process for protected
Strapi writes. Prefer passing it as a process environment variable when running
locally instead of committing it to `.env.local`.

Create a local full-access content API token when needed:

```powershell
Push-Location backend
& "C:\Program Files\nodejs\node.exe" -e "const { createStrapi } = require('@strapi/strapi'); (async()=>{ const app = await createStrapi({ distDir: './dist' }).load(); const token = await strapi.service('admin::api-token').create({ name: 'Local Codex Full Access ' + Date.now(), type: 'full-access', kind: 'content-api', lifespan: null }); console.log('createdLength=' + String(token.accessKey || '').length); await app.destroy(); })().catch((error)=>{ console.error(error); process.exit(1); });"
Pop-Location
```

Start the frontend with the latest local token without printing or committing
the token:

```powershell
$env:PGPASSWORD="<local postgres password>"
$encryptedKey = (& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -h 127.0.0.1 -p 5432 -U strapi_user -d skillzncert -t -A `
  -c "select encrypted_key from strapi_api_tokens where name like 'Local Codex Full Access%' order by id desc limit 1;").Trim()
$encryptionKey = (Get-Content backend\.env |
  Where-Object { $_ -like "ENCRYPTION_KEY=*" } |
  Select-Object -First 1).Substring("ENCRYPTION_KEY=".Length)
$env:STRAPI_API_TOKEN = (& "C:\Program Files\nodejs\node.exe" -e "const crypto=require('crypto'); const encrypted=process.argv[1]; const raw=process.argv[2]; const [version,ivHex,encryptedHex,tagHex]=encrypted.split(':'); const key=crypto.createHash('sha256').update(raw).digest(); const decipher=crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex,'hex')); decipher.setAuthTag(Buffer.from(tagHex,'hex')); let out=decipher.update(Buffer.from(encryptedHex,'hex'), undefined, 'utf8'); out+=decipher.final('utf8'); process.stdout.write(out);" $encryptedKey $encryptionKey)
npm run dev
```

Confirm token availability through the frontend diagnostic route:

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/system/strapi -UseBasicParsing
```

Expected:

```json
{
  "reachable": true,
  "status": 204,
  "message": "Strapi is reachable.",
  "authConfigured": true
}
```

Backend `backend/.env` must include:

```text
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=skillzncert
DATABASE_USERNAME=strapi_user
DATABASE_PASSWORD=<local password>
DATABASE_SSL=false
STRAPI_SEED_DEFAULT_DATA=true
FRONTEND_URL=http://localhost:3000
```

Do not commit real secrets. Keep production tokens in deployment environment
variables only.

## Database Verification

The local database is Postgres. Prefer direct SQL checks when validating
tenant-scoped persistence.

Common tables for the current admission/payment flow:

```text
colleges
admission_applications
payment_invoices
payment_transactions
payment_ledger_entries
```

Expected relationship after a successful tenant admission payment:

```text
college
  -> admission_application
       -> payment_invoice
       -> payment_transaction
       -> payment_ledger_entry
```

The same selected college must be reflected by relation and metadata:

```text
collegeId / college relation
collegeSlug in metadata
applicationNumber on application and payment metadata
payment reference across invoice, transaction, and ledger
```

Suggested SQL checks:

```sql
select id, document_id, name, slug, code, status
from colleges
order by name;

select id, document_id, application_number, applicant_email, status, payment_status, metadata
from admission_applications
order by created_at desc
limit 10;

select id, document_id, invoice_number, module, amount, status, payer_email, metadata
from payment_invoices
order by created_at desc
limit 10;

select id, document_id, reference, gateway, amount, status, gateway_status, metadata
from payment_transactions
order by created_at desc
limit 10;

select id, document_id, entry_number, entry_type, direction, amount, module, reference, metadata
from payment_ledger_entries
order by created_at desc
limit 10;
```

## API Verification

Use local API routes through Next.js. The frontend must keep Strapi and Paystack
secrets server-side.

Health:

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/system/strapi -UseBasicParsing
```

Create tenant admission application:

```powershell
$body = @{
  collegeSlug = "kwara-applied-sciences"
  account = @{
    username = "Test Applicant"
    email = "test.applicant@example.com"
  }
  programme = @{
    programmeType = "undergraduate"
    facultyId = "science::computer-science"
    entrySession = "2026/2027"
  }
} | ConvertTo-Json -Depth 8

Invoke-WebRequest `
  -Uri http://localhost:3000/api/admissions/applications `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

Initialize payment:

```powershell
$body = @{
  email = "test.applicant@example.com"
  username = "Test Applicant"
  method = "card"
  module = "admission"
  collegeSlug = "kwara-applied-sciences"
  applicationId = "<application document id>"
  applicationNumber = "<application number>"
} | ConvertTo-Json -Depth 8

Invoke-WebRequest `
  -Uri http://localhost:3000/api/payments/initialize `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -UseBasicParsing
```

## Browser Verification Routes

Tenant admission entry:

```text
http://localhost:3000/apply
http://localhost:3000/college/kwara-applied-sciences/apply
```

Dashboards:

```text
http://localhost:3000/superadmin/dashboard
http://localhost:3000/college/kwara-applied-sciences/admin/dashboard
http://localhost:3000/college/kwara-applied-sciences/staff/dashboard
http://localhost:3000/college/kwara-applied-sciences/student/dashboard
```

Shared college modules:

```text
http://localhost:3000/college/kwara-applied-sciences/modules/courses
http://localhost:3000/college/kwara-applied-sciences/modules/results
http://localhost:3000/college/kwara-applied-sciences/modules/hostel
http://localhost:3000/college/kwara-applied-sciences/modules/payments
```

Student-only admission/profile:

```text
http://localhost:3000/college/kwara-applied-sciences/student/admission
http://localhost:3000/college/kwara-applied-sciences/student/profile
```

## Current Execution Plan

Follow this order for the next work block.

### Phase A: Verify New Admission Flow

1. Start backend.
2. Start frontend.
3. Open `/apply`.
4. Select a real Strapi-backed college.
5. Complete account step.
6. Complete programme step.
7. Confirm the application record is created before payment.
8. Confirm payment screen displays college and application number.
9. Clean up UI or flow issues before moving on.

### Phase B: Verify Strapi/Postgres Data

1. Check `admission_applications` after programme continue.
2. Initialize payment and check `payment_invoices`.
3. Check `payment_transactions`.
4. Check `payment_ledger_entries`.
5. Verify all records link to the selected college and application.
6. Clean up persistence or schema issues before moving on.

### Phase C: Resumable Application Lookup and Listing

Goal: every long-form continue action must save progress, so applicants can
resume instead of restarting.

Build:

```text
student: own application/resume state
college admin/staff: college-scoped application listing
superadmin: all-college overview later
```

Required behavior:

```text
application status: draft, payment_pending, submitted, under_review, approved, rejected
step progress: account, programme, payment, biodata, contact, o-level, declaration
last saved timestamp
collegeId + collegeSlug retained on every save
```

Cleanup after this phase:

```text
remove duplicate non-tenant paths if unused
keep tenant APIs server-side
verify TypeScript/build
```

### Phase D: Payment Management

Build:

```text
student: own invoices, transactions, receipts
college admin/staff: college-scoped payment list, filters, invoice detail, print
superadmin: cross-college reporting later
```

Security and audit requirements:

```text
Paystack secret key remains server-side
invoice and transaction IDs are not trusted from browser without server validation
reference uniqueness is enforced
payment verification checks amount, currency, reference, gateway status
ledger entries are append-style
manual actions must create audit records
```

Cleanup after this phase:

```text
verify tenant scoping
verify responsive UI
verify build
check redundant files and unused imports
```

## Stop/Restart Helpers

Find local Node/Strapi processes:

```powershell
Get-Process node -ErrorAction SilentlyContinue
```

Prefer closing only the process that owns the relevant port. Check port owners:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :1337
```

Stop a specific process only after confirming the PID:

```powershell
Stop-Process -Id <PID> -Force
```

## Completion Checklist

Before handing work back:

```text
Next build passed
Strapi build passed
UI flow tested
DB records verified
tenant scope verified
payment linkage verified
cleanup completed
git diff reviewed
```
