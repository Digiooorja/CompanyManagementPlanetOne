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
- [x] ~~**Backup / disaster-recovery plan** — no automated DB backup schedule, no documented restore
      process~~ Fixed 2026-07-07 — automated daily `mysqldump` backup schedule (`backend/services/
      backupService.js` + `backupScheduler.js`, started from `server.js`'s `startServer()`), with optional S3
      upload (reuses the existing document-storage bucket/creds) and local retention pruning (default: keep
      last 14). Admin can view/trigger via `GET`/`POST /api/admin/backups`(`/run`). **Restore process is
      still manual** (not yet documented/scripted): a real incident would need `mysql -u root -p <dbname> <
      backend/backups/<file>.sql` run by hand — a documented/rehearsed restore runbook is still a gap.
- [ ] **Data retention policy** for the Audit Log (currently immutable/unbounded — §5.4 flags "configurable
      retention" as still TODO)
- [ ] Secrets hygiene: `backend/.env` currently has live AWS keys and DB password committed to the working
      tree — confirm these are rotated/not the ones actually used in production, and that `.env` is
      git-ignored

## 2. Testing — comprehensive coverage + CI added 2026-07-07

- [x] ~~Zero automated tests exist~~ Backend: Jest + Supertest set up (`backend/tests/`, `npm test`),
      running against a dedicated, safety-guarded test database (dropped/rebuilt from the current models on
      every run — see `backend/README.md` § Testing). Frontend: Vitest set up (`frontend/`, `npm test`).
  - [x] **39 backend test suites / 169 tests**, covering essentially every route module: the original
        maker-checker/RBAC/roll-up suites, plus blocks, projects, departments, registers, comments, risks,
        workflows, contracts, compliance, correspondence, decisions, operations-updates, licences, documents
        (confidentiality access control), insurance, environmental permits, NDAs + data-room grants, vendor
        payment aging, local content, HSE (incidents + exposure hours + TRIR/LTIF), auth, notifications,
        notification rules, reports catalogue, RBAC admin, org chart, admin/user management, the audit log,
        the email service (Email notification channel), the DB backup service, licence phase-countdown
        transitions, and per-module notify permission + department-scoped notification resolution.
  - [x] **Frontend: 4 test files / 21 tests** — `lib/date.test.ts` (pure functions) plus component tests for
        `Button`, `Badge`, `Progress` (React Testing Library + jsdom via `vitest.config.ts`, merged with the
        real `vite.config.ts` so aliases/plugins match).
  - [x] **CI pipeline** — `.github/workflows/ci.yml`: a `backend-tests` job (MySQL 8 service container,
        `npm test` against a throwaway `planetonedashboard_test` DB) and a `frontend-tests` job (`npm test` +
        `tsc --noEmit`), both running on push/PR to main/master. ESLint is intentionally NOT run in CI yet —
        there's no `.eslintrc` in the repo at all (pre-existing gap, `npm run lint` fails immediately with
        "couldn't find a configuration file", unrelated to this work).
  - **Deliberately not covered**: `POST /api/documents` (file upload) isn't exercised end-to-end since it
        performs a real S3 upload via `aws-sdk` — no AWS credentials in the test env, and tests shouldn't hit
        a real bucket. The confidentiality/ownership access-control logic on documents *is* covered, via
        fixtures created directly through the model instead of the upload route.
  - **Side effects of setting this up (worth knowing about):**
    - Refactored `backend/server.js` into `backend/app.js` (exports the configured Express `app`, no side
      effects) + a thin `server.js` that calls `startServer()`/`app.listen()` — required to make the app
      testable via Supertest without starting a real listener/scheduler. Behavior is unchanged; verified by
      restarting the real dev server after the split.
    - Found and fixed a real (if low-impact) bug while building this: the `Licence` model was never in the
      "register all models" list in `server.js`/`app.js` (only ever loaded transitively via
      `routes/licences.js`), so a truly from-scratch `sequelize.sync()` couldn't create the `licences` table
      other tables reference. Harmless for the real, already-existing database, but fatal for building a
      fresh one from nothing — which is exactly what the test bootstrap does. Now explicitly registered.
    - Added a `GET /api/health` endpoint (was a flagged gap in §6 below) — now used as the test suite's smoke test too.
    - `tests/helpers/seedRole.js` must set `isSystem: true` for Admin/Manager/User when seeding roles for a
      test — the real app's `startServer()` seeding does this, but tests bypass that seeding (deliberately,
      to keep `app.js` side-effect-free), so business rules that branch on `role.isSystem` (e.g. "system
      roles cannot be renamed") silently no-op'd until this was fixed.
    - Any FK-constrained column pointing at `users` (there are many: `Task.assignedToId`,
      `BudgetLine.revisionRequestedById`, `ForexTransaction.requestedById`, `Report.createdBy`,
      `HseExposureRecord.recordedById`, etc.) needs a *real* seeded `User` row — InnoDB validates the FK at
      insert time even though the column itself is nullable. Always use `tests/helpers/seedUser.js`'s
      `makeUser()` and put its real `.id` in the JWT, never an arbitrary made-up number.
- [ ] No load/performance testing — spec targets <3s page loads at 100 concurrent users, and <3s Audit Log
      queries at 1M+ rows; neither has been measured

## 3. Known functional bugs — ✅ fixed 2026-07-07

- [x] ~~**Activities Kanban view**: "To Do" and "In Progress" columns are permanently empty.~~ Fixed —
      `frontend/src/app/pages/Activities.tsx`'s Kanban columns now filter on the real `Activity.status`
      enum values (`Active`/`Inactive`/`Completed`, matching `backend/models/Activity.js` and the create/edit
      form) instead of `"To Do"`/`"In Progress"` strings that no code path ever set. Also fixed
      `getStatusColor()`, which previously fell through to the same default badge colour for both `Active`
      and `Inactive` since neither was a handled case.
- [x] ~~**`WorkflowDetail.tsx`** sidebar still shows a hardcoded fake "Related Documents" list.~~ Fixed —
      now fetches real documents via `documentsApi.getByActivityId()` for AFE/Finance-mapped workflow items
      (the only real FK available — Workflow/Finance have no direct document link in the schema), showing an
      honest "No linked documents." state otherwise rather than fabricated filenames. Also fixed the adjacent
      hardcoded "Days Remaining: 4" stat in the same file to compute from the real `dueDate`.

## 4. Largest incomplete Phase 1 requirement — ✅ closed 2026-07-10

- [x] ~~**§5.9 Licence Phase Countdown** — mostly unbuilt~~ Fixed 2026-07-10 — all 5 sub-items done:
  - [x] Phase enum (Exploration / Extension / Appraisal / Development / Production) — `Licence.phase`
  - [x] Phase start/end dates + minimum work obligation fields — `phaseStartDate`/`phaseEndDate`/`minWorkObligation`
  - [x] Daily-recalculated countdown with 180/90/30-day banners — a second `NotificationRule`
        (`dateField: 'phaseEndDate'`) on the existing Licence module, no engine changes needed
  - [x] Escalation of <30-day items to the Executive Dashboard — `chairmanDeadlines`/`licenceDeadlines`/
        `computeMilestones()` in `ExecutiveDashboard.tsx` all surface phase-end countdowns alongside expiry
  - [x] Controlled, audited phase-transition sign-off workflow — `POST /api/licences/:id/transition-phase`
        (mandatory comment + confirmation, records who/when); a plain `PUT` rejects direct phase changes

  **All 15 of 15 Phase 1 modules from the requirements doc are now fully implemented** — see
  `REQUIREMENTS_GAP_CHECKLIST.md`'s Executive Summary.

## 5. Other functional gaps — 🟡

- [x] ~~Task → Project completion roll-up~~ ✅ done (2026-07-07), then **corrected same day** — `Project.completion` is now automatically recalculated from the average progress of a project's top-level Activities plus any directly-linked Tasks (`backend/services/taskStatusSync.js`). The first version only pooled Tasks, which left real projects stuck at 0% since real tasks are almost never linked to a Project/Activity while Activities are the actual populated work-breakdown structure — found via a user report that the % wasn't reflecting on the Projects table / Executive Dashboard. Also hooked into `routes/activities.js` create/update/delete, and a one-time backfill was run against the live database.
- [x] ~~Contract expiry, Correspondence overdue-responses, and Compliance due dates surfaced on Chairman View~~ ✅ confirmed already live in `ExecutiveDashboard.tsx`'s Block A "Upcoming Deadlines" widget (this item was stale in the requirements checklist, not an actual gap)
- [x] ~~Operations Update auto-surfacing on `BlockDetail.tsx`~~ ✅ done (2026-07-07) — Overview tab now shows the 3 latest updates for the block, with a filtered link through to `OperationsUpdates.tsx` (which gained a URL-synced block filter)
- [x] ~~`documents`/`comments`/`tasks`/`licences`/`finance` routes folded into the RBAC matrix~~ ✅ done (2026-07-07) — new `documents.manage`/`comments.manage`/`tasks.manage`/`licences.manage`/`finance.manage` permissions now gate all mutations on those 5 routes at the `server.js` mount level, matching the other 18 modules. Legacy inline `managerMiddleware`/`adminMiddleware` checks removed from `licences.js`. Ownership-level checks (document owner-or-Admin delete, own-comment-or-Admin edit, task-owner confirms 100%) were kept as a complementary layer on top. `defaultMatrix` extended additively so day-to-day roles keep access; `Chairman/Board` and `External Partner` (explicitly read-only roles) correctly lose the blanket mutate access the old `authMiddleware`-only gate accidentally gave them. Verified via direct HTTP tests (no token → 401, read-only role → 403, Manager → 201).
- [x] ~~Notification engine is **in-app only** — no email/SMS transport~~ Email ✅ done 2026-07-07
      (`backend/services/emailService.js`, nodemailer, best-effort/never blocks in-app delivery). SMS is
      still not wired (no SMS provider integration exists anywhere in the codebase — would need a new
      provider account/API, out of scope until requested).
- [x] ~~Notification recipients for ownerless records always broadcast to every Admin/Manager org-wide~~
      Fixed 2026-07-10 — added a `<module>.notify` RBAC permission per module (separate from `.manage`,
      auto-derived onto every role that already has the matching manage permission) plus
      `NotificationRule.departmentIds` (JSON array) to optionally restrict a rule's fallback broadcast to
      one or more specific departments. Configurable via `Admin.tsx`'s RBAC Matrix tab (the new `.notify`
      permissions just show up there automatically) and its new "Notification Rules" tab (department chips).
