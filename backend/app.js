const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Op, QueryTypes } = require('sequelize');
const path = require('path');
const sequelize = require('./database');

// database.js already loads the repo-root .env, but load it explicitly here too so
// process.env is populated even if this module is ever required without ./database first.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5040;

// Register all models so sequelize.sync can create the tables
require('./models/Project');
require('./models/Activity');
require('./models/Block');
require('./models/Document');
require('./models/Finance');
require('./models/Notification');
require('./models/NotificationRule');
require('./models/Register');
require('./models/Report');
require('./models/ReportDefinition');
require('./models/Risk');
require('./models/RiskMatrixSetting');
require('./models/User');
require('./models/Workflow');
require('./models/Department');
require('./models/Comment');
require('./models/Task');
require('./models/AuditLog');
require('./models/Contract');
require('./models/ComplianceObligation');
require('./models/Correspondence');
require('./models/Decision');
require('./models/OperationsUpdate');
require('./models/BudgetLine');
require('./models/Role');
require('./models/Permission');
require('./models/RolePermission');
require('./models/InsurancePolicy');
require('./models/EnvironmentalPermit');
require('./models/Nda');
require('./models/DataRoomGrant');
require('./models/VendorInvoice');
require('./models/ForexTransaction');
require('./models/LocalContentRecord');
require('./models/HseIncident');
require('./models/HseExposureRecord');
require('./models/Licence');

// Define associations after all models are loaded
const Project = require('./models/Project');
const Activity = require('./models/Activity');
const Finance = require('./models/Finance');
const Block = require('./models/Block');
const User = require('./models/User');
const Department = require('./models/Department');
const Comment = require('./models/Comment');
const Task = require('./models/Task');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');

Activity.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

Finance.belongsTo(Activity, {
  foreignKey: 'activityId',
  as: 'activity'
});

Activity.hasMany(Finance, {
  foreignKey: 'activityId',
  as: 'financeItems'
});

Project.hasMany(Activity, {
  foreignKey: 'projectId',
  as: 'activities'
});

Project.belongsTo(Block, {
  foreignKey: 'blockId',
  as: 'blockDetails'
});

Block.hasMany(Project, {
  foreignKey: 'blockId',
  as: 'projects'
});

User.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'departmentDetails'
});

Department.hasMany(User, {
  foreignKey: 'departmentId',
  as: 'users'
});

Comment.belongsTo(Activity, {
  foreignKey: 'activityId',
  as: 'activity'
});

Activity.hasMany(Comment, {
  foreignKey: 'activityId',
  as: 'comments'
});

Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments'
});

Comment.belongsTo(Department, {
  foreignKey: 'departmentId',
  as: 'department'
});

Department.hasMany(Comment, {
  foreignKey: 'departmentId',
  as: 'comments'
});

Task.belongsTo(User, {
  foreignKey: 'assignedToId',
  as: 'Assignee'
});

User.hasMany(Task, {
  foreignKey: 'assignedToId',
  as: 'assignedTasks'
});

Task.belongsTo(User, {
  foreignKey: 'assignedById',
  as: 'Assigner'
});

