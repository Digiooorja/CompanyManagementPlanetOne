# Launch Readiness Checklist

Items that should be addressed before a **real production launch** (i.e. real users, real client
data — not just a demo/pilot). Compiled from `REQUIREMENTS_GAP_CHECKLIST.md`, `Phase2DevelopmentPlan.md`,
and bugs found while working in this codebase. Legend: 🔴 blocking for production · 🟡 should fix soon ·
🟢 nice-to-have polish.

---

## 1. Security & Compliance — 🔴 nothing here is started

- [ ] **MFA** for privileged roles (Finance/Legal/Chairman per spec §12)
- [ ] **TLS enforcement + encryption at rest** for the database/file storage
- [ ] **Doc/folder-level permission layer** beyond the current RBAC matrix (Confidentiality level +
      `allowedRoles` exists on `Document`, but no equivalent for folders/other modules)
- [ ] **Ghana Data Protection Act (Act 843) compliance review** — no formal review has been done
- [ ] **Backup / disaster-recovery plan** — no automated DB backup schedule, no documented restore process
      (relevant given the accidental-overwrite incident encountered during this project — see
      `/memories/repo/known-bugs-and-conventions.md` for the postmortem)
- [ ] **Data retention policy** for the Audit Log (currently immutable/unbounded — §5.4 flags "configurable
      retention" as still TODO)
- [ ] Secrets hygiene: `backend/.env` currently has live AWS keys and DB password committed to the working
      tree — confirm these are rotated/not the ones actually used in production, and that `.env` is
      git-ignored

## 2. Testing — 🔴 blocking for a system this size

- [ ] **Zero automated tests exist** — no Jest/Vitest/Mocha/Cypress/Playwright config or `*.test.*` files
      anywhere in the repo (`backend/` or `frontend/`)
- [ ] No CI pipeline enforcing tests/lint on merge
- [ ] No load/performance testing — spec targets <3s page loads at 100 concurrent users, and <3s Audit Log
      queries at 1M+ rows; neither has been measured
- [ ] Given the maker-checker financial workflows (Budget revisions, AFE, Forex), these are the highest-risk
      areas to leave untested — a regression here has real financial/audit consequences

## 3. Known functional bugs — 🟡 should fix soon

- [ ] **Activities Kanban view**: "To Do" and "In Progress" columns are permanently empty. `Activity.status`
      enum is only `('Active','Inactive','Completed')` in `backend/models/Activity.js`, but
      `frontend/src/app/pages/Activities.tsx`'s Kanban view filters on `"To Do"`/`"In Progress"` — no code
      path ever sets those values, so those columns can never populate. Either add the missing enum values
      + a status-selection UI, or remove/relabel the unreachable Kanban columns.
- [ ] **`WorkflowDetail.tsx`** sidebar still shows a hardcoded fake "Related Documents" list (e.g. "AFE
      Amendment Form.pdf") — not wired to real document data.

## 4. Largest incomplete Phase 1 requirement — 🟡

- [ ] **§5.9 Licence Phase Countdown** — mostly unbuilt:
  - [ ] Phase enum (Exploration / Extension / Appraisal / Development / Production)
  - [ ] Phase start/end dates + minimum work obligation fields
  - [ ] Daily-recalculated countdown with 180/90/30-day banners
  - [ ] Escalation of <30-day items to the Executive Dashboard
  - [ ] Controlled, audited phase-transition sign-off workflow

  (Every other Phase 1 module from the requirements doc is done or has only minor gaps — this is the one
  genuinely unbuilt core feature.)

## 5. Other functional gaps — 🟡

- [ ] Notification engine is **in-app only** — no email/SMS transport, so anyone not actively logged in
      misses time-critical alerts (licence expiry, budget variance, overdue compliance, etc.)
- [ ] Task → Project completion roll-up doesn't exist (`Project.completion` is currently driven only by
      Activities, not Tasks — needs a product decision on how the two should combine)
- [ ] `documents` / `comments` / `tasks` / `licences` / `finance` routes still use simpler
      `authMiddleware`-only or bespoke gates instead of the full `requirePermission()` RBAC matrix used by
      the other 11 modules
- [ ] Contract expiry, Correspondence overdue-responses, and Compliance items aren't yet surfaced on the
      Chairman View dashboard (data/APIs already exist — just needs wiring, per
      `Phase2DevelopmentPlan.md` / `REQUIREMENTS_GAP_CHECKLIST.md` §4)
- [ ] Chairman View export is browser print-to-PDF only — no native PDF/PowerPoint generation, no scheduled
      email digest, no versioned archive
- [ ] `OperationsUpdate` isn't surfaced automatically on `BlockDetail.tsx` yet
- [ ] OCR + full-text document search, and recoverable soft-delete for documents — both explicitly deferred

## 6. Operational readiness — 🟢

- [ ] No process manager for local/production runtime (currently raw `node server.js` / `vite` in a
      terminal — a crashed terminal takes the whole app down, as happened during this project). Recommend
      PM2, a Windows Service wrapper, or equivalent for anything beyond a laptop demo.
- [ ] Frontend `node_modules` has been observed getting into a partially-installed state; confirm a clean
      `npm install` (workspace root, not per-package) is part of the deployment/build process.
- [ ] No health-check endpoint (`GET /api/health` currently 404s) — add one for uptime monitoring / load
      balancer checks.

---

## Suggested order of attack

1. Automated tests for the financial maker-checker flows (Budget revisions, AFE, Forex) — highest risk of
   silent regressions.
2. Security basics: rotate/secure secrets, TLS, MFA for privileged roles.
3. Backup/DR plan + retention policy.
4. Fix the two known functional bugs (Activities Kanban, WorkflowDetail hardcoded list) — small, contained.
5. Licence Phase Countdown (§5.9) — the one substantial missing Phase 1 feature.
6. Email/SMS notification transport.
7. Everything else in §5/§6 above, roughly in the listed order.
