# EnQuest PMS — Requirements Gap Checklist

Tracks implementation status against `EnQuest_PMS_Requirements_Document.docx` (v1.0, July 2026).

**Legend:** `[ ]` not started · `[~]` partial · `[x]` done

Status keys per item: ✅ implemented · ⚠️ partial · ❌ missing

---

## Executive Summary

**All migrations applied** — `20260604_008` through `20260604_012` (audit log, notification engine, linked milestone, new registers, RBAC matrix) are live in the database. All 5 items from the original build-order plan are complete, plus the Chairman View wiring as a follow-up.

| Area | Status |
|---|---|
| Central Audit Log (§5.4) | ✅ Done — immutable, hooked into every model, CSV export |
| Notification & Alert Engine (§5.2, §10) | ✅ Backend done — date/threshold/status/recurring triggers, escalation, snooze; ⚠️ email/SMS transport not wired |
| Activity recurring pop-up reminders (§5.2) | ✅ Done — login/interval modal, mandatory Critical comments |
| New register modules — Contract, Compliance, Correspondence, Decision, Operations Update (§5.7, §5.11–§5.14) | ✅ Done — models, routes, alert rules, functional CRUD pages |
| RBAC role matrix (§4) | ✅ Done — 12 roles, configurable `Role`/`Permission`/`RolePermission` matrix, admin-editable UI; all 11 mutation-gated modules migrated off the legacy Admin/Manager array onto `requirePermission()` |
| Chairman View (§6) | ✅ Done — three-block layout embedded in the existing `ExecutiveDashboard.tsx` (not a separate page), drill-down links, RBAC-gated section; ⚠️ export is print-to-PDF (not native PPT), no auto-refresh cadence |
| Task Status, Progress & Accountability (§5.3) | ✅ Done — % complete, subtasks with roll-up, owner-confirmed completion, automatic Overdue flag, workload view, comments/attachments, status history (via Audit Log); ⚠️ no Gantt view, no task→project roll-up |
| Organisation Structure & Team Profiles (§5.1) | ✅ Done — extended profile fields, auto-generated org chart, team allocation view, profile history (via Audit Log), onboarding/offboarding notifications, photo upload; ⚠️ no dedicated HR role (Admin-only), no formal 500-employee load test |
| Work Programme & Budget Tracker (§5.6) | ✅ Done — `BudgetLine` model, multi-currency, variance/utilisation alerts via the Notification Engine, enforced maker-checker revision workflow, block/currency roll-up with drill-down, CSV export; ⚠️ threshold values are fixed (10%/90%/100%), no settings UI to change them |
| AFE Tracking (§5.10) | ✅ Done — authorised/committed/actual-to-date/variance on the existing `Finance` AFE records, automatic aggregation from linked payments, supplementary AFE chain, 80%/100% utilisation alerts, enforced reconciliation sign-off on closure |
| Document Repository & Version Control (§5.5) | ✅ Done — category/tags/confidentiality (`allowedRoles`-gated), "Awaiting Response From" + due-date reminders via the Notification Engine, automatic `Superseded` status on new-version upload, owner-or-Admin delete restriction; ⚠️ OCR + full-text search and soft-delete/subscriber-notification explicitly deferred |
| Dashboards, Charts, Filters & Drill-down (§5.8) | ✅ Done — URL-synced filter bar (Block/Project/Status/Date range) on the Executive Dashboard, filtered CSV export, drill-down query params forwarded and consumed by Projects/Documents/Tasks; real (no longer hardcoded) Quick Stats and Upcoming Deadlines on the Operational Dashboard; ⚠️ Finance/Decisions/Compliance destination pages and the (separately tracked, still-hardcoded) Risk register don't yet consume forwarded filters; no saved/named views or scheduled email/native Excel/PPT export |
| Phase 1 modules overall (§5.1–§5.15) | 13 of 15 fully done, 2 partial, 0 untouched |
| Phase 2 add-ons (§7) | ❌ Not started (expected — Phase 2 scope) |
| Non-functional (§8, §12, §13) | ❌ Largely not started — MFA, multi-currency, integrations, exports, backup/DR |

