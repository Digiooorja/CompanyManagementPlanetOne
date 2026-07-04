const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('./database');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
require('./models/Risk');
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
const rbacRoutes = require('./routes/rbac');
const orgChartRoutes = require('./routes/orgChart');
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
  { path: '/api/budget-lines', permission: 'budget.manage' }
];

const authProtectedRoutes = [
  '/api/documents',
  '/api/comments',
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

// Enforce authentication for content upload/comment mutations
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
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org-chart', authMiddleware, orgChartRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);

// Audit log is restricted to Admin — it is an immutable governance record.
app.use('/api/audit', authMiddleware, adminMiddleware, auditRoutes);

// Notification rules configure the shared alert engine and are Admin-only (§10.4).
app.use('/api/notification-rules', authMiddleware, adminMiddleware, notificationRulesRoutes);

// RBAC matrix configuration (roles, permissions, role-permission assignments) — Admin-only (§4).
app.use('/api/admin', authMiddleware, adminMiddleware, rbacRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Apply schema changes using migrations. Sync is only for initial missing tables.
    const queryInterface = sequelize.getQueryInterface();
    await sequelize.sync();
    console.log('Database synchronized');

    const departmentNames = [
      'Executive Management',
      'Procurement',
      'Accounts',
      'Operations',
      'Finance & Accounts',
      'HSE',
      'Commercial',
      'HR'
    ];

    for (const name of departmentNames) {
      await Department.findOrCreate({
        where: { name }
      });
    }

    let usersTable = null;

    try {
      usersTable = await queryInterface.describeTable('users');
    } catch (err) {
      usersTable = null;
    }

    if (usersTable && usersTable.department) {
      const legacyUsers = await sequelize.query(
        'SELECT id, department FROM users WHERE department IS NOT NULL AND "departmentId" IS NULL',
        { type: QueryTypes.SELECT }
      );

      for (const legacyUser of legacyUsers) {
        const department = await Department.findOne({
          where: { name: legacyUser.department }
        });
        if (department) {
          await sequelize.query(
            'UPDATE users SET "departmentId" = :departmentId WHERE id = :userId',
            {
              replacements: { departmentId: department.id, userId: legacyUser.id },
              type: QueryTypes.UPDATE
            }
          );
        }
      }

      await queryInterface.removeColumn('users', 'department');
    }

    // Seed default Notification & Alert Engine rules (§10) if none exist yet.
    // Admin can subsequently retune/disable/add rules via /api/notification-rules
    // without any code change.
    const NotificationRule = require('./models/NotificationRule');
    const defaultRules = [
      {
        name: 'Activity due-date reminders',
        module: 'Activity',
        triggerType: 'DateBased',
        dateField: 'dueDate',
        leadTimeDays: [7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 48,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Task due-date reminders',
        module: 'Task',
        triggerType: 'DateBased',
        dateField: 'dueDate',
        leadTimeDays: [3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 72,
        priority: 'Medium',
        channels: ['InApp']
      },
      {
        name: 'Licence expiry countdown',
        module: 'Licence',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [180, 90, 30],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Contract expiry/renewal reminders',
        module: 'Contract',
        triggerType: 'DateBased',
        dateField: 'expiryDate',
        leadTimeDays: [90, 60, 30],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Compliance obligation due-date reminders',
        module: 'ComplianceObligation',
        triggerType: 'DateBased',
        dateField: 'dueDate',
        leadTimeDays: [30, 14, 7, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 24,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'PC/GNPC correspondence response-due reminders',
        module: 'Correspondence',
        triggerType: 'DateBased',
        dateField: 'responseDueDate',
        leadTimeDays: [14, 7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Budget line variance threshold',
        module: 'BudgetLine',
        triggerType: 'ThresholdBased',
        thresholdField: 'absVariancePercent',
        thresholdValues: [10],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Budget line utilisation alert',
        module: 'BudgetLine',
        triggerType: 'ThresholdBased',
        thresholdField: 'utilisationPercent',
        thresholdValues: [90, 100],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'AFE utilisation alert',
        module: 'FinanceAFE',
        triggerType: 'ThresholdBased',
        thresholdField: 'utilisationPercent',
        thresholdValues: [80, 100],
        recurrenceIntervalHours: 24,
        escalationGraceHours: null,
        priority: 'High',
        channels: ['InApp', 'Email']
      },
      {
        name: 'Document awaiting-response reminders',
        module: 'Document',
        triggerType: 'DateBased',
        dateField: 'responseDueDate',
        leadTimeDays: [7, 3, 1],
        recurrenceIntervalHours: 24,
        escalationGraceHours: 72,
        priority: 'Medium',
        channels: ['InApp', 'Email']
      }
    ];

    for (const rule of defaultRules) {
      await NotificationRule.findOrCreate({ where: { name: rule.name }, defaults: rule });
    }

    // Seed the configurable RBAC matrix (§4) if it doesn't exist yet: system
    // roles backing the legacy adminMiddleware/managerMiddleware checks, the
    // business roles from the requirements table, the permission catalog the
    // API actually enforces, and a sensible default role->permission mapping.
    // Admin can subsequently add roles, edit descriptions, and reassign
    // permissions via /api/admin/roles and /api/admin/role-permissions
    // without any code change.
    const roleSeeds = [
      { name: 'Admin', description: 'Admin / IT — technical superuser: user management, RBAC configuration, system settings.', isSystem: true },
      { name: 'Manager', description: 'Legacy operational manager — broad create/edit rights across core operational modules.', isSystem: true },
      { name: 'User', description: 'Legacy standard user — view access plus document/comment contributions.', isSystem: true },
      { name: 'Chairman/Board', description: 'Ultimate oversight of the venture. Chairman View, read-only summaries, one-click export — no edit rights.' },
      { name: 'CEO/Country Manager', description: 'Overall executive management. Full read access; approval authority on budgets, decisions, AFEs.' },
      { name: 'Project/Operations Manager', description: 'Day-to-day project & operations delivery. Full access to tasks, activities, work programme, operations updates.' },
      { name: 'Legal/Compliance Officer', description: 'Regulatory, contractual and correspondence oversight. Full access to contracts, compliance tracker, correspondence log, NDA tracker.' },
      { name: 'Finance/Accounts', description: 'Budget, AFE and payment management. Full access to budget tracker, AFE tracking, vendor payment aging, forex workflow.' },
      { name: 'HSE Officer', description: 'Health, safety and environment oversight. Full access to HSE register, environmental permit tracker.' },
      { name: 'Geologist/Drilling Engineer', description: 'Technical operations reporting. Full access to daily drilling/geological reports, reserves tracker.' },
      { name: 'Team Member/Staff', description: 'General contributor. Access limited to assigned tasks, activities and documents.' },
      { name: 'External Partner', description: 'JV partner / auditor with limited visibility. Read-only access to specifically shared documents or reports.' }
    ];

    const roleRows = {};
    for (const seed of roleSeeds) {
      const [role] = await Role.findOrCreate({ where: { name: seed.name }, defaults: seed });
      roleRows[seed.name] = role;
    }

    const permissionSeeds = [
      { key: 'blocks.manage', module: 'Blocks & Assets', description: 'Create, edit and delete blocks' },
      { key: 'projects.manage', module: 'Projects', description: 'Create, edit and delete projects' },
      { key: 'activities.manage', module: 'Activities', description: 'Create, edit and delete activities' },
      { key: 'tasks.manage', module: 'Tasks', description: 'Create, edit and delete tasks' },
      { key: 'documents.manage', module: 'Documents', description: 'Upload, edit and delete documents' },
      { key: 'finance.manage', module: 'Finance & Budget', description: 'Create and edit budget/finance line items' },
      { key: 'finance.approve', module: 'Finance & Budget', description: 'Approve or reject AFEs and budget revisions' },
      { key: 'contracts.manage', module: 'Contract Register', description: 'Create, edit and delete contracts' },
      { key: 'compliance.manage', module: 'Compliance Tracker', description: 'Create, edit and close compliance obligations' },
      { key: 'correspondence.manage', module: 'Correspondence Log', description: 'Create and edit correspondence entries' },
      { key: 'decisions.manage', module: 'Decision Log', description: 'Create and edit decisions' },
      { key: 'operations_updates.manage', module: 'Operations Update', description: 'Create and edit operations updates' },
      { key: 'budget.manage', module: 'Work Programme & Budget Tracker', description: 'Create and edit budget lines; request/approve budget revisions' },
      { key: 'licences.manage', module: 'Licences', description: 'Create and edit licences' },
      { key: 'risks.manage', module: 'Risk Register', description: 'Create and edit risks' },
      { key: 'workflows.manage', module: 'Workflows', description: 'Create and edit workflows' },
      { key: 'registers.manage', module: 'Registers', description: 'Create and edit registers' },
      { key: 'reports.view', module: 'Reports', description: 'View reports' },
      { key: 'dashboards.view', module: 'Dashboards', description: 'View operational dashboards' },
      { key: 'chairman_view.access', module: 'Chairman View', description: 'Access the executive Chairman View' },
      { key: 'audit.view', module: 'Audit Log', description: 'View and export the audit log' },
      { key: 'admin.manage_users', module: 'Administration', description: 'Create, edit and deactivate user accounts' },
      { key: 'admin.manage_rbac', module: 'Administration', description: 'Configure roles and the permission matrix' },
      { key: 'notifications.manage_rules', module: 'Notifications', description: 'Configure notification & alert engine rules' }
    ];

    const permissionRows = {};
    for (const seed of permissionSeeds) {
      const [permission] = await Permission.findOrCreate({ where: { key: seed.key }, defaults: seed });
      permissionRows[seed.key] = permission;
    }

    const defaultMatrix = {
      Manager: [
        'blocks.manage', 'projects.manage', 'activities.manage', 'tasks.manage', 'risks.manage',
        'workflows.manage', 'registers.manage', 'contracts.manage', 'compliance.manage',
        'correspondence.manage', 'decisions.manage', 'operations_updates.manage', 'licences.manage',
        'budget.manage', 'dashboards.view', 'reports.view'
      ],
      User: ['dashboards.view', 'reports.view'],
      'Chairman/Board': ['dashboards.view', 'chairman_view.access', 'reports.view'],
      'CEO/Country Manager': ['dashboards.view', 'chairman_view.access', 'reports.view', 'finance.approve', 'decisions.manage', 'activities.manage'],
      'Project/Operations Manager': ['blocks.manage', 'projects.manage', 'tasks.manage', 'activities.manage', 'operations_updates.manage', 'workflows.manage', 'budget.manage', 'dashboards.view', 'reports.view'],
      'Legal/Compliance Officer': ['contracts.manage', 'compliance.manage', 'correspondence.manage', 'documents.manage', 'dashboards.view', 'reports.view'],
      'Finance/Accounts': ['finance.manage', 'finance.approve', 'budget.manage', 'dashboards.view', 'reports.view'],
      'HSE Officer': ['risks.manage', 'dashboards.view', 'reports.view'],
      'Geologist/Drilling Engineer': ['dashboards.view', 'reports.view'],
      'Team Member/Staff': ['dashboards.view', 'reports.view'],
      'External Partner': ['reports.view'],
      Admin: ['admin.manage_users', 'admin.manage_rbac', 'notifications.manage_rules', 'audit.view']
    };

    for (const [roleName, permissionKeys] of Object.entries(defaultMatrix)) {
      const role = roleRows[roleName];
      if (!role) continue;

      for (const key of permissionKeys) {
        const permission = permissionRows[key];
        if (!permission) continue;
        await RolePermission.findOrCreate({ where: { roleId: role.id, permissionId: permission.id } });
      }
    }

    // Start the periodic sweep that arms/re-arms/escalates alerts from the rules above.
    const { startNotificationScheduler } = require('./services/notificationScheduler');
    startNotificationScheduler(Number(process.env.NOTIFICATION_ENGINE_INTERVAL_MS) || 60 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Backend startup error:', err);
    process.exit(1);
  }
};

startServer();