User.hasMany(Task, {
  foreignKey: 'assignedById',
  as: 'createdTasks'
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  as: 'permissions',
  foreignKey: 'roleId',
  otherKey: 'permissionId'
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  as: 'roles',
  foreignKey: 'permissionId',
  otherKey: 'roleId'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Establish per-request context (actor + IP) for cross-cutting concerns such
// as the central audit logger. Must run before route handlers.
const { requestContextMiddleware } = require('./middleware/requestContext');
app.use(requestContextMiddleware);

// Register global hooks that write an audit-log entry for every create/update/
// delete across all models (Requirements §5.4).
const { registerAuditHooks } = require('./services/auditLogger');
registerAuditHooks(sequelize);

// Simple liveness/readiness probe — useful for uptime monitoring, load
// balancers, and as a smoke-test target in the automated test suite.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
const activitiesRoutes = require('./routes/activities');
const blocksRoutes = require('./routes/blocks');
const documentsRoutes = require('./routes/documents');
const projectsRoutes = require('./routes/projects');
const registersRoutes = require('./routes/registers');
const workflowsRoutes = require('./routes/workflows');
const financeRoutes = require('./routes/finance');
const notificationsRoutes = require('./routes/notifications');
const reportsRoutes = require('./routes/reports');
const risksRoutes = require('./routes/risks');
const departmentsRoutes = require('./routes/departments');
const commentsRoutes = require('./routes/comments');
const licencesRoutes = require('./routes/licences');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const auditRoutes = require('./routes/audit');
const notificationRulesRoutes = require('./routes/notificationRules');
const contractsRoutes = require('./routes/contracts');
const complianceRoutes = require('./routes/compliance');
const correspondenceRoutes = require('./routes/correspondence');
const decisionsRoutes = require('./routes/decisions');
const operationsUpdatesRoutes = require('./routes/operationsUpdates');
const budgetLinesRoutes = require('./routes/budgetLines');
const insuranceRoutes = require('./routes/insurance');
const environmentalPermitsRoutes = require('./routes/environmentalPermits');
const ndasRoutes = require('./routes/ndas');
const vendorPaymentsRoutes = require('./routes/vendorPayments');
const forexRoutes = require('./routes/forex');
const localContentRoutes = require('./routes/localContent');
const hseRoutes = require('./routes/hse');
const rbacRoutes = require('./routes/rbac');
const orgChartRoutes = require('./routes/orgChart');
const searchRoutes = require('./routes/search');
const { authMiddleware, optionalAuthMiddleware, adminMiddleware } = require('./middleware/auth');
const { requirePermission } = require('./middleware/rbac');

// Routes governed by the configurable RBAC matrix (§4) rather than a
// hard-coded Admin/Manager check — which permission key gates writes to each
// is Admin-editable via /api/admin/role-permissions, no code change. This
// covers both the original operational modules and the newer register
// modules added alongside the RBAC matrix itself.
const permissionProtectedRoutes = [
  { path: '/api/blocks', permission: 'blocks.manage' },
  { path: '/api/projects', permission: 'projects.manage' },
  { path: '/api/activities', permission: 'activities.manage' },
  { path: '/api/registers', permission: 'registers.manage' },
  { path: '/api/risks', permission: 'risks.manage' },
  { path: '/api/workflows', permission: 'workflows.manage' },
  { path: '/api/contracts', permission: 'contracts.manage' },
  { path: '/api/compliance', permission: 'compliance.manage' },
  { path: '/api/correspondence', permission: 'correspondence.manage' },
  { path: '/api/decisions', permission: 'decisions.manage' },
  { path: '/api/operations-updates', permission: 'operations_updates.manage' },
  { path: '/api/budget-lines', permission: 'budget.manage' },
  { path: '/api/insurance', permission: 'insurance.manage' },
  { path: '/api/environmental-permits', permission: 'env_permits.manage' },
  { path: '/api/ndas', permission: 'nda.manage' },
  { path: '/api/vendor-payments', permission: 'vendor_payments.manage' },
  { path: '/api/forex', permission: 'forex.manage' },
  { path: '/api/local-content', permission: 'local_content.manage' },
  { path: '/api/hse', permission: 'hse.manage' },
  { path: '/api/documents', permission: 'documents.manage' },
  { path: '/api/comments', permission: 'comments.manage' },
  { path: '/api/tasks', permission: 'tasks.manage' },
  { path: '/api/licences', permission: 'licences.manage' },
  { path: '/api/finance', permission: 'finance.manage' }
];

const authProtectedRoutes = [
  '/api/notifications'
];

// Enforce the configurable RBAC matrix for database mutations across all
// permission-protected modules (legacy + newer registers alike).
permissionProtectedRoutes.forEach(({ path, permission }) => {
  app.use(path, (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      authMiddleware(req, res, () => {
        requirePermission(permission)(req, res, next);
      });
    } else {
      optionalAuthMiddleware(req, res, next);
    }
  });
});

// Enforce authentication for mutations on modules not yet governed by a
// dedicated RBAC permission (currently just Notifications — acknowledge/
// snooze actions are available to any authenticated user, gated by
// ownership inside the route handler rather than a role permission).
authProtectedRoutes.forEach((route) => {
  app.use(route, (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      authMiddleware(req, res, next);
    } else {
      optionalAuthMiddleware(req, res, next);
    }
  });
});

app.use('/api/activities', activitiesRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/registers', registersRoutes);
app.use('/api/workflows', workflowsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/licences', licencesRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/correspondence', correspondenceRoutes);
app.use('/api/decisions', decisionsRoutes);
app.use('/api/operations-updates', operationsUpdatesRoutes);
app.use('/api/budget-lines', budgetLinesRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/environmental-permits', environmentalPermitsRoutes);
app.use('/api/ndas', ndasRoutes);
app.use('/api/vendor-payments', vendorPaymentsRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/local-content', localContentRoutes);
app.use('/api/hse', hseRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org-chart', authMiddleware, orgChartRoutes);
app.use('/api/tasks', tasksRoutes);

// Audit log is restricted to Admin — it is an immutable governance record.
app.use('/api/audit', authMiddleware, adminMiddleware, auditRoutes);

// Notification rules configure the shared alert engine and are Admin-only (§10.4).
app.use('/api/notification-rules', authMiddleware, adminMiddleware, notificationRulesRoutes);

// RBAC matrix configuration (roles, permissions, role-permission assignments) — Admin-only (§4).
app.use('/api/admin', authMiddleware, adminMiddleware, rbacRoutes);

// Global search bar (top header) — site-wide search across the primary
// content modules. optionalAuthMiddleware so guests can still search public
// data, while logged-in users additionally get Confidential documents they
// have access to.
app.use('/api/search', optionalAuthMiddleware, searchRoutes);

module.exports = app;