- [ ] Chairman View export is browser print-to-PDF only — no native PDF/PowerPoint generation, no scheduled
      email digest, no versioned archive
- [ ] OCR + full-text document search, and recoverable soft-delete for documents — both explicitly deferred

## 6. Operational readiness — ✅ done 2026-07-16

- [x] ~~No process manager for local/production runtime (currently raw `node server.js` / `vite` in a
      terminal — a crashed terminal takes the whole app down, as happened during this project).~~ Fixed —
      added [`ecosystem.config.js`](ecosystem.config.js) (PM2 config) running the backend (`node server.js`)
      and the frontend (`vite preview`, serving the built `dist/`) as auto-restarting, crash-resilient
      processes instead of raw terminal processes. Requires `npm install -g pm2` and, for the frontend, a
      prior `npm run build`. Start/stop/inspect via `npm run pm2:start` / `pm2:stop` / `pm2:restart` /
      `pm2:status` / `pm2:logs` from the repo root, or the `pm2` CLI directly. `pm2 save && pm2 startup`
      persists the process list across reboots (see comments in `ecosystem.config.js` for the Windows
      equivalent, `pm2-windows-startup`). A Windows Service wrapper remains a viable alternative if PM2
      itself is not desired in a given environment.
- [x] ~~Frontend `node_modules` has been observed getting into a partially-installed state; confirm a clean
      `npm install` (workspace root, not per-package) is part of the deployment/build process.~~ Fixed —
      added [`scripts/clean-install.js`](scripts/clean-install.js) (`npm run install:clean` from the repo
      root), which removes every `node_modules`/`package-lock.json` (root, `backend/`, `frontend/`) and
      reinstalls each from scratch. Recommend running this as (or before) the deployment/build step rather
      than relying on an incremental `npm install`.
- [x] ~~No health-check endpoint~~ ✅ done 2026-07-07 — `GET /api/health` added to `backend/app.js`
      (returns `{ status: 'ok' }`), also used as the automated test suite's smoke test.

---

## Suggested order of attack

1. ~~Automated tests for the financial maker-checker flows (Budget revisions, AFE, Forex) — highest risk of
   silent regressions.~~ ✅ done 2026-07-07 (part of the broader test suite build-out, §2).
2. Security basics: rotate/secure secrets, TLS, MFA for privileged roles.
3. ~~Backup/DR plan + retention policy.~~ Backup/DR ✅ done 2026-07-07 (§1); Audit Log retention policy still open.
4. Fix the two known functional bugs (Activities Kanban, WorkflowDetail hardcoded list) — small, contained.
5. ~~Licence Phase Countdown (§5.9) — the one substantial missing Phase 1 feature.~~ ✅ done 2026-07-10.
6. ~~Email/SMS notification transport.~~ Email ✅ done 2026-07-07; SMS still open (no provider integration).
7. Everything else in §5/§6 above, roughly in the listed order.