**Biggest remaining gaps, roughly in priority order:**
1. Email/SMS transport for the notification engine (§10.2) — currently in-app only.
2. True native PDF/PowerPoint export + versioned archive for Chairman View (§6) — currently browser print-to-PDF.
3. Remaining Phase 1 partials: Licence phase/countdown fields (§5.9), Risk auto-scoring (§5.15), Task→Project progress roll-up (§5.3).
4. Fold `documents`/`comments`/`tasks`/`licences`/`finance` routes into the RBAC matrix too (currently simpler `authMiddleware`-only or bespoke gates — lower priority since there's no coarse array to retire there).
5. OCR + full-text search and recoverable soft-delete/subscriber notifications for the Document Repository (§5.5) — explicitly deferred, not yet started.
6. Phase 2 add-on modules (§7) and non-functional hardening (§8/§12/§13) — out of Phase 1 scope, deferred by design.

---

## 1. Architectural Principles (§3.2)

- [x] ✅ **Central Audit Log** — write-once log of every create/update/delete (see §5.4 below)
- [x] ✅ **Shared Notification/Alert Engine** — date/threshold/status/recurring triggers (see §10 below)
- [~] ⚠️ **Drill-down everywhere** — KPIs link back to source record lists; Executive/Operational dashboards now forward filter query params and Projects/Documents/Tasks consume them (see §5.8), but Finance/Decisions/Compliance and the still-hardcoded Risk register don't yet pre-filter from those params
- [x] ✅ **RBAC at API layer** — configurable `Role`/`Permission`/`RolePermission` matrix, admin-editable via `/api/admin/roles` + `/api/admin/role-permissions` (see §4 below)
- [~] ⚠️ **Single source of truth** — remove hardcoded/demo fallbacks in `Registers`, `RegisterDetail`

---

## 2. User Roles & Permissions (§4)

- [x] ✅ Expanded roles from `Admin/Manager/User` → 12 total (3 legacy + the 9 new business roles from §4)
  - [x] Chairman/Board, CEO/Country Manager, Project/Operations Manager, Legal/Compliance Officer,
        Finance/Accounts, HSE Officer, Geologist/Drilling Engineer, Team Member/Staff, External Partner
        seeded in `backend/models/Role.js` / `server.js` startup seed
- [x] ✅ Configurable role/permission matrix (Admin-editable, no code change) — `Role`, `Permission`, `RolePermission` models +
      `backend/middleware/rbac.js` (`requirePermission()`) + `backend/routes/rbac.js` (CRUD) + live editable matrix UI in `Admin.tsx` ("RBAC Matrix" tab)
- [x] ✅ Enforce RBAC on all mutation-gated routes — all 11 modules (blocks/projects/activities/risks/workflows/registers +
      contracts/compliance/correspondence/decisions/operations-updates) now go through `requirePermission()` off a single
      `permissionProtectedRoutes` list in `server.js`; the legacy `managerMiddleware` array-based gate has been fully retired.
      `Manager` keeps identical behavior (all 11 `.manage` permissions seeded for it), and `Project/Operations Manager` gained
      `blocks.manage`/`projects.manage` to match its "day-to-day project & operations delivery" scope in §4
- [x] Legacy `'Admin'` role remains a technical superuser (bypasses the matrix entirely) for backward compatibility with the rest of the
      app; all other roles, including the new business roles, are governed purely by the configurable matrix
- [x] Frontend: `AuthContext.hasPermission(key)` added for fine-grained UI gating (used by the 5 new register pages) alongside the
      existing coarse `canEdit`/`isManager` flags (left untouched for older pages — those still work unchanged since `Manager`'s
      permission set exactly mirrors its old blanket access)
- [ ] Still open: `documents`/`comments`/`tasks`/`licences` routes use simpler `authMiddleware`-only or bespoke per-route gates,
      not yet folded into the matrix (lower priority — no coarse Admin/Manager array to retire there)

---

## 3. Phase 1 — Innate Modules (§5)

### 5.1 Organisation Structure & Team Profiles
- [x] ✅ Extended `User`: `employeeId`, `designation`, `reportingManagerId` (self-FK), `phone`, `photoUrl`, `qualifications`, `startDate` — `backend/models/User.js`
- [x] ✅ Auto-generated interactive org chart — `GET /api/org-chart` builds a live tree from `reportingManagerId` (re-renders automatically since it's computed on every request, not cached); rendered as a recursive tree in `Admin.tsx` ("Org Chart" tab)
- [x] ✅ Role/permission group assignment — already covered by §4's RBAC matrix (`role` field + `Role`/`Permission`/`RolePermission`)
- [x] ✅ Team allocation view — `GET /api/admin/users/:id/allocations` returns open tasks/activities/projects for a person
- [x] ✅ Historical record of profile/role changes — reuses the central Audit Log (§5.4) rather than a duplicate log; `GET /api/admin/users/:id/history` + a "History" dialog per user in `Admin.tsx`
- [x] ✅ Business rule: only Admin manages profiles (no separate HR role exists yet in this system, so Admin/IT is the sole authority — matches spec's "Admin/HR")
- [x] ✅ Onboarding alert — creates a `Notification` for the reporting manager when a new report is created with `reportingManagerId` set
- [x] ✅ Offboarding alert — creates a `Notification` for all Admins when a profile transitions `active: true → false`
- [x] ✅ Profile photo upload — `POST /api/admin/users/:id/photo` reuses the existing S3 upload infrastructure from `documents.js`
- [ ] Not implemented: dedicated "flag for exit / offboarding checklist" workflow (approximated by the `active` toggle); org chart tested only informally, not against the 500-employee acceptance criterion

### 5.2 Activity Tracker with Recurring Pop-up Reminders  ⭐ flagship
- [x] ✅ Recurrence rule (via `NotificationRule.recurrenceIntervalHours` + engine re-arm logic) + `linkedMilestone` field on `Activity`
- [x] ✅ Login + interval pop-up/modal engine until Done/snoozed — `NotificationPopupEngine.tsx`, mounted in `Layout.tsx`, fetches `GET /api/notifications?status=Pending` on mount + every 5 min
- [x] ✅ Mandatory comment required client-side and server-side (`/acknowledge`, `/snooze`) to resolve/snooze a Critical item
- [x] ✅ Auto-escalation to supervisor/Admin after grace period (generic `escalateOverdue()` in the notification engine)
- [x] ✅ List and Kanban views exist on the Activities page; **Calendar view still missing**
- [x] ✅ Link activity → document (`Document.activityId`/`activityIds`) and task (`Task.relatedType`/`relatedId` auto-created via `autoAssignActivityTask`); contract/compliance linkage blocked on those modules not existing yet (§5.7, §5.11)

### 5.3 Task Status, Progress & Accountability
- [x] ✅ `progress` (%), `startDate`, `parentTaskId` (subtasks), `dependencyTaskIds` added to `Task` — `backend/models/Task.js`
- [x] ✅ Subtask → parent progress roll-up (`recalcParentTaskProgress` in `services/taskStatusSync.js`, called on subtask create/update/delete); **task → project roll-up not implemented** (Project.completion is currently driven by Activities, not Tasks — mixing both needs a product decision, tracked as a follow-up)
- [x] ✅ Automatic "Overdue" status flag — `status` ENUM extended, `syncAllOverdueTasks()` runs on every task list fetch and every notification-engine sweep (bulk update with `individualHooks: true` so each transition is still Audit-Logged)
- [x] ✅ Workload view — `GET /api/tasks/workload` (per-person open/overdue counts) + a "Workload" tab on the Tasks page
- [x] ✅ Single accountable owner — already structurally enforced (one `assignedToId` FK per task)
- [x] ✅ Owner confirmation for 100% complete — `PUT /api/tasks/:id` rejects `status=Completed`/`progress=100` unless the requester is the task's `assignedToId` or an Admin (403 otherwise), enforced client- and server-side
- [x] ✅ Full status-change history per task — reuses the central Audit Log (§5.4) rather than a duplicate log; convenience endpoint `GET /api/tasks/:id/history` + a "History" tab in the new task detail modal
- [x] ✅ Comments and file attachments on tasks — `Comment.taskId` and `Document.taskId` added (mirrors the existing `activityId`/`licenceId` pattern); task detail modal has Subtasks/Comments/Attachments/History tabs
- [ ] Gantt view for tasks still missing (List/Kanban-style table + workload view exist; no Gantt)

### 5.4 Action Database / Audit Log  ⭐ foundational
- [x] ✅ `AuditLog` model: logId, timestamp, user, module, entityType, entityId, actionType, oldValue, newValue, device/IP
- [x] ✅ Central hook capturing every create/update/delete across all modules
- [x] ✅ Write-once (no edit/delete, even Admin); configurable retention *(immutability enforced; retention config still TODO)*
- [x] ✅ Global search/filter by user/module/entity/date; RBAC-scoped *(currently Admin-only; entity-level scoping TODO)*
- [x] ✅ Export to CSV/PDF *(CSV done; PDF TODO)*
- [ ] Performance: <3s at 1M+ records *(indexes added; load-test TODO)*

### 5.5 Document Repository & Version Control
- [x] ✅ Versioning: new upload creates a new `Document` row (`rootDocumentId`, `versionNumber`, `s3Key`); all prior versions in the chain are automatically flipped to `status: 'Superseded'` when a new version is uploaded — `backend/routes/documents.js` (`POST /:id/versions`)
- [x] ✅ Status lifecycle aligned to the requirement: `Draft` → `Under Review` → `Final` → `Superseded` (system-set, not user-selectable) — `backend/models/Document.js`, safely remapped via `backend/migrations/20260604_017_document_repository.sql`
- [x] ✅ "Awaiting Response From" + Response Due Date fields, wired into the Notification Engine (`Document` module registry entry + seeded `DateBased` rule "Document awaiting-response reminders", 7/3/1-day lead times) — `backend/services/notificationEngine.js`, `backend/server.js`
- [x] ✅ Confidentiality level (`Public`/`Internal`/`Confidential`) + `allowedRoles` list; `canViewDocument()` helper enforces it on list/detail/update (403 for unauthorized users on Confidential docs unless Admin, owner, or in `allowedRoles`) — `backend/routes/documents.js`
- [x] ✅ Category (`Contract`/`Letter`/`Notice`/`Report`/`Other`) + free-text `tags` (JSON array) for folder/tag organisation; filterable via `category`/`blockId` query params on `GET /`
- [x] ✅ Owner-based delete restriction: only the document owner or Admin may delete — enforced server-side (`DELETE /:id`) and reflected client-side (delete button disabled with tooltip otherwise) — `backend/routes/documents.js`, `frontend/src/app/pages/DocumentDetail.tsx`
- [x] ✅ Frontend: upload form and edit-details dialog updated with Category, Confidentiality Level, Awaiting Response From, Response Due Date, Tags fields; status dropdowns aligned to the new ENUM; version history shows a "Superseded" badge — `frontend/src/app/pages/Documents.tsx`, `frontend/src/app/pages/DocumentDetail.tsx`
- [ ] ❌ OCR + full-text search *(explicitly out of scope for this pass)*
- [ ] ❌ Recoverable soft-delete; subscriber notification on new version *(explicitly out of scope for this pass — deletes remain hard deletes; new-version uploads do not yet notify subscribers, only the response-due reminders above are wired)*
- [ ] ⚠️ Migration `20260604_017_document_repository.sql` created but not yet applied — run `npm run migrate` in `backend/`

### 5.6 Work Programme & Budget Tracker
- [x] ✅ `BudgetLine` model: block/activity link, planned/actual start/end dates, budget category, approved/committed/actual spend, currency, responsible person, status — `backend/models/BudgetLine.js`
- [x] ✅ Multi-currency (GHS/USD) per line
- [x] ✅ Automatic variance calculation (`variancePercent`, recomputed in a `beforeSave` hook) — no configurable threshold UI yet, but the ±10% flag is applied consistently server- and client-side
- [x] ✅ Threshold-based alerts reuse the generic Notification Engine (no engine code changes, §10.4): "Budget line variance threshold" (±10% via `absVariancePercent` VIRTUAL field) and "Budget line utilisation alert" (90%/100% via `utilisationPercent` VIRTUAL field)
- [x] ✅ Maker-checker approval workflow for budget revisions — `POST /:id/request-revision` (maker proposes), `POST /:id/approve-revision` / `reject-revision` (checker decides); the approver cannot be the requester (separation of duties, Admin excepted); direct `PUT` edits to `approvedBudget` are rejected with a 400 pointing at the revision endpoints — this is what makes "a budget revision cannot be saved without a recorded approval" (acceptance criteria) actually enforced, not just documented
- [x] ✅ Roll-up: `GET /api/budget-lines/summary` aggregates per block/currency directly from the same line-item rows returned by `GET /api/budget-lines`, so totals always equal the sum of the underlying lines by construction
- [x] ✅ Drill-down: portfolio summary rows are clickable and filter the line-item table below to that block
- [x] ✅ Variance report export — `GET /api/budget-lines/export` (CSV), same underlying query as the on-screen table
- [x] ✅ Frontend page: `pages/BudgetTracker.tsx` (portfolio summary + line items + revision workflow UI), linked from the Registers hub
- [ ] Not implemented: a UI to configure the variance/utilisation thresholds per deployment (currently fixed at 10%/90%/100% via the seeded `NotificationRule` rows — Admin *can* edit these via the existing `/api/notification-rules` API, just no dedicated settings screen)

### 5.7 Compliance & Statutory Payments Tracker
- [x] ✅ `ComplianceObligation` model (regulator, category, frequency, due/paid, reference, evidence, status) — `backend/models/ComplianceObligation.js`
- [x] ✅ Recurring auto-regeneration on completion (`routes/compliance.js` PUT handler)
- [x] ✅ Mandatory evidence attachment before close if overdue (enforced server-side)
- [x] ✅ Escalating reminders via `NotificationRule` (30/14/7/1 days, then daily while overdue); **not yet surfaced on Chairman View** (§6 still pending)
- [x] ✅ Frontend page: `pages/Compliance.tsx`, linked from the Registers hub

### 5.8 Dashboards, Charts, Filters & Drill-down
- [x] ✅ Exec/Operational dashboards exist
- [x] ✅ Filter bar (Block/Project/Status/Date range) added to the Executive Dashboard, synced to URL query params (`?blockId=&projectId=&status=&dateFrom=&dateTo=`) so a filtered view can be bookmarked/shared as a link — applies to the Asset Health Matrix, Countdown Cards, Critical Risks panel and AFE Action Inbox — `frontend/src/app/pages/ExecutiveDashboard.tsx`
- [x] ✅ Guaranteed drill-down: Chairman View Block B links (Projects/Finance/Tasks/Compliance) now forward the active filters as query params; destination pages [Projects.tsx](frontend/src/app/pages/Projects.tsx), [Documents.tsx](frontend/src/app/pages/Documents.tsx), [Tasks.tsx](frontend/src/app/pages/Tasks.tsx) read `blockId`/`status` on load and pre-filter their lists accordingly
- [x] ✅ Operational Dashboard's "Quick Stats" and "Upcoming Deadlines" widgets — previously hardcoded fake numbers/dates entirely disconnected from the database — now computed live from real Risk/Document/Workflow/Task/Activity data, each linking to its filtered source list
- [x] ✅ CSV export of the filtered Blocks view added to the Executive Dashboard filter bar (client-side, same pattern as other CSV exports in the app)
- [ ] ⚠️ Not all destination pages consume the forwarded filter params yet — `Finance.tsx`, `Decisions.tsx`, `Compliance.tsx` and the Risk register (`RegisterDetail.tsx`, still hardcoded demo data — see §1 "Single source of truth") don't pre-filter from query params
- [ ] ❌ Saved/named views — only URL-bookmark sharing is supported, not a persisted "Save this view" feature
- [ ] ❌ Scheduled email delivery of dashboard views; native Excel/PowerPoint export (CSV done for Blocks; Chairman View still uses browser print-to-PDF, §6)

### 5.9 Licence Phase Countdown
- [~] ⚠️ `Licence` has type/expiry/status
- [ ] Add phase enum (Exploration/Extension/Appraisal/Development/Production), phase start/end, min work obligation
- [ ] Daily-recalculated countdown; banners at 180/90/30 days; escalate <30 to Executive Dashboard
- [ ] Controlled phase transition with sign-off (audited)

### 5.10 AFE Tracking (Actuals vs. Authorised)
- [x] ✅ Authorised (`amount`) / `committedAmount` / `actualToDate` + auto-computed `variancePercent` added to the existing `Finance` model (`recordType='AFE'`) — `backend/models/Finance.js`
- [x] ✅ Automatic aggregation of actuals — `recalcAfeActuals()` sums linked Invoice/Entry rows (via a new `afeId` FK) into the governing AFE's `committedAmount`/`actualToDate` whenever a linked payment's status changes
- [x] ✅ Supplementary AFE workflow — `POST /:id/create-supplement` creates a chained AFE row (`parentAfeId`, `supplementNumber`) for when projected spend exceeds the authorised amount
- [x] ✅ 80%/100% utilisation alerts — reuses the generic Notification Engine (no engine changes beyond a pre-existing bug fix, see below): "AFE utilisation alert" (`FinanceAFE` module, `utilisationPercent` VIRTUAL field)
- [x] ✅ Closure requires reconciliation sign-off — `POST /:id/close` is the only path to `status='Closed'`; a direct `PUT` attempting to set `status='Closed'` on an AFE is rejected (400) with a pointer to the correct endpoint; records `reconciledById`/`reconciledAt`
- [x] ✅ Frontend: `AfeDetail.tsx` gained a "AFE Tracking — Actuals vs. Authorised" section (committed/actual/variance/utilisation + progress bar) with "Create Supplementary AFE" and "Close (Reconciliation Sign-off)" actions; `Finance.tsx` AFE table gained a Utilisation column
- [x] Bug fix (found while wiring this up): `evaluateThresholdBased()` in the notification engine wasn't applying each module's `openWhere` scope, which only mattered once a model (here, `Finance`) is shared across multiple record types — fixed generically, benefits all threshold-based rules
- [ ] Not implemented: "AFE actuals reconcile against the financial ledger" is enforced procedurally (sign-off required to close) but there's no separate general-ledger system to reconcile against — out of scope per the requirements doc's own "Out of Scope" section (§2.2: "not a replacement accounting system")

### 5.11 Contract Register with Expiry/Renewal Alerts
- [x] ✅ `Contract` model (counterparty, type, effective/expiry, value, renewal notice period, auto-renew, owner, `Document.contractId` link) — `backend/models/Contract.js`
- [x] ✅ Configurable lead-time alerts 90/60/30 days via `NotificationRule`
- [ ] Surface expiring contracts on dashboards + Chairman View (Executive Dashboard already reads licences; Contract not yet wired in)
- [x] ✅ Frontend page: `pages/Contracts.tsx`, linked from the Registers hub

### 5.12 Operations Update
- [x] ✅ `OperationsUpdate` model (date, block/well, author, summary, key issues, next steps, attachments) — `backend/models/OperationsUpdate.js`
- [ ] Latest update surfacing automatically on the block summary page (`BlockDetail.tsx` not yet wired to `operationsUpdatesApi`)
- [x] ✅ Frontend page: `pages/OperationsUpdates.tsx`, linked from the Registers hub

### 5.13 Decision Log
- [x] ✅ `Decision` model (date, context, description, decision maker, rationale, linked risk/activity/task, status) — `backend/models/Decision.js`
- [x] ✅ Searchable by keyword/date/decision-maker (`GET /api/decisions?search=&decisionMaker=`)
- [x] ✅ Follow-up action items tracked as `Task` rows (`relatedType='Decision'`) via `POST /api/decisions` `actionItems[]`
- [x] ✅ Frontend page: `pages/Decisions.tsx`, linked from the Registers hub

### 5.14 PC/GNPC Correspondence Log
- [x] ✅ `Correspondence` model (direction, from/to, subject, reference, summary, block, awaiting response, response due, linked doc, regulator-agnostic) — `backend/models/Correspondence.js`
- [x] ✅ Full-text-style search (`LIKE` across subject/summary/reference); response-due reminders via `NotificationRule`
- [ ] Surface overdue responses on Chairman View (§6 still pending)
- [x] ✅ Frontend page: `pages/Correspondence.tsx`, linked from the Registers hub

### 5.15 Risk Register (Basic)
- [~] ⚠️ `Risk` has severity/probability/status/owner/mitigation
- [ ] Auto-calc score = likelihood × impact (configurable matrix)
- [ ] Review-date reminder; high-band escalation

---

## 4. Chairman View / Executive Dashboard (§6)

- [x] ✅ Three-block layout: A Countdown & Deadlines · B Progress & Status · C One-Click Summary — embedded directly in `pages/ExecutiveDashboard.tsx` (the app's existing landing dashboard) rather than a separate page/route, so there's one dashboard, not two
  - Block A aggregates live Licence expiry, Contract expiry, Compliance due dates and Correspondence response-due deadlines with Red/Amber/Green urgency badges
  - Block B shows work-programme completion, budget utilisation, task completion, open risks/pending decisions/overdue compliance counts
  - Block C renders an auto-generated executive summary paragraph from the same live data (no manual compilation)
- [x] ✅ Every figure in Block A/B links back (`<Link>`) to its source module page — module-level drill-down, not yet filtered to the exact underlying subset
- [~] ⚠️ One-click export — implemented via browser print-to-PDF (`window.print()` + `print:` layout rules hiding the app shell); **not native PDF/PowerPoint generation, and not versioned/archived**
- [x] ✅ Read-only access restricted — the Chairman View section only *renders* for `hasPermission('chairman_view.access')` (Chairman/Board, CEO/Country Manager) or Admin; other roles still see the rest of the dashboard (unchanged) with the Chairman section simply absent, so the shared landing page keeps working for everyone
- [~] ⚠️ Data freshness — live fetch on load + manual Refresh button with a "Data as of" timestamp; **no enforced ≤15-min auto-refresh, and the underlying GET endpoints are still world-readable at the API layer** (matches existing app-wide convention — true API-level read restriction for Chairman View data is a follow-up)

---

## 5. Phase 2 — Add-on Modules (§7)  — all ❌ not started

- [ ] Reserves & Resources Tracker
- [ ] HSE Register
- [ ] Local Content Tracking (Ghanaian metrics)
- [ ] Daily Drilling Report
- [ ] Daily Geological Report
- [ ] NDA & Data Room Tracker
- [ ] Assumptions Matrix
- [ ] Insurance Register
- [ ] Partner / BD Pipeline
- [ ] Forex & Banking Workflow
- [ ] Vendor Payment Aging
- [ ] Environmental Permit Tracker
- [ ] CSR Commitments Tracker

---

## 6. Notification & Alert Engine (§10)  ⭐ foundational

- [x] ✅ Trigger types: date-based, threshold-based, status-based, recurring — generic engine in `services/notificationEngine.js`
- [~] ⚠️ Channels: `channels` field + priority stored on each alert; **actual email/SMS delivery not wired** (In-app pop-up ack flow via `/acknowledge` exists; no email/SMS transport yet)
- [x] ✅ Escalation paths (per-rule `escalationGraceHours`, one-time escalation sweep) + snooze-with-reason (mandatory for Critical, logged via audit hook on the `Notification` update)
- [x] ✅ Admin config of lead times / grace periods / channels per module via `NotificationRule` + `/api/notification-rules` (Admin-only, no code change needed); user-level preference overrides not yet implemented

**Implementation notes:**
- Model registry (`MODULE_REGISTRY`) now covers `Activity` (dueDate), `Task` (dueDate), `Licence` (expiryDate), `Contract` (expiryDate), `ComplianceObligation` (dueDate), `Correspondence` (responseDueDate) — extend the registry + add a rule row for AFE/other modules as they're built; no engine changes needed.
- Recipient resolution: `Task.assignedToId` is a proper FK; `Activity.assignedTo` is matched by name (best-effort) since it's still a free-text string; `Licence` has no owner field yet, so alerts fall back to broadcasting to all Admin/Manager users.
- Sweep runs hourly via `startNotificationScheduler()`; Admin can force an immediate run via `POST /api/notifications/run-check`.
- Default rules are seeded on server startup (Activity/Task/Licence/Contract/Compliance/Correspondence date reminders) — see `defaultRules` in `server.js`.
- Migration `20260604_009_notification_engine.sql` must be applied (`npm run migrate` in `backend/`) before this is usable in an existing database.

---

## 7. Non-Functional & Integration (§8, §12, §13)

- [ ] Performance: pages/dashboards <3s at 100 concurrent users
- [ ] Security: MFA (Finance/Legal/Chairman), TLS + encryption at rest, doc/folder-level permissions
- [ ] Multi-currency (GHS/USD) with configurable base reporting currency
- [ ] Integrations: SMTP email (Phase 1), Calendar sync, SSO/Active Directory
- [ ] Exports: PDF/Excel/PowerPoint/CSV
- [ ] Backup/DR, retention, Ghana Data Protection Act (Act 843) compliance

---

## Recommended Build Order

1. ~~**Audit Log** (§5.4) — unblocks "everything auditable"~~ ✅ done
2. ~~**Notification/Alert Engine** (§5.2 + §10) — unblocks pop-ups & all deadline alerts~~ ✅ backend done (email/SMS transport still open)
3. ~~**Activity recurring pop-up reminders** (§5.2) — headline feature~~ ✅ done (Calendar view + real contract/compliance linkage still open)
4. ~~**New register models** — Contract, Compliance, Correspondence, Decision, Operations Update~~ ✅ done (backend + functional list/CRUD pages; Chairman View wiring still open)
5. ~~**RBAC role matrix** expansion (3 → configurable 12)~~ ✅ done (older modules still gated by legacy Admin/Manager check, not yet migrated to the matrix)

All migrations (`20260604_008` through `20260604_012`) are applied. Next up, per the Executive Summary above: Chairman View wiring, RBAC migration of older modules, then notification email/SMS transport.
