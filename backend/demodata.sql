-- =============================================================================
-- demodata.sql — Complete, standalone demo dataset for the EnQuest PMS
-- (DOS-PlanetOneProjectTrackingReact) application.
-- =============================================================================
--
-- WHAT THIS IS
--   A hand-written, realistic Ghana-upstream-oil-and-gas demo dataset that
--   populates every business table in the schema, touching every field
--   coded in each Sequelize model (backend/models/*.js), including nullable
--   fields left NULL on some rows, JSON/TEXT array fields, self-referencing
--   foreign keys (org chart, sub-activities, subtasks, document versioning,
--   supplementary AFEs), and every ENUM value used somewhere across the
--   dataset.
--
-- WHAT THIS IS NOT
--   - NOT a migration. It intentionally lives outside backend/migrations/
--     so it is never auto-applied or tracked by scripts/run-migrations.js.
--   - Does NOT seed `roles`, `permissions`, `role_permissions` or
--     `notification_rules` — backend/server.js already seeds those four
--     tables idempotently (via findOrCreate) on every server startup, so
--     duplicating them here would be redundant. Just start the backend
--     once and they will be populated automatically.
--
-- PREREQUISITES
--   1. The schema must already exist — run `npm run migrate` (and/or let
--      Sequelize's sequelize.sync() in server.js create tables) first.
--   2. Start the backend at least once so the RBAC/notification-rule seed
--      in server.js has run (see note above).
--
-- HOW TO APPLY
--   From a MySQL/MariaDB client against the app database, e.g.:
--     mysql -u root -p PlanetOneDashboard < backend/demodata.sql
--   or, if using the bundled docker-compose MariaDB container:
--     docker exec -i planetone-mysql mysql -uroot -pYash1234 PlanetOneDashboard < backend/demodata.sql
--
--   This file TRUNCATEs the business tables it seeds before inserting, so
--   it is safe to re-run repeatedly for a clean demo reset. It does NOT
--   touch roles/permissions/role_permissions/notification_rules/users'
--   auth session state, etc.
--
-- DEMO LOGIN
--   Every seeded user shares the password:  Demo@1234
--   (bcrypt hash below was generated with bcryptjs, cost factor 10)
--   Pick any email below, e.g. ceo@enquest-demo.com / Demo@1234
--
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- Clear existing demo data (safe to re-run). RBAC/notification_rules tables
-- are intentionally NOT truncated here — see header note above.
-- -----------------------------------------------------------------------------
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `reports`;
TRUNCATE TABLE `registers`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `workflows`;
TRUNCATE TABLE `finances`;
TRUNCATE TABLE `budget_lines`;
TRUNCATE TABLE `operations_updates`;
TRUNCATE TABLE `decisions`;
TRUNCATE TABLE `correspondences`;
TRUNCATE TABLE `compliance_obligations`;
TRUNCATE TABLE `contracts`;
TRUNCATE TABLE `licences`;
TRUNCATE TABLE `risks`;
TRUNCATE TABLE `documents`;
TRUNCATE TABLE `comments`;
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `activities`;
TRUNCATE TABLE `projects`;
TRUNCATE TABLE `blocks`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `departments`;

-- =============================================================================
-- 1. DEPARTMENTS
-- =============================================================================
INSERT INTO `departments` (`id`, `name`, `description`) VALUES
(1, 'Operations', 'Field operations, drilling, project delivery and asset management'),
(2, 'Finance & Accounts', 'Budgeting, AFE tracking, payments and financial reporting'),
(3, 'Legal & Compliance', 'Contracts, statutory compliance and regulatory correspondence'),
(4, 'HSE', 'Health, safety and environmental oversight'),
(5, 'Executive Management', 'Chairman, CEO and executive leadership');

-- =============================================================================
-- 2. USERS  (password for ALL demo users: "Demo@1234")
-- =============================================================================
INSERT INTO `users`
  (`id`, `username`, `email`, `password`, `firstName`, `lastName`, `departmentId`,
   `employeeId`, `designation`, `reportingManagerId`, `phone`, `photoUrl`,
   `qualifications`, `startDate`, `role`, `active`, `createdAt`, `updatedAt`)
VALUES
(1, 'admin', 'admin@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'System', 'Administrator', 5, 'EMP-0001', 'System Administrator', NULL, '+233 20 000 0001', NULL,
   'BSc Information Systems', '2019-01-07', 'Admin', 1, NOW(), NOW()),
(2, 'j.mensah', 'ceo@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'James', 'Mensah', 5, 'EMP-0002', 'Country Manager & CEO', NULL, '+233 20 000 0002', NULL,
   'MBA, MSc Petroleum Economics', '2015-03-10', 'CEO/Country Manager', 1, NOW(), NOW()),
(3, 'a.owusu', 'chairman@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Akosua', 'Owusu', 5, 'EMP-0003', 'Chairman of the Board', NULL, '+233 20 000 0003', NULL,
   'MSc Petroleum Engineering, FCA', '2014-01-01', 'Chairman/Board', 1, NOW(), NOW()),
(4, 'k.appiah', 'ops.manager@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Kwame', 'Appiah', 1, 'EMP-0004', 'Project & Operations Manager', 2, '+233 20 000 0004', NULL,
   'BSc Petroleum Engineering', '2017-06-01', 'Project/Operations Manager', 1, NOW(), NOW()),
(5, 'e.boateng', 'legal@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Ewurabena', 'Boateng', 3, 'EMP-0005', 'Legal & Compliance Officer', 2, '+233 20 000 0005', NULL,
   'LLB, BL', '2018-09-15', 'Legal/Compliance Officer', 1, NOW(), NOW()),
(6, 'n.asante', 'finance@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Nana', 'Asante', 2, 'EMP-0006', 'Finance & Accounts Lead', 2, '+233 20 000 0006', NULL,
   'ACCA, BSc Accounting', '2016-02-20', 'Finance/Accounts', 1, NOW(), NOW()),
(7, 'd.kufuor', 'hse@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Doris', 'Kufuor', 4, 'EMP-0007', 'HSE Officer', 4, '+233 20 000 0007', NULL,
   'NEBOSH IGC, BSc Environmental Science', '2019-11-01', 'HSE Officer', 1, NOW(), NOW()),
(8, 's.darko', 'geologist@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Samuel', 'Darko', 1, 'EMP-0008', 'Senior Geologist / Drilling Engineer', 4, '+233 20 000 0008', NULL,
   'MSc Geology', '2018-04-12', 'Geologist/Drilling Engineer', 1, NOW(), NOW()),
(9, 't.agyeman', 'staff1@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Tawiah', 'Agyeman', 1, 'EMP-0009', 'Operations Officer', 4, '+233 20 000 0009', NULL,
   'BSc Petroleum Engineering', '2021-01-18', 'Team Member/Staff', 1, NOW(), NOW()),
(10, 'p.addo', 'staff2@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Priscilla', 'Addo', 2, 'EMP-0010', 'Accounts Officer', 6, '+233 20 000 0010', NULL,
   'BCom Accounting', '2020-07-01', 'Team Member/Staff', 1, NOW(), NOW()),
(11, 'r.johnson', 'partner@jvpartner-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Robert', 'Johnson', NULL, 'EMP-EXT-01', 'JV Partner Representative', NULL, '+1 555 010 1234', NULL,
   'MBA', '2020-01-01', 'External Partner', 1, NOW(), NOW()),
(12, 'legacy.manager', 'legacy.manager@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Legacy', 'Manager', 1, 'EMP-0011', 'Operations Manager (Legacy)', 2, '+233 20 000 0011', NULL,
   'BSc Engineering', '2016-05-05', 'Manager', 1, NOW(), NOW()),
(13, 'legacy.user', 'legacy.user@enquest-demo.com', '$2a$10$VbOH7Q3KDQvjze7E6kznNuqdUPf0e8GPMHhf0bd6OePmH3DPBUGou',
   'Legacy', 'User', 1, 'EMP-0012', 'Field Technician (Offboarded)', 4, '+233 20 000 0012', NULL,
   'HND Mechanical Engineering', '2015-08-20', 'User', 0, NOW(), NOW());

-- =============================================================================
-- 3. BLOCKS
-- =============================================================================
INSERT INTO `blocks`
  (`id`, `name`, `description`, `status`, `operator`, `workingInterest`, `area`, `location`, `createdAt`, `updatedAt`)
VALUES
(1, 'West Cape Three Points (WCTP)', 'Offshore exploration and production block in the Western Basin, home of the Jubilee field.',
   'Active', 'EnQuest Ghana Ltd', '30%', '540 km²', 'Western Region, Offshore Ghana', NOW(), NOW()),
(2, 'Deepwater Tano (DWT)', 'Deepwater block with active FPSO production.',
   'Active', 'EnQuest Ghana Ltd', '17.5%', '1,100 km²', 'Tano Basin, Offshore Ghana', NOW(), NOW()),
(3, 'South Tano', 'Appraisal-stage offshore block.',
   'Active', 'EnQuest Ghana Ltd', '45%', '620 km²', 'Tano Basin, Offshore Ghana', NOW(), NOW()),
(4, 'Cape Three Points Onshore', 'Onshore block; exploration phase concluded, decommissioning complete.',
   'Completed', 'EnQuest Ghana Ltd', '25%', '210 km²', 'Western Region, Onshore Ghana', NOW(), NOW());

-- =============================================================================
-- 4. PROJECTS
-- =============================================================================
INSERT INTO `projects`
  (`id`, `name`, `description`, `status`, `blockId`, `block`, `manager`, `budget`, `spent`, `completion`,
   `startDate`, `endDate`, `createdAt`, `updatedAt`)
VALUES
(1, 'Jubilee Phase 3 Development', 'Phase 3 infill drilling and well-testing programme for the Jubilee field.',
   'In Progress', 1, 'West Cape Three Points (WCTP)', 'Kwame Appiah', 85000000.00, 52000000.00, 61,
   '2025-01-15', '2027-03-31', NOW(), NOW()),
(2, 'WCTP 2026 Infill Drilling Campaign', 'Additional infill wells to sustain WCTP plateau production.',
   'Active', 1, 'West Cape Three Points (WCTP)', 'Kwame Appiah', 32000000.00, 9000000.00, 28,
   '2026-02-01', '2026-12-15', NOW(), NOW()),
(3, 'Tano FPSO Life Extension', 'Life-extension works on the Deepwater Tano FPSO facility.',
   'In Progress', 2, 'Deepwater Tano (DWT)', 'Samuel Darko', 47000000.00, 30500000.00, 65,
   '2024-09-01', '2026-09-30', NOW(), NOW()),
(4, 'Deepwater Tano Subsea Tieback', 'New subsea tieback development to the Tano FPSO.',
   'Planning', 2, 'Deepwater Tano (DWT)', 'Kwame Appiah', 120000000.00, 4500000.00, 4,
   '2026-05-01', '2028-06-30', NOW(), NOW()),
(5, 'South Tano Appraisal Well ST-04', 'Appraisal drilling to confirm South Tano reserves.',
   'On Hold', 3, 'South Tano', 'Samuel Darko', 18000000.00, 6200000.00, 34,
   '2025-06-01', '2026-10-31', NOW(), NOW()),
(6, 'South Tano 3D Seismic Reprocessing', 'Reprocessing of legacy 3D seismic to refine the appraisal model.',
   'Completed', 3, 'South Tano', 'Samuel Darko', 5200000.00, 5100000.00, 100,
   '2024-01-10', '2024-11-30', NOW(), NOW()),
(7, 'CTP Onshore Site Decommissioning', 'Decommissioning and site restoration of the CTP onshore facility.',
   'Completed', 4, 'Cape Three Points Onshore', 'Kwame Appiah', 7500000.00, 7350000.00, 100,
   '2023-02-01', '2024-12-01', NOW(), NOW()),
(8, 'Community Local Content Pilot', 'Pilot local-content training programme, discontinued.',
   'Cancelled', 1, 'West Cape Three Points (WCTP)', 'Kwame Appiah', 1200000.00, 300000.00, 15,
   '2025-03-01', '2025-09-30', NOW(), NOW());

-- =============================================================================
-- 5. ACTIVITIES  (self-referencing parentActivityId — activities 4 & 5 are
--    sub-activities of activity 3)
-- =============================================================================
INSERT INTO `activities`
  (`id`, `name`, `description`, `status`, `parentActivityId`, `projectId`, `priority`, `linkedMilestone`,
   `assignedTo`, `dueDate`, `progress`, `plannedStartDate`, `plannedEndDate`, `actualStartDate`, `actualEndDate`,
   `plannedCost`, `actualCost`, `order`, `createdAt`, `updatedAt`)
VALUES
(1, 'Drilling Programme Approval', 'Regulatory and internal approval of the JUB-P3-07 drilling programme.',
   'Completed', NULL, 1, 'High', 'Drilling Commencement', 'Kwame Appiah', '2025-11-01', 100,
   '2025-09-01', '2025-11-01', '2025-09-05', '2025-10-28', 150000.00, 142000.00, 1, NOW(), NOW()),
(2, 'Rig Mobilisation', 'Mobilisation of the Atwood Explorer rig to WCTP.',
   'Completed', NULL, 1, 'Critical', 'Drilling Commencement', 'Samuel Darko', '2025-11-15', 100,
   '2025-10-01', '2025-11-15', '2025-10-10', '2025-11-12', 2200000.00, 2350000.00, 2, NOW(), NOW()),
(3, 'Well Testing Phase', 'Overall well-testing phase for JUB-P3-07.',
   'Active', NULL, 1, 'High', 'First Oil', 'Samuel Darko', '2026-08-01', 45,
   '2026-05-01', '2026-08-01', '2026-05-10', NULL, 900000.00, 410000.00, 3, NOW(), NOW()),
(4, 'Flow Test - JUB-P3-07', 'Multi-rate flow test to establish deliverability.',
   'Active', 3, 1, 'High', NULL, 'Samuel Darko', '2026-07-20', 60,
   '2026-06-01', '2026-07-20', '2026-06-03', NULL, 300000.00, 180000.00, 1, NOW(), NOW()),
(5, 'Pressure Build-Up Test', 'Extended PBU test following the flow test.',
   'Active', 3, 1, 'Medium', NULL, 'Samuel Darko', '2026-08-01', 20,
   '2026-07-15', '2026-08-01', NULL, NULL, 150000.00, 20000.00, 2, NOW(), NOW()),
(6, 'Infill Well WCTP-14 Design', 'Well design and engineering for the WCTP-14 infill well.',
   'Active', NULL, 2, 'High', 'Spud Date', 'Kwame Appiah', '2026-09-01', 35,
   '2026-03-01', '2026-09-01', NULL, NULL, 500000.00, 175000.00, 1, NOW(), NOW()),
(7, 'Long-lead Equipment Procurement', 'Procurement of long-lead subsea and wellhead equipment.',
   'Active', NULL, 2, 'Critical', 'Spud Date', 'Nana Asante', '2026-08-15', 55,
   '2026-02-15', '2026-08-15', NULL, NULL, 4200000.00, 2300000.00, 2, NOW(), NOW()),
(8, 'FPSO Topsides Inspection', 'Full topsides integrity inspection.',
   'Completed', NULL, 3, 'High', NULL, 'Samuel Darko', '2025-12-01', 100,
   '2025-10-01', '2025-12-01', '2025-10-02', '2025-11-28', 650000.00, 610000.00, 1, NOW(), NOW()),
(9, 'FPSO Turret Bearing Replacement', 'Replacement of the main turret bearing assembly.',
   'Active', NULL, 3, 'Critical', 'Life Extension Sign-off', 'Samuel Darko', '2026-10-15', 30,
   '2026-04-01', '2026-10-15', NULL, NULL, 8000000.00, 2100000.00, 2, NOW(), NOW()),
(10, 'Subsea Tieback FEED Study', 'Front-end engineering design study for the subsea tieback.',
   'Active', NULL, 4, 'Medium', NULL, 'Kwame Appiah', '2026-11-30', 10,
   '2026-05-01', '2026-11-30', NULL, NULL, 3000000.00, 350000.00, 1, NOW(), NOW()),
(11, 'ST-04 Environmental Permit Application', 'EPA permit application for the ST-04 appraisal well.',
   'Inactive', NULL, 5, 'Medium', NULL, 'Doris Kufuor', '2026-06-01', 40,
   '2025-09-01', '2026-06-01', NULL, NULL, 120000.00, 65000.00, 1, NOW(), NOW()),
(12, '3D Seismic Reprocessing QC', 'Quality control review of the reprocessed seismic volume.',
   'Completed', NULL, 6, 'Low', NULL, 'Samuel Darko', '2024-11-15', 100,
   '2024-09-01', '2024-11-15', '2024-09-01', '2024-11-10', 400000.00, 385000.00, 1, NOW(), NOW()),
(13, 'CTP Site Restoration Works', 'Physical restoration works at the CTP onshore site.',
   'Completed', NULL, 7, 'High', NULL, 'Kwame Appiah', '2024-12-01', 100,
   '2023-06-01', '2024-12-01', '2023-06-15', '2024-11-20', 6800000.00, 6700000.00, 1, NOW(), NOW()),
(14, 'Local Content Training Pilot', 'Pilot vocational training programme for local content development.',
   'Inactive', NULL, 8, 'Low', NULL, 'Tawiah Agyeman', '2025-09-01', 15,
   '2025-03-01', '2025-09-30', NULL, NULL, 200000.00, 45000.00, 1, NOW(), NOW());

-- =============================================================================
-- 6. TASKS  (self-referencing parentTaskId — tasks 4 & 5 are subtasks of 3;
--    dependencyTaskIds is a JSON array of Task IDs)
-- =============================================================================
INSERT INTO `tasks`
  (`id`, `title`, `description`, `status`, `priority`, `startDate`, `dueDate`, `progress`,
   `parentTaskId`, `dependencyTaskIds`, `assignedToId`, `assignedById`, `relatedType`, `relatedId`,
   `createdAt`, `updatedAt`)
VALUES
(1, 'Review flow test results', 'Analyse flow-test rates against pre-drill forecast.',
   'Completed', 'High', '2026-06-01', '2026-06-10', 100, NULL, NULL, 8, 4, 'Activity', 4, NOW(), NOW()),
(2, 'Prepare pressure build-up test procedure', 'Draft the PBU test procedure and safety case.',
   'In Progress', 'Medium', '2026-07-01', '2026-07-18', 55, NULL, '[1]', 8, 4, 'Activity', 5, NOW(), NOW()),
(3, 'Draft long-lead procurement RFQ', 'Prepare RFQ package for long-lead subsea equipment.',
   'Overdue', 'Critical', '2026-05-01', '2026-06-20', 40, NULL, NULL, 9, 4, 'Activity', 7, NOW(), NOW()),
(4, 'Obtain vendor quotes', 'Collect and compare quotes from three approved vendors.',
   'In Progress', 'High', '2026-06-01', '2026-06-25', 70, 3, NULL, 9, 4, 'Activity', 7, NOW(), NOW()),
(5, 'Legal review of RFQ terms', 'Legal & Compliance review of RFQ commercial terms.',
   'Not Started', 'Medium', NULL, '2026-07-10', 0, 3, NULL, 5, 4, 'Activity', 7, NOW(), NOW()),
(6, 'Approve FPSO turret bearing budget line', 'Finance committee approval of the turret bearing AFE.',
   'Completed', 'Critical', '2026-03-01', '2026-04-15', 100, NULL, NULL, 6, 2, 'Activity', 9, NOW(), NOW()),
(7, 'Submit ST-04 EPA permit documents', 'Submit supplementary biodiversity survey data to EPA.',
   'Blocked', 'High', '2026-05-01', '2026-08-01', 25, NULL, NULL, 7, 4, 'Activity', 11, NOW(), NOW()),
(8, 'Chase JV partner sign-off on FEED study', 'Follow up with JV partner representative for FEED sign-off.',
   'In Progress', 'Medium', '2026-06-01', '2026-11-15', 20, NULL, NULL, 4, 2, 'Activity', 10, NOW(), NOW()),
(9, 'Complete decommissioning close-out report', 'Finalise and file the CTP decommissioning close-out report.',
   'Completed', 'Medium', '2024-11-01', '2024-12-15', 100, NULL, NULL, 9, 4, 'Activity', 13, NOW(), NOW()),
(10, 'Local content pilot wind-down report', 'Prepare wind-down report for the cancelled pilot programme.',
   'Not Started', 'Low', NULL, '2025-10-01', 0, NULL, NULL, 9, 4, 'Activity', 14, NOW(), NOW()),
(11, 'Action Required: AFE Approval Workflow (Executive Management)', 'Executive approval required for AFE supplement workflow.',
   'In Progress', 'High', '2026-05-28', '2026-07-15', 10, NULL, NULL, 6, NULL, 'Workflow', 1, NOW(), NOW()),
(12, 'General onboarding checklist - Doris Kufuor', 'HR/Admin onboarding checklist completion.',
   'Completed', 'Low', '2019-10-15', '2019-11-15', 100, NULL, NULL, 4, 1, 'General', NULL, NOW(), NOW());

-- =============================================================================
-- 7. COMMENTS  (exactly one of activityId / taskId set per row)
-- =============================================================================
INSERT INTO `comments`
  (`id`, `content`, `activityId`, `taskId`, `userId`, `departmentId`, `createdAt`, `updatedAt`)
VALUES
(1, 'Flow test rates exceeded forecast by 12% — good result.', 4, NULL, 8, 1, NOW(), NOW()),
(2, 'Please expedite vendor quotes, rig slot at risk if RFQ slips further.', NULL, 4, 4, 1, NOW(), NOW()),
(3, 'Legal terms reviewed, awaiting redlines from counterparty.', NULL, 5, 5, 3, NOW(), NOW()),
(4, 'Budget line approved at Finance committee meeting.', 9, NULL, 6, 2, NOW(), NOW()),
(5, 'EPA has requested additional biodiversity survey data before proceeding.', 11, NULL, 7, 4, NOW(), NOW()),
(6, 'Critical: rig contract signature required by Friday to avoid penalty.', NULL, 3, 4, 1, NOW(), NOW());

-- =============================================================================
-- 8. DOCUMENTS  (documents 1→2→3 form a version chain: root=1, v2=Superseded,
--    v3=Final; tags/activityIds/allowedRoles are JSON stored as TEXT)
-- =============================================================================
INSERT INTO `documents`
  (`id`, `title`, `content`, `author`, `activityId`, `activityIds`, `filename`, `s3Key`, `mimeType`, `size`,
   `rootDocumentId`, `versionNumber`, `projectId`, `licenceId`, `contractId`, `taskId`, `blockId`, `ownerId`,
   `category`, `tags`, `awaitingResponseFrom`, `responseDueDate`, `confidentialityLevel`, `allowedRoles`,
   `documentType`, `uploadDate`, `status`, `createdAt`, `updatedAt`)
VALUES
(1, 'WCTP Drilling Programme v1', 'Approved drilling programme for Jubilee Phase 3 well JUB-P3-07.',
   'Samuel Darko', 1, '[1,2]', 'WCTP-Drilling-Programme-v1.pdf',
   'west-cape-three-points/jubilee-phase-3-development/drilling-programme-approval/1725430000-WCTP-Drilling-Programme-v1.pdf',
   'application/pdf', 2456000, NULL, 1, 1, NULL, NULL, NULL, 1, 8,
   'Report', '["drilling","phase-3","approved"]', NULL, NULL, 'Internal', '[]',
   'Technical', '2025-09-04', 'Superseded', NOW(), NOW()),
(2, 'WCTP Drilling Programme v2', 'Revised programme incorporating geomechanics update.',
   'Samuel Darko', 1, '[1,2]', 'WCTP-Drilling-Programme-v2.pdf',
   'west-cape-three-points/jubilee-phase-3-development/drilling-programme-approval/1726790000-WCTP-Drilling-Programme-v2.pdf',
   'application/pdf', 2510000, 1, 2, 1, NULL, NULL, NULL, 1, 8,
   'Report', '["drilling","phase-3"]', NULL, NULL, 'Internal', '[]',
   'Technical', '2025-09-20', 'Superseded', NOW(), NOW()),
(3, 'WCTP Drilling Programme v3 (Final)', 'Final approved programme incorporating all regulator comments.',
   'Samuel Darko', 1, '[1,2]', 'WCTP-Drilling-Programme-v3-Final.pdf',
   'west-cape-three-points/jubilee-phase-3-development/drilling-programme-approval/1727990000-WCTP-Drilling-Programme-v3-Final.pdf',
   'application/pdf', 2544000, 1, 3, 1, NULL, NULL, NULL, 1, 8,
   'Report', '["drilling","phase-3","final"]', NULL, NULL, 'Internal', '[]',
   'Technical', '2025-10-01', 'Final', NOW(), NOW()),
(4, 'Jubilee Field Development Plan - HSE Annex', 'HSE annex to the field development plan.',
   'Doris Kufuor', NULL, NULL, 'HSE-Annex-FDP.docx',
   'west-cape-three-points/jubilee-phase-3-development/general/1722500000-HSE-Annex-FDP.docx',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 890000, NULL, 1, 1, NULL, NULL, NULL, 1, 7,
   'Report', '["hse","fdp"]', NULL, NULL, 'Confidential', '["Admin","HSE Officer","Project/Operations Manager"]',
   'HSE', '2025-08-01', 'Under Review', NOW(), NOW()),
(5, 'GNPC Notice - WCTP Work Programme Approval', 'GNPC notice approving the 2026 WCTP work programme and budget.',
   'Ewurabena Boateng', NULL, NULL, 'GNPC-Notice-WCTP-2026.pdf',
   'general/1736900000-GNPC-Notice-WCTP-2026.pdf', 'application/pdf', 340000, NULL, 1, NULL, NULL, NULL, NULL, 1, 5,
   'Notice', '["gnpc","regulatory"]', NULL, NULL, 'Public', '[]',
   'Legal', '2026-01-15', 'Final', NOW(), NOW()),
(6, 'Letter to Petroleum Commission - Extension Request', 'Formal letter requesting exploration licence extension.',
   'Ewurabena Boateng', NULL, NULL, 'PC-Extension-Request-Letter.pdf',
   'general/1748740000-PC-Extension-Request-Letter.pdf', 'application/pdf', 210000, NULL, 1, 1, NULL, NULL, NULL, 3, 5,
   'Letter', '["petroleum-commission","extension"]', 'Petroleum Commission', '2026-08-15', 'Internal', '[]',
   'Legal', '2026-06-01', 'Under Review', NOW(), NOW()),
(7, 'Rig Charter Agreement - Atwood Explorer', 'Executed rig charter agreement.',
   'Ewurabena Boateng', NULL, NULL, 'Rig-Charter-Atwood-Explorer.pdf',
   'general/1719800000-Rig-Charter-Atwood-Explorer.pdf', 'application/pdf', 1250000, NULL, 1, 1, NULL, 1, NULL, 1, 5,
   'Contract', '["rig","charter"]', NULL, NULL, 'Confidential', '["Admin","Legal/Compliance Officer","CEO/Country Manager"]',
   'Legal', '2025-07-01', 'Final', NOW(), NOW()),
(8, 'AFE Support Documentation - Turret Bearing Replacement', 'Cost breakdown supporting the turret bearing AFE.',
   'Nana Asante', NULL, NULL, 'AFE-Support-Turret-Bearing.xlsx',
   'general/1743500000-AFE-Support-Turret-Bearing.xlsx',
   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 178000, NULL, 1, 1, NULL, NULL, NULL, 2, 6,
   'Report', '["afe","finance"]', NULL, NULL, 'Internal', '[]',
   'Finance', '2026-04-01', 'Final', NOW(), NOW()),
(9, 'Licence Compliance Evidence - Royalty Payment Q2 2026', 'Payment confirmation evidence for Q2 royalty obligation.',
   'Nana Asante', NULL, NULL, 'Royalty-Payment-Evidence-Q2.pdf',
   'general/1751200000-Royalty-Payment-Evidence-Q2.pdf', 'application/pdf', 96000, NULL, 1, 1, 1, NULL, NULL, NULL, 6,
   'Report', '["royalty","evidence"]', NULL, NULL, 'Internal', '[]',
   'Finance', '2026-06-28', 'Final', NOW(), NOW()),
(10, 'Task Attachment - Vendor Quotes Comparison', 'Comparison spreadsheet of long-lead equipment vendor quotes.',
   'Tawiah Agyeman', NULL, NULL, 'Vendor-Quotes-Comparison.xlsx',
   'general/1750500000-Vendor-Quotes-Comparison.xlsx',
   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 64000, NULL, 1, NULL, NULL, NULL, 4, NULL, 9,
   'Other', '["procurement"]', NULL, NULL, 'Internal', '[]',
   'Report', '2026-06-20', 'Draft', NOW(), NOW()),
(11, 'South Tano Environmental Permit Draft', 'Draft EIA and permit application for ST-04.',
   'Doris Kufuor', NULL, NULL, 'ST04-EPA-Permit-Draft.pdf',
   'general/1746900000-ST04-EPA-Permit-Draft.pdf', 'application/pdf', 3120000, NULL, 1, NULL, NULL, NULL, NULL, 3, 7,
   'Notice', '["epa","permit"]', 'Environmental Protection Agency', '2026-07-25', 'Internal', '[]',
   'HSE', '2026-05-10', 'Under Review', NOW(), NOW()),
(12, 'CTP Decommissioning Close-Out Report', 'Final close-out report for the CTP onshore decommissioning project.',
   'Kwame Appiah', NULL, NULL, 'CTP-Decommissioning-CloseOut.pdf',
   'cape-three-points-onshore/ctp-onshore-site-decommissioning/general/1733400000-CTP-Decommissioning-CloseOut.pdf',
   'application/pdf', 1870000, NULL, 1, 7, NULL, NULL, NULL, 4, 4,
   'Report', '["decommissioning","closeout"]', NULL, NULL, 'Public', '[]',
   'Report', '2024-12-05', 'Final', NOW(), NOW());

-- =============================================================================
-- 9. RISKS
-- =============================================================================
INSERT INTO `risks`
  (`id`, `projectId`, `title`, `description`, `severity`, `probability`, `status`, `owner`, `mitigation`,
   `createdAt`, `updatedAt`)
VALUES
(1, 1, 'Rig availability delay', 'Contracted rig may be delayed due to prior campaign overrun.',
   'High', 'Medium', 'Active', 'Kwame Appiah', 'Secondary rig option identified with 45-day mobilisation.', NOW(), NOW()),
(2, 1, 'Well control incident', 'Potential well control event during flow testing.',
   'High', 'Low', 'Mitigated', 'Samuel Darko', 'Enhanced BOP testing and HSE oversight implemented.', NOW(), NOW()),
(3, 3, 'FPSO turret bearing failure', 'Bearing wear could force an unplanned shutdown.',
   'High', 'High', 'Active', 'Samuel Darko', 'Replacement programme underway; interim monitoring in place.', NOW(), NOW()),
(4, 4, 'Subsea tieback cost overrun', 'FEED estimate may increase due to steel price volatility.',
   'Medium', 'Medium', 'Active', 'Kwame Appiah', 'Locking in steel prices via forward contract under review.', NOW(), NOW()),
(5, 5, 'EPA permit delay', 'Permit approval could delay the appraisal well spud date.',
   'Medium', 'High', 'Active', 'Doris Kufuor', 'Weekly liaison meetings with EPA scheduled.', NOW(), NOW()),
(6, 2, 'Community relations dispute', 'Land access dispute with local community near the WCTP shore facility.',
   'Low', 'Low', 'Closed', 'Kwame Appiah', 'Resolved via community liaison committee agreement.', NOW(), NOW());

-- =============================================================================
-- 10. LICENCES  (blockIds is a JSON array of Block IDs stored as TEXT)
-- =============================================================================
INSERT INTO `licences`
  (`id`, `licenceNumber`, `licenceType`, `blockIds`, `issuedBy`, `startDate`, `expiryDate`, `status`, `notes`,
   `createdAt`, `updatedAt`)
VALUES
(1, 'PC-EXP-2021-014', 'Exploration', '[1]', 'Petroleum Commission of Ghana', '2021-08-01', '2026-08-20',
   'Active', 'First renewal period; extension application submitted 2026-06-01.', NOW(), NOW()),
(2, 'PC-PROD-2016-005', 'Production', '[2]', 'Petroleum Commission of Ghana', '2016-05-01', '2031-05-01',
   'Active', 'Production licence for the Tano FPSO field.', NOW(), NOW()),
(3, 'EPA-ENV-2024-102', 'Environmental', '[3]', 'Environmental Protection Agency', '2024-01-15', '2026-09-30',
   'Active', 'Environmental permit covering the South Tano appraisal drilling campaign.', NOW(), NOW()),
(4, 'PC-DRILL-2019-071', 'Drilling', '[1,4]', 'Petroleum Commission of Ghana', '2019-02-01', '2025-02-01',
   'Suspended', 'Drilling licence suspended pending renewal paperwork for CTP onshore.', NOW(), NOW());

-- =============================================================================
-- 11. CONTRACTS
-- =============================================================================
INSERT INTO `contracts`
  (`id`, `title`, `counterparty`, `contractType`, `blockId`, `effectiveDate`, `expiryDate`, `value`,
   `renewalNoticePeriodDays`, `autoRenew`, `owner`, `status`, `notes`, `createdAt`, `updatedAt`)
VALUES
(1, 'Rig Charter Agreement - Atwood Explorer', 'Atwood Oceanics', 'Rig', 1, '2025-06-01', '2026-08-01',
   45000000.00, 60, 0, 'Ewurabena Boateng', 'Active', 'Renewal negotiation ongoing for extension to Q4 2026.', NOW(), NOW()),
(2, 'FPSO O&M Services Agreement', 'MODEC Production Services', 'Service', 2, '2016-05-01', '2028-05-01',
   210000000.00, 180, 1, 'Nana Asante', 'Active', 'Long-term operations & maintenance contract for the Tano FPSO.', NOW(), NOW()),
(3, 'Joint Venture Agreement - WCTP Partners', 'GNPC Exploration & Production', 'JV', 1, '2014-01-01', NULL,
   0.00, NULL, 0, 'Ewurabena Boateng', 'Active', 'Governs the WCTP joint venture participation.', NOW(), NOW()),
(4, 'Subsea Equipment Supply Contract', 'TechnipFMC', 'Supply', 2, '2026-01-01', '2027-06-30',
   38000000.00, 90, 0, 'Kwame Appiah', 'Active', 'Supply of subsea trees and manifolds for the tieback project.', NOW(), NOW()),
(5, 'Legacy Catering Services Contract', 'Tropical Catering Services', 'Service', 4, '2018-01-01', '2024-12-31',
   1200000.00, 30, 0, 'Ewurabena Boateng', 'Expired', 'Not renewed following CTP onshore decommissioning.', NOW(), NOW());

-- =============================================================================
-- 12. COMPLIANCE OBLIGATIONS
-- =============================================================================
INSERT INTO `compliance_obligations`
  (`id`, `description`, `regulatoryBody`, `category`, `frequency`, `blockId`, `dueDate`, `amountDue`, `amountPaid`,
   `paymentDate`, `referenceNo`, `evidenceDocumentId`, `status`, `responsibleOfficer`, `createdAt`, `updatedAt`)
VALUES
(1, 'Q2 2026 Royalty Payment - WCTP', 'Ghana Revenue Authority', 'Royalty', 'Quarterly', 1, '2026-07-15',
   1250000.00, 0.00, NULL, NULL, NULL, 'Pending', 'Nana Asante', NOW(), NOW()),
(2, 'Annual Petroleum Income Tax Filing 2025', 'Ghana Revenue Authority', 'Tax', 'Annual', NULL, '2026-06-30',
   8400000.00, 8400000.00, '2026-06-25', 'GRA-PIT-2025-0092', 9, 'Paid', 'Nana Asante', NOW(), NOW()),
(3, 'Surface Rental Fee - CTP Onshore', 'Petroleum Commission', 'Licence Fee', 'Annual', 4, '2026-05-01',
   45000.00, 0.00, NULL, NULL, NULL, 'Overdue', 'Ewurabena Boateng', NOW(), NOW()),
(4, 'Q1 2026 Royalty Payment - Tano FPSO', 'Ghana Revenue Authority', 'Royalty', 'Quarterly', 2, '2026-04-15',
   3200000.00, 3200000.00, '2026-04-10', 'GRA-ROY-2026-Q1', NULL, 'Closed', 'Nana Asante', NOW(), NOW()),
(5, 'Environmental Monitoring Report Filing', 'Environmental Protection Agency', 'Filing', 'Quarterly', 3, '2026-07-31',
   0.00, 0.00, NULL, NULL, NULL, 'Pending', 'Doris Kufuor', NOW(), NOW()),
(6, 'GNPC Local Content Plan Filing 2026', 'GNPC', 'Filing', 'Annual', 1, '2026-03-31',
   0.00, 0.00, NULL, NULL, NULL, 'Overdue', 'Kwame Appiah', NOW(), NOW());

-- =============================================================================
-- 13. CORRESPONDENCES
-- =============================================================================
INSERT INTO `correspondences`
  (`id`, `direction`, `date`, `fromParty`, `toParty`, `regulator`, `subject`, `referenceNo`, `summary`,
   `blockId`, `awaitingResponse`, `responseDueDate`, `documentId`, `status`, `createdAt`, `updatedAt`)
VALUES
(1, 'Inbound', '2026-06-20', 'Petroleum Commission of Ghana', 'EnQuest Ghana Ltd', 'Petroleum Commission',
   'Request for WCTP Exploration Licence Extension Documentation', 'PC-2026-0456',
   'PC requests supplementary technical data to support the extension application.', 1, 1, '2026-07-20', 6, 'Open', NOW(), NOW()),
(2, 'Outbound', '2026-06-01', 'EnQuest Ghana Ltd', 'Petroleum Commission of Ghana', 'Petroleum Commission',
   'WCTP Exploration Licence Extension Request', 'EQ-OUT-2026-118',
   'Formal request for a 12-month extension of the exploration licence.', 1, 1, '2026-08-01', 6, 'Open', NOW(), NOW()),
(3, 'Inbound', '2025-11-05', 'GNPC', 'EnQuest Ghana Ltd', 'GNPC',
   'Approval of 2026 Work Programme and Budget', 'GNPC-2025-0871',
   'GNPC approves the submitted 2026 WCTP work programme and budget.', 1, 0, NULL, 5, 'Closed', NOW(), NOW()),
(4, 'Outbound', '2026-05-15', 'EnQuest Ghana Ltd', 'Environmental Protection Agency', 'EPA',
   'South Tano Appraisal Drilling - EIA Submission', 'EQ-OUT-2026-095',
   'Submission of the environmental impact assessment for the ST-04 appraisal well.', 3, 1, '2026-07-25', 11, 'Open', NOW(), NOW()),
(5, 'Inbound', '2026-04-10', 'Ghana Revenue Authority', 'EnQuest Ghana Ltd', 'Ghana Revenue Authority',
   'Q1 2026 Royalty Assessment Confirmation', 'GRA-2026-0334',
   'Confirmation of royalty assessment receipt for Q1 2026.', 2, 0, NULL, NULL, 'Closed', NOW(), NOW()),
(6, 'Outbound', '2026-01-20', 'EnQuest Ghana Ltd', 'Petroleum Commission of Ghana', 'Petroleum Commission',
   'CTP Onshore Drilling Licence Renewal Application', 'EQ-OUT-2026-011',
   'Application to renew the suspended drilling licence for CTP onshore.', 4, 1, '2026-07-10', NULL, 'Open', NOW(), NOW());

-- =============================================================================
-- 14. DECISIONS
-- =============================================================================
INSERT INTO `decisions`
  (`id`, `date`, `meetingContext`, `description`, `decisionMakers`, `rationale`, `linkedRiskId`, `linkedActivityId`,
   `linkedTaskId`, `status`, `createdAt`, `updatedAt`)
VALUES
(1, '2026-06-15', 'Executive Committee Meeting', 'Approved secondary rig contingency option for the WCTP campaign.',
   'James Mensah, Kwame Appiah', 'Mitigates the rig availability delay risk identified in the risk register.',
   1, 2, NULL, 'Closed', NOW(), NOW()),
(2, '2026-05-20', 'Board Meeting Q2 2026', 'Approved the FPSO turret bearing replacement AFE.',
   'Akosua Owusu, James Mensah', 'Bearing wear risk assessed as high probability of unplanned shutdown.',
   3, 9, 6, 'Closed', NOW(), NOW()),
(3, '2026-06-28', 'Operations Review', 'Deferred subsea tieback FEED contract award pending steel price review.',
   'Kwame Appiah', 'Cost overrun risk requires further commercial evaluation.',
   4, 10, NULL, 'In Progress', NOW(), NOW()),
(4, '2026-07-01', 'Legal & Compliance Review', 'Agreed to escalate the CTP drilling licence renewal directly with Petroleum Commission leadership.',
   'Ewurabena Boateng, James Mensah', 'Licence has been suspended for an extended period, risking asset value.',
   NULL, NULL, NULL, 'Open', NOW(), NOW());

-- =============================================================================
-- 15. OPERATIONS UPDATES  (attachmentDocumentIds is a JSON array stored as TEXT)
-- =============================================================================
INSERT INTO `operations_updates`
  (`id`, `date`, `blockId`, `wellName`, `author`, `summary`, `keyIssues`, `nextSteps`, `attachmentDocumentIds`,
   `createdAt`, `updatedAt`)
VALUES
(1, '2026-07-01', 1, 'JUB-P3-07', 'Samuel Darko',
   'Flow testing continuing on JUB-P3-07; rates tracking above forecast.',
   'Minor sand production observed; monitoring closely.',
   'Complete pressure build-up test by end of July.', '[1,3]', NOW(), NOW()),
(2, '2026-06-25', 2, NULL, 'Samuel Darko',
   'FPSO turret bearing replacement preparation on schedule.',
   'Vendor lead time for spare bearing assembly is tight.',
   'Confirm vendor delivery date by 15 July.', '[8]', NOW(), NOW()),
(3, '2026-06-10', 3, 'ST-04', 'Doris Kufuor',
   'EPA review of the environmental impact assessment ongoing.',
   'EPA requested additional biodiversity survey data.',
   'Submit supplementary survey data by 25 July.', '[11]', NOW(), NOW()),
(4, '2026-01-10', 4, NULL, 'Kwame Appiah',
   'CTP onshore site restoration substantially complete.',
   'Final community sign-off pending.',
   'Obtain community sign-off and close out the project.', '[12]', NOW(), NOW());

-- =============================================================================
-- 16. BUDGET LINES  (variancePercent pre-computed since raw SQL bypasses the
--    model's beforeSave hook)
-- =============================================================================
INSERT INTO `budget_lines`
  (`id`, `blockId`, `activityId`, `description`, `budgetCategory`, `plannedStartDate`, `plannedEndDate`,
   `actualStartDate`, `actualEndDate`, `currency`, `approvedBudget`, `committed`, `actualSpend`, `variancePercent`,
   `responsiblePerson`, `status`, `revisionStatus`, `pendingApprovedBudget`, `revisionRequestedById`,
   `revisionRequestedAt`, `revisionDecidedById`, `revisionDecidedAt`, `revisionComment`, `createdAt`, `updatedAt`)
VALUES
(1, 1, 2, 'Rig Mobilisation Budget', 'Drilling', '2025-10-01', '2025-11-15', '2025-10-10', '2025-11-12',
   'USD', 2200000.00, 2350000.00, 2350000.00, 6.82, 'Kwame Appiah', 'Closed', 'None',
   NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(2, 1, 3, 'Well Testing Programme', 'Operations', '2026-05-01', '2026-08-01', NULL, NULL,
   'USD', 900000.00, 500000.00, 410000.00, -54.44, 'Samuel Darko', 'Active', 'None',
   NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(3, 1, 7, 'Long-lead Equipment Procurement', 'Procurement', '2026-02-15', '2026-08-15', NULL, NULL,
   'USD', 4200000.00, 3900000.00, 2300000.00, -45.24, 'Nana Asante', 'Active', 'PendingApproval',
   4600000.00, 6, '2026-06-25', NULL, NULL, 'Requesting increase due to steel price escalation.', NOW(), NOW()),
(4, 2, 9, 'FPSO Turret Bearing Replacement', 'Maintenance', '2026-04-01', '2026-10-15', NULL, NULL,
   'USD', 8000000.00, 6000000.00, 2100000.00, -73.75, 'Samuel Darko', 'Active', 'Approved',
   NULL, 6, '2026-03-01', 2, '2026-03-05', 'Approved additional contingency for critical maintenance.', NOW(), NOW()),
(5, 2, NULL, 'FPSO O&M Annual Budget', 'Operations', '2026-01-01', '2026-12-31', NULL, NULL,
   'USD', 21000000.00, 12000000.00, 11500000.00, -45.24, 'Nana Asante', 'Active', 'None',
   NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(6, 3, 11, 'ST-04 Environmental Permitting', 'Regulatory', '2025-09-01', '2026-06-01', NULL, NULL,
   'USD', 120000.00, 90000.00, 65000.00, -45.83, 'Doris Kufuor', 'Active', 'None',
   NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(7, 4, 13, 'CTP Site Restoration', 'Decommissioning', '2023-06-01', '2024-12-01', '2023-06-15', '2024-11-20',
   'GHS', 82000000.00, 82000000.00, 81500000.00, -0.61, 'Kwame Appiah', 'Closed', 'None',
   NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(8, 1, 6, 'Infill Well WCTP-14 Design', 'Engineering', '2026-03-01', '2026-09-01', NULL, NULL,
   'GHS', 6000000.00, 2500000.00, 2100000.00, -65.00, 'Kwame Appiah', 'Draft', 'None',
   NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW());

-- =============================================================================
-- 17. FINANCES  (Entry / Invoice / AFE record types; row 2 is a supplementary
--    AFE off row 1 via parentAfeId; rows 3 & 5 are Invoices linked to their
--    governing AFE via afeId; row 7 demonstrates delegationHistory JSON)
-- =============================================================================
INSERT INTO `finances`
  (`id`, `item`, `amount`, `category`, `type`, `recordType`, `activityId`, `approvalDepartment`, `status`,
   `invoiceNumber`, `afeNumber`, `afeId`, `parentAfeId`, `supplementNumber`, `committedAmount`, `actualToDate`,
   `variancePercent`, `approvalDate`, `approvingAuthority`, `reconciledById`, `reconciledAt`, `transactionDetails`,
   `transactionDate`, `approvedBy`, `actionComment`, `delegatedTo`, `delegationHistory`, `date`,
   `createdAt`, `updatedAt`)
VALUES
(1, 'AFE - FPSO Turret Bearing Replacement', 8000000.00, 'Maintenance', 'Expense', 'AFE', 9, 'Finance & Accounts',
   'Approved', NULL, 'AFE-2026-014', NULL, NULL, 0, 6000000.00, 2100000.00, -73.75,
   '2026-03-05', 'James Mensah (CEO)', NULL, NULL, 'Original AFE for the turret bearing replacement programme.',
   '2026-03-01', 'James Mensah', NULL, NULL, NULL, '2026-03-01', NOW(), NOW()),
(2, 'AFE Supplement 1 - Turret Bearing Replacement', 1500000.00, 'Maintenance', 'Expense', 'AFE', 9, 'Finance & Accounts',
   'Approved', NULL, 'AFE-2026-014-S1', NULL, 1, 1, 1200000.00, 0.00, 0.00,
   '2026-06-01', 'James Mensah (CEO)', NULL, NULL, 'Supplementary AFE for additional contingency spares.',
   '2026-05-28', 'James Mensah', NULL, NULL, NULL, '2026-05-28', NOW(), NOW()),
(3, 'Bearing Assembly Supply Invoice', 2100000.00, 'Maintenance', 'Expense', 'Invoice', 9, 'Finance & Accounts',
   'Paid', 'INV-2026-3301', NULL, 1, NULL, 0, 0.00, 0.00, 0.00,
   '2026-06-10', 'Nana Asante', NULL, NULL, 'Payment for replacement bearing assembly from vendor.',
   '2026-06-12', 'Nana Asante', NULL, NULL, NULL, '2026-06-05', NOW(), NOW()),
(4, 'AFE - Rig Mobilisation WCTP Campaign', 2200000.00, 'Drilling', 'Expense', 'AFE', 2, 'Finance & Accounts',
   'Closed', NULL, 'AFE-2025-042', NULL, NULL, 0, 2350000.00, 2350000.00, 6.82,
   '2025-09-20', 'James Mensah (CEO)', 6, '2025-11-20', 'Rig mobilisation AFE — closed after reconciliation.',
   '2025-09-25', 'James Mensah', NULL, NULL, NULL, '2025-09-25', NOW(), NOW()),
(5, 'Rig Mobilisation Invoice - Atwood', 2350000.00, 'Drilling', 'Expense', 'Invoice', 2, 'Finance & Accounts',
   'Paid', 'INV-2025-2890', NULL, 4, NULL, 0, 0.00, 0.00, 0.00,
   NULL, NULL, NULL, NULL, 'Final rig mobilisation invoice.',
   '2025-11-15', 'Nana Asante', NULL, NULL, NULL, '2025-11-10', NOW(), NOW()),
(6, 'AFE - Subsea Tieback FEED Contract', 3000000.00, 'Engineering', 'Expense', 'AFE', 10, 'Finance & Accounts',
   'Pending', NULL, 'AFE-2026-021', NULL, NULL, 0, 350000.00, 350000.00, -88.33,
   NULL, NULL, NULL, NULL, 'Awaiting CEO approval for FEED contract award.',
   '2026-06-30', NULL, NULL, NULL, NULL, '2026-06-30', NOW(), NOW()),
(7, 'AFE - South Tano Environmental Studies', 120000.00, 'Regulatory', 'Expense', 'AFE', 11, 'Legal & Compliance',
   'Under Review', NULL, 'AFE-2026-009', NULL, NULL, 0, 90000.00, 65000.00, -45.83,
   NULL, NULL, NULL, NULL, 'Delegated to Legal & Compliance for review of permit costs.',
   '2026-05-05', NULL, NULL, 'Legal & Compliance',
   '[{"delegatedTo":"Legal & Compliance","delegatedBy":"James Mensah","date":"2026-05-05","comment":"Please review environmental cost breakdown."}]',
   '2026-05-05', NOW(), NOW()),
(8, 'Community Event Sponsorship Request', 25000.00, 'Community Relations', 'Expense', 'Entry', NULL, 'Executive Management',
   'Rejected', NULL, NULL, NULL, NULL, 0, 0.00, 0.00, 0.00,
   NULL, NULL, NULL, NULL, 'Requested sponsorship for a community festival.',
   '2026-05-20', NULL, 'Not aligned with approved 2026 budget; resubmit under the CSR programme once established.',
   NULL, NULL, '2026-05-18', NOW(), NOW()),
(9, 'Crude Oil Lifting Revenue - June 2026', 42000000.00, 'Revenue', 'Income', 'Entry', NULL, 'Finance & Accounts',
   'Approved', NULL, NULL, NULL, NULL, 0, 0.00, 0.00, 0.00,
   NULL, NULL, NULL, NULL, 'Monthly lifting revenue from the Tano FPSO field.',
   '2026-06-30', 'Nana Asante', NULL, NULL, NULL, '2026-06-30', NOW(), NOW()),
(10, 'Office Supplies - Accra HQ', 3200.00, 'Administration', 'Expense', 'Entry', NULL, 'Finance & Accounts',
   'Pending', NULL, NULL, NULL, NULL, 0, 0.00, 0.00, 0.00,
   NULL, NULL, NULL, NULL, 'Quarterly office supplies restock.',
   '2026-07-02', NULL, NULL, NULL, NULL, '2026-07-02', NOW(), NOW());

-- =============================================================================
-- 18. WORKFLOWS  (submitDate/dueDate are plain strings; steps is a JSON array
--    of step objects)
-- =============================================================================
INSERT INTO `workflows`
  (`id`, `title`, `type`, `submittedBy`, `submitDate`, `currentStep`, `priority`, `dueDate`, `description`,
   `amount`, `steps`, `status`, `createdAt`, `updatedAt`)
VALUES
(1, 'AFE Approval - Turret Bearing Replacement Supplement', 'AFE Approval', 'Nana Asante', '2026-05-28',
   'Executive Management', 'Critical', '2026-07-15', 'Approval required for AFE-2026-014-S1 supplementary amount.',
   1500000,
   '[{"step":"Finance & Accounts","status":"Completed","date":"2026-05-28"},{"step":"Executive Management","status":"In Progress","date":null}]',
   'Awaiting Action', NOW(), NOW()),
(2, 'Contract Renewal Review - Rig Charter Extension', 'Contract Review', 'Ewurabena Boateng', '2026-06-10',
   'Legal & Compliance', 'High', '2026-07-25', 'Review of proposed extension terms for the Atwood Explorer rig charter.',
   45000000,
   '[{"step":"Legal & Compliance","status":"In Progress","date":"2026-06-10"}]',
   'Review Required', NOW(), NOW()),
(3, 'Community Sponsorship Request - Rejected Resubmission', 'Finance Approval', 'Kwame Appiah', '2026-05-18',
   'Executive Management', 'Low', '2026-07-01', 'Resubmission of community sponsorship request under the CSR programme.',
   25000,
   '[{"step":"Finance & Accounts","status":"Rejected","date":"2026-05-20"},{"step":"Executive Management","status":"Pending","date":null}]',
   'Pending', NOW(), NOW()),
(4, 'HSE Incident Review - Turret Bearing Monitoring', 'HSE Review', 'Doris Kufuor', '2026-04-02',
   'HSE', 'Medium', '2026-04-20', 'Review of the interim monitoring plan for turret bearing wear.',
   NULL,
   '[{"step":"HSE","status":"Completed","date":"2026-04-05"},{"step":"Manager Review","status":"Completed","date":"2026-04-10"}]',
   'Completed', NOW(), NOW());

-- =============================================================================
-- 19. NOTIFICATIONS  (instances of the alert engine; channels is a JSON array
--    stored as TEXT)
-- =============================================================================
INSERT INTO `notifications`
  (`id`, `message`, `type`, `read`, `userId`, `module`, `entityType`, `entityId`, `triggerType`, `priority`,
   `channels`, `status`, `dueAt`, `dedupeKey`, `recurrenceIntervalHours`, `lastSentAt`, `snoozeUntil`,
   `snoozeReason`, `acknowledgedAt`, `acknowledgedBy`, `escalatedAt`, `escalatedToUserId`, `createdAt`, `updatedAt`)
VALUES
(1, 'Licence PC-EXP-2021-014 (West Cape Three Points) expires in 46 days.', 'Warning', 0, 5, 'Licence', 'Licence', '1',
   'DateBased', 'High', '["InApp","Email"]', 'Pending', '2026-08-20', 'Licence|Licence|1|DateBased|45', 24,
   '2026-07-04', NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(2, 'Compliance obligation "Surface Rental Fee - CTP Onshore" is overdue.', 'Error', 0, 5, 'ComplianceObligation',
   'ComplianceObligation', '3', 'StatusBased', 'Critical', '["InApp","Email"]', 'Escalated', '2026-05-01',
   'ComplianceObligation|ComplianceObligation|3|StatusBased|Overdue', 24, '2026-07-03', NULL, NULL, NULL, NULL,
   '2026-06-05', 2, NOW(), NOW()),
(3, 'Budget line "Long-lead Equipment Procurement" variance is -45.2%, exceeding the ±10% threshold.', 'Warning', 1,
   6, 'BudgetLine', 'BudgetLine', '3', 'ThresholdBased', 'High', '["InApp"]', 'Acknowledged', '2026-06-25',
   'BudgetLine|BudgetLine|3|ThresholdBased|10', 24, NULL, NULL, NULL, '2026-06-26', 6, NULL, NULL, NOW(), NOW()),
(4, 'AFE-2026-014 utilisation has reached 101%.', 'Error', 0, 6, 'FinanceAFE', 'Finance', '1', 'ThresholdBased',
   'Critical', '["InApp","Email"]', 'Pending', '2026-07-01', 'FinanceAFE|Finance|1|ThresholdBased|100', 24,
   '2026-07-04', NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(5, 'Correspondence "WCTP Exploration Licence Extension Request" is awaiting response — due in 8 days.', 'Warning',
   0, 5, 'Correspondence', 'Correspondence', '2', 'DateBased', 'Medium', '["InApp"]', 'Snoozed', '2026-08-01',
   'Correspondence|Correspondence|2|DateBased|7', 24, NULL, '2026-07-10',
   'Awaiting PC feedback call scheduled for next week.', NULL, NULL, NULL, NULL, NOW(), NOW()),
(6, 'Task "Draft long-lead procurement RFQ" is overdue.', 'Error', 0, 9, 'Task', 'Task', '3', 'StatusBased', 'High',
   '["InApp"]', 'Pending', '2026-06-20', 'Task|Task|3|StatusBased|Overdue', 24, '2026-07-05', NULL, NULL, NULL,
   NULL, NULL, NULL, NOW(), NOW()),
(7, 'Document "Letter to Petroleum Commission - Extension Request" — awaiting response from Petroleum Commission, due in 41 days.',
   'Info', 0, 5, 'Document', 'Document', '6', 'DateBased', 'Medium', '["InApp","Email"]', 'Pending', '2026-08-15',
   'Document|Document|6|DateBased|14', 24, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()),
(8, 'Welcome to the EnQuest PMS platform.', 'Success', 1, 9, 'Manual', NULL, NULL, 'Manual', 'Low', '["InApp"]',
   'Dismissed', NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-19', 9, NULL, NULL, NOW(), NOW());

-- =============================================================================
-- 20. REGISTERS  (legacy generic register — value is native JSON)
-- =============================================================================
INSERT INTO `registers` (`id`, `name`, `type`, `value`, `createdAt`, `updatedAt`) VALUES
(1, 'Legacy Risk Register Snapshot', 'risk',
   JSON_OBJECT('note', 'Superseded by the dedicated Risk model/API — kept for backward-compatibility demo.'), NOW(), NOW()),
(2, 'Legacy HSE Incident Register Snapshot', 'hse',
   JSON_OBJECT('note', 'Phase 2 HSE Register not yet implemented; placeholder generic register entry.'), NOW(), NOW()),
(3, 'Legacy Vendor Register Snapshot', 'vendor',
   JSON_OBJECT('vendors', JSON_ARRAY('Atwood Oceanics', 'MODEC Production Services', 'TechnipFMC')), NOW(), NOW());

-- =============================================================================
-- 21. REPORTS
-- =============================================================================
INSERT INTO `reports` (`id`, `title`, `content`, `generatedDate`, `type`, `createdBy`, `createdAt`, `updatedAt`) VALUES
(1, 'Q2 2026 Project Portfolio Report',
   'Summary of project completion, budget utilisation and key milestones across all blocks for Q2 2026.',
   '2026-07-01', 'Project', 4, NOW(), NOW()),
(2, 'June 2026 Finance & AFE Summary',
   'Monthly finance report covering AFE utilisation, budget variance and cash flow.',
   '2026-07-02', 'Finance', 6, NOW(), NOW()),
(3, 'H1 2026 Activity Progress Report',
   'Half-year progress summary of all tracked activities across the portfolio.',
   '2026-07-03', 'Activity', 4, NOW(), NOW());

-- =============================================================================
-- 22. AUDIT LOGS  (illustrative entries — the real app writes these
--    automatically via model hooks; oldValue/newValue are JSON stored as TEXT;
--    note: no `updatedAt` column — the model sets `updatedAt: false`)
-- =============================================================================
INSERT INTO `audit_logs`
  (`id`, `userId`, `userEmail`, `userRole`, `module`, `entityType`, `entityId`, `action`, `oldValue`, `newValue`,
   `ipAddress`, `createdAt`)
VALUES
(1, 1, 'admin@enquest-demo.com', 'Admin', 'User', 'User', '13', 'UPDATE',
   '{"active":true}', '{"active":false}', '10.0.0.15', '2026-06-01 09:12:00'),
(2, 6, 'finance@enquest-demo.com', 'Finance/Accounts', 'FinanceAFE', 'Finance', '1', 'CREATE',
   NULL, '{"afeNumber":"AFE-2026-014","amount":8000000}', '10.0.0.22', '2026-03-01 14:05:00'),
(3, 2, 'ceo@enquest-demo.com', 'CEO/Country Manager', 'FinanceAFE', 'Finance', '1', 'UPDATE',
   '{"status":"Pending"}', '{"status":"Approved"}', '10.0.0.5', '2026-03-05 10:30:00'),
(4, 4, 'ops.manager@enquest-demo.com', 'Project/Operations Manager', 'BudgetLine', 'BudgetLine', '3', 'UPDATE',
   '{"revisionStatus":"None"}', '{"revisionStatus":"PendingApproval","pendingApprovedBudget":4600000}',
   '10.0.0.30', '2026-06-25 11:47:00'),
(5, 5, 'legal@enquest-demo.com', 'Legal/Compliance Officer', 'Contract', 'Contract', '5', 'DELETE',
   '{"title":"Legacy Catering Services Contract","status":"Expired"}', NULL, '10.0.0.18', '2025-12-31 16:00:00'),
(6, 9, 'staff1@enquest-demo.com', 'Team Member/Staff', 'Task', 'Task', '1', 'CREATE',
   NULL, '{"title":"Review flow test results","status":"Not Started"}', '10.0.0.41', '2026-06-01 08:00:00');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'demodata.sql applied successfully — 22 tables seeded (RBAC/notification_rules seeded separately by server.js).' AS result;
