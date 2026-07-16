# PlanetOne Oil & Gas — Project Tracking Application

## User Guide

This guide explains how to use the PlanetOne Oil & Gas project tracking application — a web app for managing exploration/production blocks, projects, activities, tasks, documents, finance/budget, governance registers, and compliance across the portfolio.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Navigation & Layout](#3-navigation--layout)
4. [Executive Dashboard](#4-executive-dashboard)
5. [Core Modules](#5-core-modules)
6. [Governance Modules](#6-governance-modules)
7. [Finance & Operations Modules](#7-finance--operations-modules)
8. [Licences](#8-licences)
9. [Reports](#9-reports)
10. [Notifications](#10-notifications)
11. [Admin Panel](#11-admin-panel)
12. [Roles & Access Reference](#12-roles--access-reference)
13. [Where the Numbers Come From — Data Sources & Ownership](#13-where-the-numbers-come-from--data-sources--ownership)
14. [Tips & Troubleshooting](#14-tips--troubleshooting)

---

## 1. Introduction

The application tracks the full lifecycle of an oil & gas venture: blocks and licences, projects and activities, budgets and AFEs, contracts, compliance, HSE, and more. Data is organized around three levels:

- **Blocks** — exploration/production licence areas (the top of the hierarchy).
- **Projects** — initiatives delivered within a block.
- **Activities / Sub-Activities / Tasks** — the work items that make up a project.

Everything else (documents, finance, registers, risks) links back to these.

## 2. Getting Started

### Signing in

Go to the **Login** page and sign in with your email and password. Demo credentials are shown on-screen for testing. New accounts can be created from the **Register** page (name, username, email, department, password).

### Guest / view-only access

If you don't sign in, the app automatically loads a **Guest** session with view-only access — you can browse most pages, but create/edit/delete actions, uploads, and notifications are disabled.

### Roles

Every user has a role (e.g. Admin, Manager, Finance/Accounts, HSE Officer) that determines which actions are available. See [Section 12](#12-roles--access-reference) for the full list.

## 3. Navigation & Layout

- **Top bar**: PlanetOne logo, global search (searches projects, documents, and activities as you type), notifications bell, and your user menu (with sign out).
- **Sidebar**: grouped navigation —
  - **Core**: Dashboard, Blocks, Projects, Activities, Documents, Workflows, Registers, Finance, Licences, Reports, Tasks.
  - **Governance**: Contracts, Compliance, Correspondence, Decisions, Insurance Register, Environmental Permits, NDA & Data Room, HSE Register.
  - **Finance & Operations**: Budget Tracker, Vendor Payments, Forex Workflow, Local Content, Operations Updates.
  - **Admin**: only visible to Admin users.
- On mobile/narrow screens, use the menu icon to open/close the sidebar.

## 4. Executive Dashboard

The landing page (`/`) for most users, with a **Chairman/Board** variant for that role. Key elements:

- **Portfolio Health card**: a colour-coded gauge (green/amber/red) showing an overall health score, plus a status label (Healthy / Needs Attention / At Risk). Click it to open the Registers hub.
- **KPI strip**: compact clickable tiles for headline numbers (e.g. active projects, open risks), each routing to its detail page.
- **Attention Required panel**: collapsible list of the most urgent items across the portfolio (overdue tasks, risks, compliance items, etc.). Click the header to expand it — the list appears as a floating panel and does not resize the row; click anywhere outside it to close.
- **Licence Action Required widget**: highlights the licence closest to expiry, with a **Manage Licence** button.
- **Search results**: if you type into the global search box, matching documents/activities/projects appear here.
- **Tabbed content** (Analytics / Operations / Assets / Risk & Actions):
  - **Analytics**: portfolio charts.
  - **Operations**: operational summaries/matrices.
  - **Assets**: the **Asset Health Matrix** — one row per block, split into a name/status column (45% width) and an operator/area column (55% width); click a row to open that block.
  - **Risk & Actions**: Critical Risks Alert Panel and the AFE Action Inbox (pending AFEs awaiting your action).
- Filters (status, date range) are available above the KPI strip to scope the whole dashboard.

## 5. Core Modules

### Blocks (`/blocks`, detail `/blocks/:id`)
List of all exploration/production blocks with active licence counts. **Add Block** captures name, status, operator, working interest, area, location, and optionally an initial licence. The detail page shows overview info, associated projects, documents, licences, and registers.

### Projects (`/projects`, detail `/projects/:id`)
List of projects with search and Block/Status filters. **New Project** captures name, block, manager, budget, and planned dates. The detail page shows a Gantt chart, Activities (reorderable), Plan vs Actual, Budget chart, Documents, and Risks.

### Activities (`/activities`, detail `/activities/:id`)
Top-level activities with nested sub-activities, in Table or Kanban view. **New Activity** captures project, assignee, planned dates/cost, priority, and description. The detail page manages sub-activities, linked documents, and per-department comments; progress is auto-calculated once sub-activities exist.

### Tasks (`/tasks`)
Personal task management with **My Tasks**, **Assigned by Me**, and **Workload** tabs. Create tasks, update status/progress, add subtasks, comments, and attachments via the task detail modal.

### Documents (`/documents`, detail `/documents/:id`)
Master document library with Block/Type/Status filters and search. **Upload Document** links a file to a block/project/activity/licence with type, category, confidentiality, and tags. The detail page shows metadata, a preview, and version history (upload new versions, download any version).

### Workflows (`/workflows`, detail `/workflows/:id`)
Approval workflow inbox. **Create Workflow** defines a title, type, priority, due date, and initial step. The detail page shows the approval timeline; approve or reject the current step with an optional comment.

### Registers hub (`/registers`)
A landing page linking to every specialized register (Risk, Compliance, Contracts, Correspondence, Decisions, Operations Updates, Budget Tracker, Insurance, Environmental Permits, NDA, Vendor Payments, Forex, Local Content, HSE). The **Risk Register** (`/registers/:id`) additionally offers a Risk Scoring Matrix configuration panel for Admins.

## 6. Governance Modules

| Module                | Route                    | Purpose                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Contracts             | `/contracts`             | Register of contracts/counterparties with expiry & renewal alerts.                                          |
| Compliance            | `/compliance`            | Statutory payments/obligations (tax, licence fees, royalties, filings) with due/overdue tracking.           |
| Correspondence        | `/correspondence`        | Log of regulator (PC/GNPC) correspondence, with awaiting-response tracking.                                 |
| Decisions             | `/decisions`             | Chronological log of key decisions and rationale.                                                           |
| Insurance Register    | `/insurance`             | Insurance policies, coverage, and renewal deadlines.                                                        |
| Environmental Permits | `/environmental-permits` | EPA Ghana permits/approvals and renewal deadlines.                                                          |
| NDA & Data Room       | `/nda-tracker`           | NDAs with counterparties, plus a Data-Room Access manager (grant/revoke View/Download access per document). |
| HSE Register          | `/hse`                   | Incidents/observations, corrective actions, and safety metrics (TRIR/LTIF).                                 |

Each register page follows the same pattern: KPI summary cards, filters/search, a table of records, and **New / Edit / Delete** actions (each gated by a module-specific permission, e.g. `contracts.manage`, `hse.manage`).

## 7. Finance & Operations Modules

### Finance (`/finance`) & AFE detail (`/finance/:id`)
Tracks AFEs (Authorizations for Expenditure) and Invoices, with budget/spend charts. Create a new AFE, record/mark invoice payments, and search across both lists. The AFE detail page supports document uploads, supplementary AFEs, and a reconciliation/closure workflow.

### Budget Tracker (`/budget-tracker`)
Work Programme & Budget vs. actual spend per block, with variance flags. Manage budget line items, request a **budget revision**, and approve/reject pending revisions (maker-checker: the approver must differ from the requester unless Admin).

### Vendor Payments (`/vendor-payments`)
Vendor invoice aging register with an aging matrix (clickable buckets) and outstanding-balance KPIs. Create/edit/delete invoices with vendor, dates, amount, and payment status.

### Forex Workflow (`/forex`)
FX conversion/settlement transactions with a maker-checker approval flow: Submit → Approve/Reject → Settle.

### Local Content (`/local-content`)
Tracks Ghanaian local-content commitments vs. actuals (for Petroleum Commission reporting), with a Committed-vs-Actual chart and shortfall KPIs.

### Operations Updates (`/operations-updates`)
Periodic field/project status log per block/well — summary, key issues, and next steps.

## 8. Licences

The **Licences** page (`/licences`) lists all block licences with expiry-proximity colour coding (Active / Expiring within 60 days / Expired). Add or edit a licence, and manage its documents (upload, link existing documents, preview, download) directly from the licence card.

Each licence also tracks its **phase** (Exploration / Extension / Appraisal / Development / Production), with its own countdown badge based on the phase end date, plus a minimum work obligation note. The phase itself can only be changed via the **Transition Phase** button, which requires a mandatory sign-off comment and confirmation — it's recorded (who, when, why) and can't be edited as a plain field.

## 9. Reports

The **Reports** page (`/reports`) is a catalogue of operational, financial, HSE, and performance reports, with category/frequency filters and search. Use **Generate** or **Export PDF/Excel** on a report card, and check **Recently Generated Reports** for history.

## 10. Notifications

Click the bell icon or go to **Notifications** (`/notifications`) to see **All / Unread / Read** notifications. Use **Mark all as read** or **Clear all** to manage your inbox (requires edit permission — Guests cannot modify notifications).

## 11. Admin Panel

Available only to **Admin** users (`/admin`):

- **Users**: create, edit, deactivate, or delete user accounts; view a user's profile change history.
- **Roles & Permissions matrix**: create/delete roles and toggle which permissions each role has (the system **Admin** role itself cannot be edited). Each module has both a `.manage` permission (create/edit/delete) and a separate `.notify` permission (who's eligible to receive that module's alerts) — they're independent, so a role can have one without the other.
- **Notification Rules**: pick which department(s) each module's fallback alert broadcast goes to (e.g. restrict Licence expiry alerts to Legal only), or leave none selected for an org-wide broadcast to everyone with that module's notify permission. Also toggle a rule active/inactive.
- **Org Chart**: view the department/reporting structure.
- **Dashboard metrics**: refresh system-wide counts.

## 12. Roles & Access Reference

Roles are configurable (Admins can add new ones), but the application ships with these defaults:

| Role                        | Typical Access                                                                 |
| --------------------------- | ------------------------------------------------------------------------------ |
| Admin                       | Full system access, including user management and RBAC configuration.          |
| Manager                     | Broad create/edit rights across core operational modules.                      |
| User                        | View access plus document/comment contributions.                               |
| Chairman/Board              | Read-only oversight, Chairman View, one-click export.                          |
| CEO/Country Manager         | Full read access; approval authority on budgets, decisions, AFEs.              |
| Project/Operations Manager  | Full access to tasks, activities, work programme, operations updates.          |
| Legal/Compliance Officer    | Full access to contracts, compliance tracker, correspondence log, NDA tracker. |
| Finance/Accounts            | Full access to budget tracker, AFE tracking, vendor payments, forex workflow.  |
| HSE Officer                 | Full access to HSE register and environmental permit tracker.                  |
| Geologist/Drilling Engineer | Full access to technical/operations reporting.                                 |
| Team Member/Staff           | Limited to assigned tasks, activities, and documents.                          |
| External Partner            | Read-only access to specifically shared documents/reports.                     |
| Guest (not signed in)       | View-only across the app; no create/edit/upload/notification actions.          |

Most modules gate their **New / Edit / Delete** actions behind a specific permission key (e.g. `finance.manage`, `hse.manage`, `contracts.manage`) which Admins can assign to any role from the Admin panel — access is not hard-coded to a role name.

## 13. Where the Numbers Come From — Data Sources & Ownership

> 📊 For a visual walkthrough of these same flows (with diagrams), see [DATA_FLOW_DIAGRAM.md](DATA_FLOW_DIAGRAM.md).

Every chart, KPI tile and score in this application is **calculated live from records that someone entered elsewhere in the app** — nothing on the dashboards is typed in directly. This section traces each derived/analysed number back to the raw field(s) it's calculated from, which page that field is entered on, and which role is expected to keep it up to date (based on the default permission matrix in [Section 12](#12-roles--access-reference)).

### Executive Dashboard

| Number | Calculated from | Entered on... | Responsible role |
| --- | --- | --- | --- |
| **Portfolio Health Score** (gauge, 0–100) | Weighted composite: 40% Avg Completion + 30% Budget Discipline + 20% Open-Risk Load + 10% Overdue-Alert Load (see rows below for each) | — (composite, not entered directly) | Shared — see components |
| **Avg Completion %** (KPI tile & health input) | Average of each project's `completion` field | Projects page (`/projects`) — set directly via **New Project** or the pencil/**Edit** icon on any row (Completion % field) | Project/Operations Manager |
| **Budget Used %** / Budget-by-Block chart | Sum of each project's budget vs. spent, which is itself auto-rolled up from every linked Activity's **Planned Cost** and **Actual Cost** | Activity detail page (`/activities/:id`) — Planned Cost and Actual Cost fields | Planned Cost: Project/Operations Manager · Actual Cost: Finance/Accounts |
| **AFE Utilisation gauge** | Sum of AFE **authorised amount** vs. **actual-to-date** across all AFEs | Finance page (`/finance`) — new AFE amount, then actual spend updates | Finance/Accounts |
| **Expiring ≤30 days** tile | Count of active Licences + Contracts whose `expiryDate` falls within 30 days | Licences page (expiry date) and Contracts page (expiry date) | Licences: Admin/Manager · Contracts: Legal/Compliance Officer |
| **Attention Required** panel / **Notifications** | Auto-generated by the Notification & Alert Engine from due dates, statuses and thresholds on tasks, licences, compliance obligations, budget lines, AFEs, correspondence, documents, etc. | Wherever the underlying record's due date/status is set (Tasks, Licences, Compliance, Budget Tracker, Finance, ...) | Whoever owns that underlying record (e.g. the task's assignee, the Compliance Officer for an obligation) |
| **Asset Health Matrix** (Assets tab) | Each block's `status`, `operator`, `area` fields | Blocks page (`/blocks`) — Add/Edit Block | Admin / Project-Operations Manager |
| **Risk severity/probability heat-map**, **Risk Score/Band** | Each risk's `severity` × `probability`, scored against the Admin-configurable Risk Scoring Matrix | Risk Register (`/registers/1`) — New/Edit Risk; matrix weights configured by Admin on the same page | Risk entries: HSE Officer / Project-Operations Manager · Matrix weights: Admin |

### Register & module-specific metrics

| Number | Calculated from | Entered on... | Responsible role |
| --- | --- | --- | --- |
| **HSE TRIR / LTIF** | Recordable-incident and lost-time-incident counts from HSE Register entries, divided by real recorded exposure (man-)hours | HSE Register (`/hse`) — incident type & man-hours-lost fields, plus the **Log Exposure Hours** button (period, block, man-hours worked) | HSE Officer |
| **Vendor Payment Aging buckets** (Current/0-30/31-60/61-90/90+) | Computed automatically from each invoice's due date vs. today | Vendor Payments page (`/vendor-payments`) — invoice/due date fields | Finance/Accounts |
| **Local Content shortfall %** | Committed % minus Actual % on each tracking record | Local Content page (`/local-content`) — committed/actual percent fields | Legal/Compliance Officer / Finance/Accounts |
| **Compliance / Contract / Insurance / Env. Permit / NDA "Expiring in X days"** KPIs | Each record's own `expiryDate`/`dueDate` field | The respective register page — New/Edit entry | Compliance & Contracts & NDA: Legal/Compliance Officer · Insurance: Finance/Accounts · Env. Permits: HSE Officer |
| **Budget Tracker variance flags** | Approved vs. committed vs. actual on each budget line | Budget Tracker (`/budget-tracker`) — New/Edit line, plus revision requests | Finance/Accounts (Project/Operations Manager can also raise lines) |
| **Registers hub entry counts / last-updated dates** | Live row count and most recent `updatedAt` from each register's own table | Same as that register's own page | Same as that register (see table above / Section 6–7) |
| **Reports category counts** | Count of report catalogue entries (`report_definitions`) per category | Reports page (`/reports`) — **New Report** button, plus pencil/trash icons on each report card | Admin (requires the `reports.manage` permission) |

### Known gaps (numbers that aren't fully wired to a user input yet)

- **HSE exposure hours**: now stored per block/period via **Log Exposure Hours** on the HSE Register page, but everyone should log against the same agreed periods/blocks for TRIR/LTIF to stay comparable across reporting cycles.
- Everything else previously flagged here (Project Avg Completion % input, Reports catalogue management) now has a real in-app control — see the rows above.

## 14. Tips & Troubleshooting

- **Can't see a "New/Add" button, or it's greyed out?** You likely lack the permission for that module, or you're signed in as Guest — ask an Admin to grant the relevant permission to your role.
- **Dashboard drill-downs**: many KPI tiles and chart segments are clickable and will take you to a pre-filtered list (e.g. clicking "Overdue Tasks" opens Tasks already filtered).
- **Global search**: the search box in the top bar searches across projects, documents, and activities at once; results also appear on the Executive Dashboard.
- **Printing/exporting**: use your browser's print function for a clean printout — the sidebar and overlays are hidden automatically in print view.
- **Licence/document links opening in read-only vs. edit mode**: this depends on whether you have edit rights — Guests and users without permission are routed to a read-only search view instead of the edit dialog.
