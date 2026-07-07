# EnQuest PMS — Phase 2 Add-on Modules: Development Plan & Architecture

**Status:** Planning (not started)
**Scope:** Architecture and build plan for 11 of the Phase 2 add-on modules (§7 of `EnQuest_PMS_Requirements_Document.docx`).
**Author:** Engineering
**Last updated:** 2026-07-05

> This document is the implementation blueprint for the following Phase 2 modules:
> Reserves & Resources Tracker · HSE Register · Local Content Tracking (Ghanaian metrics) ·
> NDA & Data Room Tracker · Assumptions Matrix · Insurance Register · Partner / BD Pipeline ·
> Forex & Banking Workflow · Vendor Payment Aging · Environmental Permit Tracker · CSR Commitments Tracker.
>
> The Daily Drilling Report and Daily Geological Report (also Phase 2) are intentionally **out of scope for
> this plan** — they are high-frequency operational-reporting modules with a different data-entry cadence and
> are tracked separately.

---

## 1. Guiding Principles

Phase 1 deliberately built **generic, reusable infrastructure** so that most new modules require *no changes to
the engines themselves* — only a model, a route, a migration, an RBAC permission row, an (optional) notification
rule, and a frontend page/service. Phase 2 must honour the same discipline.

The six architectural pillars every Phase 2 module plugs into (all already built and live):

| Pillar | Where it lives | How a new module uses it |
|---|---|---|
| **Central Audit Log** (§5.4) | `backend/models/AuditLog.js` + global model hook | Automatic — any Sequelize model's create/update/delete is logged with no per-module code. |
| **Notification & Alert Engine** (§10) | `backend/services/notificationEngine.js` (`MODULE_REGISTRY`) + `NotificationRule` rows | Add one `MODULE_REGISTRY` entry + seed one or more `defaultRules` rows in `server.js`. No engine code changes. |
| **RBAC matrix** (§4) | `backend/middleware/rbac.js` (`requirePermission()`) + `permissionProtectedRoutes` in `server.js` | Add a `*.manage` permission to `permissionSeeds`, wire it into `defaultMatrix`, add a `permissionProtectedRoutes` entry. |
| **Dashboards / drill-down** (§5.8) | `ExecutiveDashboard.tsx` / `OperationalDashboard.tsx` + URL-synced filter params | Expose data via an API service; add a widget that reads `blockId`/`status` query params. |
| **Document linkage** (§5.5) | `Document` model already supports `activityId`, `contractId`, `taskId`, `licenceId` FKs | Add a nullable FK column to `documents` per module that needs evidence/attachments. |
| **Single source of truth** (§3.2) | Real API + DB, no hardcoded demo fallbacks | Every list/detail page fetches live data from the module's route. |

**Non-negotiable conventions (established in Phase 1):**

- **Models** — Sequelize `define()`, explicit `tableName` (snake/plural), `timestamps: true`, ENUMs for status,
  nullable FKs with `references`, and `VIRTUAL` getters for any derived value the Notification Engine must
  threshold on (mirrors `Finance.utilisationPercent` / `Risk.riskScore`).
- **Migrations** — `backend/migrations/YYYYMMDD_NNN_description.sql`, `CREATE TABLE IF NOT EXISTS`, and
  `information_schema`-guarded `ALTER`s so every migration is idempotent. Applied via `npm run migrate`.
- **Routes** — thin Express routers under `backend/routes/`, `GET /` (filterable by query params like
  `blockId`/`status`), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`; mutations gated by the RBAC matrix.
- **Frontend** — a typed service object in `frontend/src/services/api.ts`, a page under
  `frontend/src/app/pages/`, a route in `routes.tsx`, a Registers-hub tile (and/or a sidebar entry in
  `Layout.tsx`), and `useAuth().hasPermission('<key>.manage')` for edit-gating.

---

## 2. Shared Build Template (per module)

Every module below is described against this **8-step checklist**. Steps 1–4 are backend, 5 is cross-cutting,
6–8 are frontend.

1. **Migration** — `backend/migrations/20260604_0NN_<module>.sql` (create table[s] + any `documents` FK).
2. **Model** — `backend/models/<Model>.js` (+ `require()` + associations in `server.js`).
3. **Route** — `backend/routes/<module>.js` (CRUD + filters + any module-specific action endpoints).
4. **RBAC** — add `<key>.manage` to `permissionSeeds`, map into `defaultMatrix`, add to `permissionProtectedRoutes`, mount `app.use()`.
5. **Notifications** — add a `MODULE_REGISTRY` entry (if it has deadlines/thresholds) + seed `NotificationRule`(s) in `defaultRules`.
6. **API service** — `<module>Api` in `frontend/src/services/api.ts`.
7. **Page + route** — `frontend/src/app/pages/<Module>.tsx` (+ detail page if needed), register in `routes.tsx`.
8. **Navigation** — Registers-hub tile in `Registers.tsx` and/or a `Layout.tsx` sidebar item; RBAC-gate edit actions.

**Next available migration index:** `20260604_020` (last applied was `20260604_019_risk_matrix.sql`).

---

## 3. New RBAC Permissions (consolidated)

Add these to `permissionSeeds` in `server.js` (one `*.manage` per module; reuse existing `dashboards.view`/
`reports.view` for read access). Suggested default-matrix assignments follow the business-role intent already
seeded in Phase 1.

| Permission key | Module | Default roles (in `defaultMatrix`) |
|---|---|---|
| `reserves.manage` | Reserves & Resources Tracker | Manager, Geologist/Drilling Engineer |
| `hse.manage` | HSE Register | Manager, HSE Officer |
| `local_content.manage` | Local Content Tracking | Manager, Finance/Accounts, Legal/Compliance Officer |
| `nda.manage` | NDA & Data Room Tracker | Manager, Legal/Compliance Officer |
| `assumptions.manage` | Assumptions Matrix | Manager, CEO/Country Manager, Finance/Accounts |
| `insurance.manage` | Insurance Register | Manager, Finance/Accounts, Legal/Compliance Officer |
| `partners.manage` | Partner / BD Pipeline | Manager, CEO/Country Manager |
| `forex.manage` | Forex & Banking Workflow | Manager, Finance/Accounts |
| `vendor_payments.manage` | Vendor Payment Aging | Manager, Finance/Accounts |
| `env_permits.manage` | Environmental Permit Tracker | Manager, HSE Officer, Legal/Compliance Officer |
| `csr.manage` | CSR Commitments Tracker | Manager, HSE Officer |

`Manager` is included on all of them to preserve its Phase 1 "broad operational" behaviour, and `Admin` remains
a technical superuser that bypasses the matrix entirely.

---

## 4. Notification Engine additions (consolidated)

New `MODULE_REGISTRY` entries in `notificationEngine.js` and `defaultRules` rows in `server.js`. All reuse the
generic `DateBased` / `ThresholdBased` evaluators — **no engine code changes**.

| Rule name | Module | Trigger | Field | Lead / thresholds | Priority |
|---|---|---|---|---|---|
| Insurance policy expiry | Insurance Register | DateBased | `expiryDate` | 90/60/30/7 | High |
| Environmental permit expiry | Environmental Permit Tracker | DateBased | `expiryDate` | 180/90/30 | High |
| NDA expiry reminder | NDA & Data Room Tracker | DateBased | `expiryDate` | 30/7/1 | Medium |
| HSE incident action due | HSE Register | DateBased | `actionDueDate` | 7/3/1 | High |
| HSE overdue-action escalation | HSE Register | ThresholdBased | `daysOverdue` (VIRTUAL) | ≥1 | Critical |
| Vendor payment aging | Vendor Payment Aging | ThresholdBased | `daysOutstanding` (VIRTUAL) | 30/60/90 | High |
| Forex settlement due | Forex & Banking Workflow | DateBased | `settlementDate` | 3/1 | High |
| Assumption review due | Assumptions Matrix | DateBased | `reviewDate` | 14/7/1 | Medium |
| CSR commitment due | CSR Commitments Tracker | DateBased | `targetDate` | 30/14/7 | Medium |
| Local-content shortfall | Local Content Tracking | ThresholdBased | `shortfallPercent` (VIRTUAL) | ≥5 / ≥10 | High |
| Partner follow-up due | Partner / BD Pipeline | DateBased | `nextActionDate` | 7/3/1 | Medium |

Recipient resolution follows the existing pattern: a module-specific owner field resolved via
`resolveUserByName()`, falling back to the Admin/Manager broadcast when no owner is set.

---

## 5. Per-Module Architecture

Each module follows the 8-step template (§2). Fields listed are the primary columns; every table also gets the
standard `id`, `createdAt`, `updatedAt`, and any `blockId` FK is nullable and references `blocks(id)`.

### 5.1 Reserves & Resources Tracker  (`reserves.manage`)

**Purpose:** Track 1P/2P/3P and contingent/prospective volumes per block/field over time, with an audited
revision history so reserve restatements are traceable.

- **Model `Reserve`** (`reserves`):
  `blockId` (FK), `fieldName`, `resourceType` ENUM(`Oil`,`Gas`,`Condensate`,`NGL`),
  `category` ENUM(`1P`,`2P`,`3P`,`Contingent`,`Prospective`), `grossVolume` DECIMAL, `netVolume` DECIMAL,
  `unit` ENUM(`MMbbl`,`Bscf`,`MMboe`), `asOfDate` DATE, `evaluator` STRING (auditor/CPR firm),
  `methodology` TEXT, `status` ENUM(`Draft`,`Approved`,`Superseded`), `parentReserveId` (self-FK for restatement chain).
- **Derived:** on a new approved estimate for the same block/field/category, prior rows flip to `Superseded`
  (same pattern as `Document` versioning). Optional `VIRTUAL variancePercent` vs. the superseded row.
- **Route `/api/reserves`:** CRUD + `GET /?blockId=&category=&resourceType=`; `POST /:id/supersede`.
- **Notifications:** none required (governance module); relies on the Audit Log for restatement history.
- **Frontend:** `Reserves.tsx` list grouped by block/field with a category matrix (1P/2P/3P columns) + a
  reserves-movement trend (recharts line) reading approved rows by `asOfDate`. Registers-hub tile.
- **Dashboard:** portfolio reserves total (2P) card on the Executive Dashboard, drill-down to `/reserves?blockId=`.
- **Dependencies:** `blocks`. Standalone otherwise.

### 5.2 HSE Register  (`hse.manage`)

**Purpose:** Log HSE incidents/observations, classify severity, drive corrective actions to closure, and
compute leading/lagging safety metrics (TRIR/LTIF).

- **Model `HseIncident`** (`hse_incidents`):
  `blockId` (FK), `incidentType` ENUM(`Injury`,`NearMiss`,`Spill`,`Observation`,`Fire`,`Other`),
  `severity` ENUM(`Low`,`Medium`,`High`,`Critical`), `occurredAt` DATE, `location`, `description` TEXT,
  `reportedBy`, `immediateAction` TEXT, `rootCause` TEXT, `correctiveAction` TEXT, `actionOwner`,
  `actionDueDate` DATE, `status` ENUM(`Open`,`UnderInvestigation`,`ActionPending`,`Closed`),
  `manHoursLost` DECIMAL, `isRecordable` BOOLEAN.
- **Derived:** `VIRTUAL daysOverdue` (from `actionDueDate` when not `Closed`) — the ThresholdBased escalation
  field. TRIR/LTIF computed in a `GET /api/hse/metrics` roll-up endpoint (recordable count × 200,000 ÷ man-hours).
- **Route `/api/hse`:** CRUD + `GET /?blockId=&status=&severity=`, `GET /metrics`, `POST /:id/close`
  (requires `correctiveAction` + `rootCause`, mirrors AFE reconciliation-sign-off pattern).
- **Notifications:** `MODULE_REGISTRY.HseIncident` (`openWhere: { status: { [Op.ne]: 'Closed' } }`,
  `ownerResolver → actionOwner`). Two rules: `actionDueDate` DateBased reminder + `daysOverdue` ThresholdBased
  Critical escalation.
- **Document linkage:** add `hseIncidentId` FK to `documents` for evidence/photos.
- **Frontend:** `HseRegister.tsx` list + incident detail modal (investigation/action tabs); an "HSE metrics"
  KPI strip (TRIR/LTIF/open-actions). Sidebar item (HSE Officer-facing) + Registers-hub tile.
- **Dependencies:** `blocks`, `documents`.

### 5.3 Local Content Tracking (Ghanaian metrics)  (`local_content.manage`)

**Purpose:** Track Ghanaian local-content commitments vs. actuals (spend %, local employment %, local
procurement) for Petroleum Commission reporting.

- **Model `LocalContentRecord`** (`local_content_records`):
  `blockId` (FK), `period` STRING (e.g. `2026-Q2`), `metric` ENUM(`LocalSpend`,`LocalEmployment`,
  `LocalProcurement`,`Training`,`TechnologyTransfer`), `committedPercent` DECIMAL, `actualPercent` DECIMAL,
  `committedValue` DECIMAL, `actualValue` DECIMAL, `currency` ENUM(`GHS`,`USD`), `narrative` TEXT,
  `reportingStatus` ENUM(`Draft`,`Submitted`,`Approved`), `regulator` STRING default `Petroleum Commission`.
- **Derived:** `VIRTUAL shortfallPercent` = `max(0, committedPercent − actualPercent)` — the ThresholdBased
  alert field.
- **Route `/api/local-content`:** CRUD + `GET /?blockId=&period=&metric=`, `GET /summary` (per-period roll-up).
- **Notifications:** `MODULE_REGISTRY.LocalContentRecord` + a `shortfallPercent` ThresholdBased rule (≥5% Warning, ≥10% High).
- **Frontend:** `LocalContent.tsx` — committed-vs-actual grouped bars per metric/period, RAG shortfall badges.
  Links from Correspondence (PC submissions). Registers-hub tile.
- **Dependencies:** `blocks`. Cross-links to Correspondence (§5.14) for PC submissions.

### 5.4 NDA & Data Room Tracker  (`nda.manage`)

**Purpose:** Track NDAs with counterparties and which data-room documents each counterparty may access, with
expiry-driven access revocation reminders.

- **Model `Nda`** (`ndas`): `counterparty`, `ndaType` ENUM(`Mutual`,`OneWay`,`Standstill`), `purpose` TEXT,
  `effectiveDate` DATE, `expiryDate` DATE, `status` ENUM(`Draft`,`Active`,`Expired`,`Terminated`), `owner`,
  `documentId` (FK to the signed PDF).
- **Model `DataRoomGrant`** (`data_room_grants`): `ndaId` (FK), `documentId` (FK to the shared doc),
  `grantedAt` DATE, `revokedAt` DATE, `accessLevel` ENUM(`View`,`Download`).
- **Route `/api/ndas`:** CRUD + nested `GET /:id/grants`, `POST /:id/grants`, `DELETE /:id/grants/:grantId`
  (sets `revokedAt`).
- **Notifications:** `expiryDate` DateBased reminder (30/7/1) → on expiry, flag active grants for revocation.
- **Document linkage:** reuse existing `documents`; grants reference existing doc rows. Respect the existing
  `Document.confidentiality`/`allowedRoles` gating.
- **Frontend:** `NdaTracker.tsx` list + detail showing granted documents and a revoke action. Registers-hub tile.
- **Dependencies:** `documents` (heavy), `blocks` (optional).

### 5.5 Assumptions Matrix  (`assumptions.manage`)

**Purpose:** Central register of planning/economic assumptions (oil price, FX, discount rate, tax) with owner,
confidence, review cadence, and linkage to the decisions/projects they underpin.

- **Model `Assumption`** (`assumptions`): `category` ENUM(`Economic`,`Technical`,`Commercial`,`Regulatory`,`Fiscal`),
  `title`, `description` TEXT, `assumedValue` STRING, `unit`, `confidence` ENUM(`Low`,`Medium`,`High`),
  `owner`, `reviewDate` DATE, `status` ENUM(`Active`,`UnderReview`,`Retired`), `linkedDecisionId` (FK, optional),
  `linkedProjectId` (FK, optional).
- **Route `/api/assumptions`:** CRUD + `GET /?category=&status=&projectId=`.
- **Notifications:** `reviewDate` DateBased reminder (14/7/1) via `MODULE_REGISTRY.Assumption`.
- **Frontend:** `Assumptions.tsx` filterable table with confidence RAG + review-due badges; link into Decision
  Log (§5.13). Registers-hub tile.
- **Dependencies:** `decisions`, `projects` (both optional FKs).

### 5.6 Insurance Register  (`insurance.manage`)

**Purpose:** Track insurance policies, coverage, premiums, and renewal deadlines across the portfolio.

- **Model `InsurancePolicy`** (`insurance_policies`): `policyNumber`, `insurer`, `broker`,
  `policyType` ENUM(`Property`,`Liability`,`WellControl`,`Marine`,`BusinessInterruption`,`Other`),
  `blockId` (FK, optional), `coverageAmount` DECIMAL, `currency` ENUM(`GHS`,`USD`), `premium` DECIMAL,
  `effectiveDate` DATE, `expiryDate` DATE, `renewalNoticePeriodDays` INT, `owner`,
  `status` ENUM(`Active`,`Expired`,`Cancelled`,`Renewed`), `documentId` (FK to the policy PDF).
- **Route `/api/insurance`:** CRUD + `GET /?blockId=&status=&policyType=` (order by `expiryDate ASC`,
  mirrors the Contract route).
- **Notifications:** `expiryDate` DateBased (90/60/30/7) via `MODULE_REGISTRY.InsurancePolicy`.
- **Frontend:** `InsuranceRegister.tsx` list with expiry RAG badges + renewal callouts; a "policies expiring
  in 90 days" card on the Executive Dashboard Block A (reuses the Contract/Licence countdown pattern).
  Registers-hub tile.
- **Dependencies:** `blocks`, `documents`. Very close analogue to the existing Contract Register (§5.11) — copy that scaffold.

### 5.7 Partner / BD Pipeline  (`partners.manage`)

**Purpose:** Track business-development opportunities and partner relationships through a stage pipeline (Kanban),
with next-action reminders.

- **Model `Partner`** (`partners`): `name`, `type` ENUM(`JV`,`Farmee`,`Farmor`,`Vendor`,`Government`,`Other`),
  `country`, `relationshipOwner`, `status` ENUM(`Active`,`Prospect`,`Dormant`), `notes` TEXT.
- **Model `BdOpportunity`** (`bd_opportunities`): `partnerId` (FK), `title`, `blockId` (FK, optional),
  `stage` ENUM(`Lead`,`Evaluation`,`Negotiation`,`DueDiligence`,`Closed-Won`,`Closed-Lost`),
  `estimatedValue` DECIMAL, `currency` ENUM(`GHS`,`USD`), `probability` INT (0–100), `nextAction` TEXT,
  `nextActionDate` DATE, `owner`.
- **Route `/api/partners`:** CRUD; nested `/api/partners/:id/opportunities` or a sibling `/api/bd-opportunities`
  with `GET /?stage=&partnerId=`.
- **Notifications:** `nextActionDate` DateBased (7/3/1) via `MODULE_REGISTRY.BdOpportunity`.
- **Frontend:** `Partners.tsx` (directory) + `BdPipeline.tsx` (Kanban by stage, reusing the Activities Kanban
  component pattern). Sidebar item (CEO/BD-facing).
- **Dependencies:** `blocks` (optional).

### 5.8 Forex & Banking Workflow  (`forex.manage`)

**Purpose:** Record FX conversions/settlements and bank instructions with a maker-checker approval gate before
execution.

- **Model `ForexTransaction`** (`forex_transactions`): `reference`, `transactionType` ENUM(`Spot`,`Forward`,`Transfer`),
  `fromCurrency` ENUM(`GHS`,`USD`), `toCurrency` ENUM(`GHS`,`USD`), `amount` DECIMAL, `rate` DECIMAL,
  `bank`, `valueDate` DATE, `settlementDate` DATE, `purpose` TEXT,
  `status` ENUM(`Draft`,`PendingApproval`,`Approved`,`Rejected`,`Settled`),
  `requestedById` (FK users), `approvedById` (FK users), `approvedAt` DATE.
- **Derived:** `VIRTUAL convertedAmount` = `amount × rate`.
- **Route `/api/forex`:** CRUD + `POST /:id/request-approval`, `POST /:id/approve`, `POST /:id/reject`,
  `POST /:id/settle`. Reuse the **exact maker-checker pattern** from `budgetLines.js` (approver ≠ requester,
  separation of duties, Admin excepted; direct `PUT` to `status='Approved'` rejected with a 400 pointing at the
  action endpoints). Gate `approve`/`reject` behind `finance.approve` (reuse existing permission).
- **Notifications:** `settlementDate` DateBased (3/1) via `MODULE_REGISTRY.ForexTransaction`.
- **Frontend:** `ForexWorkflow.tsx` — list + approval inbox (reuse the AFE/budget-revision inbox UI). Sidebar
  under Finance.
- **Dependencies:** `users` (maker/checker). Reuses `finance.approve`.

### 5.9 Vendor Payment Aging  (`vendor_payments.manage`)

**Purpose:** Track outstanding vendor invoices and their aging buckets (0–30/31–60/61–90/90+) to surface overdue
payables. Builds on the existing `Finance` invoice records rather than duplicating them.

- **Model `VendorInvoice`** (`vendor_invoices`) — or extend `Finance` (recordType `Invoice`) with vendor fields.
  Recommended new model to avoid overloading `Finance`: `vendor`, `invoiceNumber`, `blockId` (FK, optional),
  `financeId` (FK to the linked `Finance` payment, optional), `invoiceDate` DATE, `dueDate` DATE,
  `amount` DECIMAL, `currency` ENUM(`GHS`,`USD`), `amountPaid` DECIMAL,
  `status` ENUM(`Open`,`PartiallyPaid`,`Paid`,`Disputed`).
- **Derived:** `VIRTUAL daysOutstanding` (from `dueDate`), `VIRTUAL agingBucket` (`0-30`/`31-60`/`61-90`/`90+`),
  `VIRTUAL outstandingAmount` = `amount − amountPaid`. `daysOutstanding` is the ThresholdBased alert field.
- **Route `/api/vendor-payments`:** CRUD + `GET /?blockId=&status=&bucket=`, `GET /aging-summary`
  (totals per bucket per currency, same roll-up-from-line-items guarantee as `budgetLines/summary`).
- **Notifications:** `daysOutstanding` ThresholdBased (30/60/90, escalating priority) via `MODULE_REGISTRY.VendorInvoice`.
- **Frontend:** `VendorPayments.tsx` — aging matrix (buckets × currency) with drill-down to the invoice list;
  overdue-payables card on the Executive Dashboard. Sidebar under Finance.
- **Dependencies:** `finance` (optional link), `blocks`.

### 5.10 Environmental Permit Tracker  (`env_permits.manage`)

**Purpose:** Track environmental permits/approvals (EPA Ghana), their conditions, and renewal deadlines.

- **Model `EnvironmentalPermit`** (`environmental_permits`): `permitNumber`, `permitType`
  ENUM(`EIA`,`EPAPermit`,`DischargeConsent`,`WasteDisposal`,`Other`), `regulator` default `EPA Ghana`,
  `blockId` (FK), `issueDate` DATE, `expiryDate` DATE, `status` ENUM(`Active`,`Expired`,`Suspended`,`Renewed`),
  `conditions` TEXT, `owner`, `documentId` (FK).
- **Model `PermitCondition`** (`permit_conditions`, optional phase-2b): `permitId` (FK), `description`,
  `dueDate` DATE, `status` ENUM(`Open`,`Met`,`Overdue`) — for tracking compliance obligations *within* a permit.
- **Route `/api/environmental-permits`:** CRUD + `GET /?blockId=&status=&permitType=`.
- **Notifications:** `expiryDate` DateBased (180/90/30) via `MODULE_REGISTRY.EnvironmentalPermit`; if conditions
  are modelled, an `actionDueDate`-style rule on `permit_conditions`.
- **Frontend:** `EnvironmentalPermits.tsx` list with expiry RAG; feeds the Executive Dashboard Block A countdown
  alongside Licences/Contracts/Insurance. Registers-hub tile.
- **Dependencies:** `blocks`, `documents`. Strong analogue to Contract/Insurance registers.

### 5.11 CSR Commitments Tracker  (`csr.manage`)

**Purpose:** Track corporate-social-responsibility commitments to communities (projects, budgets, delivery
status) for regulatory and reputational reporting.

- **Model `CsrCommitment`** (`csr_commitments`): `title`, `community`, `blockId` (FK, optional),
  `category` ENUM(`Education`,`Health`,`Infrastructure`,`Environment`,`Livelihood`,`Other`),
  `committedBudget` DECIMAL, `spentToDate` DECIMAL, `currency` ENUM(`GHS`,`USD`), `startDate` DATE,
  `targetDate` DATE, `status` ENUM(`Planned`,`InProgress`,`Completed`,`OnHold`,`Cancelled`),
  `owner`, `beneficiaries` INT, `narrative` TEXT.
- **Derived:** `VIRTUAL budgetUtilisation` = `spentToDate ÷ committedBudget × 100`.
- **Route `/api/csr`:** CRUD + `GET /?blockId=&status=&category=`, `GET /summary` (spend/beneficiaries per category).
- **Notifications:** `targetDate` DateBased (30/14/7) via `MODULE_REGISTRY.CsrCommitment`.
- **Frontend:** `CsrCommitments.tsx` — list + category spend donut + progress bars; community-impact summary
  card. Registers-hub tile.
- **Dependencies:** `blocks`, `documents` (evidence).

---

## 6. Recommended Build Order & Phasing

Sequenced to maximise **scaffold reuse** (build the closest analogues to Phase 1 modules first, so each new one
is largely a copy-adapt), and to front-load the highest business value.

### Wave 1 — "Register clones" (fastest; copy Contract Register scaffold) — ✅ Done (2026-07-05)
1. **Insurance Register** — ✅ done. `backend/models/InsurancePolicy.js`, `backend/routes/insurance.js`,
   `backend/migrations/20260604_020_insurance_register.sql`, `insurance.manage` permission, "Insurance policy
   expiry" `NotificationRule` (90/60/30/7 days), `frontend/src/app/pages/InsuranceRegister.tsx`.
2. **Environmental Permit Tracker** — ✅ done. `backend/models/EnvironmentalPermit.js`,
   `backend/routes/environmentalPermits.js`, `backend/migrations/20260604_021_environmental_permits.sql`,
   `env_permits.manage` permission, "Environmental permit expiry" `NotificationRule` (180/90/30 days),
   `frontend/src/app/pages/EnvironmentalPermits.tsx`.
3. **NDA & Data Room Tracker** — ✅ done. `backend/models/Nda.js` + `backend/models/DataRoomGrant.js` (bridge
   table for document access grants), `backend/routes/ndas.js` (CRUD + nested `GET/POST /:id/grants` and
   `PUT /:id/grants/:grantId/revoke` — soft-revoke via `revokedAt`, not a hard delete, keeping access history
   auditable), `backend/migrations/20260604_022_nda_data_room.sql`, `nda.manage` permission, "NDA expiry
   reminder" `NotificationRule` (30/7/1 days), `frontend/src/app/pages/NdaTracker.tsx` (NDA list + a
   "Data Room Access" manager modal to grant/revoke access to existing `documents` rows).

   Cross-cutting work done alongside Wave 1: `Document` model gained nullable `insurancePolicyId` and
   `environmentalPermitId` FKs (idempotent guarded `ALTER TABLE`, mirrors the `contractId` pattern); all three
   modules were added to the Registers hub (`Registers.tsx`) and to the Notification Engine's `MODULE_REGISTRY`;
   `Manager` plus the relevant business roles (Finance/Accounts, Legal/Compliance Officer, HSE Officer) were
   wired into the default RBAC matrix for the three new `*.manage` permissions.

### Wave 2 — "Finance family" (reuse maker-checker + aging/roll-up patterns) — ✅ Done (2026-07-05)
4. **Vendor Payment Aging** — ✅ done. `backend/models/VendorInvoice.js` (VIRTUAL `outstandingAmount`/
   `daysOutstanding`/`agingBucket`), `backend/routes/vendorPayments.js` (`GET /aging-summary` roll-up,
   zero-filled per bucket/currency — mirrors `budgetLines/summary`'s "roll-up always equals the sum of the
   underlying rows" guarantee), `backend/migrations/20260604_023_vendor_payment_aging.sql`,
   `vendor_payments.manage` permission, "Vendor payment aging" ThresholdBased `NotificationRule` (30/60/90 days),
   `frontend/src/app/pages/VendorPayments.tsx` (clickable aging matrix that filters the invoice list below it).
5. **Forex & Banking Workflow** — ✅ done. `backend/models/ForexTransaction.js` (VIRTUAL `convertedAmount`),
   `backend/routes/forex.js` — **exact maker-checker pattern reused from `budgetLines.js`**: direct `PUT` to
   change `status` is rejected (400) pointing at the action endpoints; `/:id/request-approval` (Draft/Rejected →
   PendingApproval), `/:id/approve` (separation of duties — approver ≠ requester, Admin excepted — 403
   otherwise), `/:id/reject`, `/:id/settle` (Approved → Settled). Deviated from the plan's original suggestion
   to gate approve/reject behind `finance.approve`: the whole `/api/forex` path is gated by a single
   `forex.manage` permission instead (like `budgetLines.js`'s `budget.manage`), since the RBAC middleware only
   supports one permission per path prefix — separation of duties is enforced in the route handler itself, not
   via a second permission. `backend/migrations/20260604_024_forex_banking_workflow.sql`, "Forex settlement due"
   DateBased `NotificationRule` (3/1 days, scoped to `status='Approved'`),
   `frontend/src/app/pages/ForexWorkflow.tsx` (list + inline maker-checker action buttons, Approve disabled
   client-side with a tooltip when the current user is the requester).

### Wave 3 — "Governance registers" (mostly CRUD + Audit Log; light notifications) — in progress
6. **Assumptions Matrix** — links to Decisions/Projects.
7. **Reserves & Resources Tracker** — versioned restatement chain (Document-versioning pattern).
8. **CSR Commitments Tracker** — CRUD + spend roll-up.
9. **Local Content Tracking** — ✅ done (2026-07-05). `backend/models/LocalContentRecord.js` (VIRTUAL
   `shortfallPercent` = `max(0, committedPercent − actualPercent)`), `backend/routes/localContent.js`
   (`GET /summary` per-period roll-up), `backend/migrations/20260604_025_local_content_tracking.sql`,
   `local_content.manage` permission (Manager, Finance/Accounts, Legal/Compliance Officer),
   "Local content shortfall" ThresholdBased `NotificationRule` (≥5%/≥10%),
   `frontend/src/app/pages/LocalContent.tsx` (committed-vs-actual grouped bar chart per metric, RAG shortfall
   badges, period/metric filters). Built ahead of Assumptions Matrix/Reserves/CSR at the user's request.

### Wave 4 — "Richer domain modules" (more sub-entities / bespoke UI) — in progress
10. **HSE Register** — ✅ done (2026-07-05). `backend/models/HseIncident.js` (VIRTUAL `daysOverdue`),
    `backend/routes/hse.js` — `GET /metrics` (TRIR/LTIF; exposure hours supplied by the caller via
    `?totalManHours=`, since this module doesn't track HR/payroll exposure hours itself — returns raw counts
    only when omitted), `POST /:id/close` (rootCause + correctiveAction required, mirrors the AFE
    reconciliation-sign-off pattern in `finance.js`; direct `PUT status=Closed` rejected with a 400 pointing at
    the action endpoint), `hse.manage` permission (Manager, HSE Officer), "HSE incident action due" DateBased
    `NotificationRule` (7/3/1 days) + "HSE overdue-action escalation" ThresholdBased `NotificationRule`
    (`daysOverdue` \u2265 1, Critical), `backend/migrations/20260604_026_hse_register.sql` (+ guarded
    `documents.hseIncidentId` FK), `frontend/src/app/pages/HseRegister.tsx` (KPI strip incl. TRIR/LTIF, filters,
    a Details/Investigation &amp; Action tabbed modal, and a "Close Incident" action gated the same way server-side).
11. **Partner / BD Pipeline** — partner directory + Kanban pipeline (reuse Activities Kanban).

**Rationale:** each wave establishes a reusable pattern that the next modules copy, so effort per module drops
across the plan. Waves are independently shippable.

---

## 7. Cross-Cutting Work (do once, benefits all)

These small platform investments make the per-module work cheaper and should be scheduled alongside Wave 1:

- **Registers hub is data-driven** — today `Registers.tsx` mixes a live `registersApi` list with a hardcoded
  `defaultRegisters` fallback. Add the new modules as real tiles (with `href`) and, ideally, seed them as
  `Register` rows so the hub reflects reality (retires more of the single-source-of-truth debt from §3.2).
- **Dashboard Block A generalisation** — Block A already aggregates Licence/Contract/Compliance/Correspondence
  deadlines. Extend its countdown aggregator to also pull Insurance and Environmental Permit expiries (both are
  the same "expiryDate + RAG" shape), so those two modules light up the Chairman View for free.
- **`documents` FK additions** — batch the `hseIncidentId`, `ndaId`/grant, `insurancePolicyId`,
  `environmentalPermitId`, `csrCommitmentId` nullable FKs into as few migrations as practical.
- **Shared "expiry register" frontend component** — extract the Contract/Insurance/Env-Permit list (search +
  block/status filter + expiry RAG + CSV export) into one reusable component to avoid three near-duplicate pages.
- **Notification rule seeding** — add all new `defaultRules` in one `server.js` block; they're idempotent
  (`findOrCreate` by `name`) so re-running startup is safe.

---

## 8. Data Model Summary (new tables)

| Table | Module | Key FKs |
|---|---|---|
| `reserves` | Reserves & Resources | `blockId`, `parentReserveId` (self) |
| `hse_incidents` | HSE Register | `blockId` |
| `local_content_records` | Local Content | `blockId` |
| `ndas` | NDA & Data Room | `documentId` |
| `data_room_grants` | NDA & Data Room | `ndaId`, `documentId` |
| `assumptions` | Assumptions Matrix | `linkedDecisionId`, `linkedProjectId` |
| `insurance_policies` | Insurance Register | `blockId`, `documentId` |
| `partners` | Partner / BD Pipeline | — |
| `bd_opportunities` | Partner / BD Pipeline | `partnerId`, `blockId` |
| `forex_transactions` | Forex & Banking | `requestedById`, `approvedById` |
| `vendor_invoices` | Vendor Payment Aging | `financeId`, `blockId` |
| `environmental_permits` | Environmental Permit | `blockId`, `documentId` |
| `permit_conditions` *(optional)* | Environmental Permit | `permitId` |
| `csr_commitments` | CSR Commitments | `blockId` |

Plus additive nullable FK columns on `documents`: `hseIncidentId`, `ndaId`, `insurancePolicyId`,
`environmentalPermitId`, `csrCommitmentId`.

---

## 9. Testing & Rollout Checklist (per module)

- [ ] Migration applies cleanly on a fresh DB **and** an existing DB (idempotency verified).
- [ ] `npm run migrate` recorded in `_migrations`; `sequelize.sync()` boot is a clean no-op afterward.
- [ ] Model create/update/delete appears in the Audit Log (spot-check one entity).
- [ ] RBAC: a user *without* `<key>.manage` gets 403 on POST/PUT/DELETE; *with* it, succeeds; Admin bypasses.
- [ ] Notification rule fires in a forced sweep (`POST /api/notifications/run-check`) for a seeded due/threshold record.
- [ ] Frontend page loads live data (no hardcoded fallback), edit-actions hidden without permission.
- [ ] Drill-down query params (`blockId`/`status`) consumed where the dashboard links in.
- [ ] `tsc --noEmit` passes; backend boots without errors.

---

## 10. Out of Scope for This Plan

- **Daily Drilling Report** and **Daily Geological Report** (§7) — high-frequency operational reporting, planned separately.
- **Non-functional hardening** (§8/§12/§13) — MFA, email/SMS transport, SSO, native PDF/PPT export, backup/DR —
  tracked in the main gap checklist, independent of these modules.
- Any accounting-ledger reconciliation beyond procedural sign-off (per requirements §2.2 "not a replacement accounting system").
