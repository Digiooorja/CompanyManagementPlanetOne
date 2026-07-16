// Requiring app.js (even though it's unused directly) triggers all model
// association setup as a side effect - notably Role.belongsToMany(Permission)
// via RolePermission, which loadPermissionMap() (middleware/rbac.js, used by
// resolveRecipients() below) depends on. Without this, the association isn't
// registered in this test file's process and every permission check throws
// "Permission is not associated to Role!".
require('../app');
const { evaluateRules } = require('../services/notificationEngine');
const Notification = require('../models/Notification');
const NotificationRule = require('../models/NotificationRule');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const Department = require('../models/Department');
const sequelize = require('../database');
const { seedRolePermissions } = require('./helpers/seedRole');
const { makeUser } = require('./helpers/seedUser');

// Regression/feature coverage for: "In RBAC, add notification permission for
// each module. Send notification for selected department user only" and its
// follow-up: "one module notification can be sent to multiple department."
//
// Covers all three parts of the feature:
// 1. resolveRecipients()'s fallback broadcast (no specific per-record owner)
//    now requires the module's `<module>.notify` RBAC permission instead of
//    a hardcoded Admin/Manager check.
// 2. NotificationRule.departmentIds (a JSON array), when non-empty, further
//    restricts that fallback to users in ANY of the listed departments.
// 3. An empty/unset departmentIds means no department restriction (org-wide).
describe('Notification Engine — per-module notify permission + multi-department scoping (§10.4, 2026-07-10)', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  test('only a user whose role holds the module notify permission AND is in the rule\'s department gets notified', async () => {
    const legalDept = await Department.findOrCreate({ where: { name: 'Legal (Notify Test)' } }).then(([d]) => d);
    const otherDept = await Department.findOrCreate({ where: { name: 'Ops (Notify Test)' } }).then(([d]) => d);

    // Role WITH the activities.notify permission
    const notifiedRole = await seedRolePermissions('Activity Notify Role', ['activities.notify']);
    // Role WITHOUT it — should never be notified regardless of department
    const unnotifiedRole = await seedRolePermissions('Activity No-Notify Role', ['dashboards.view']);

    const userInDeptWithPermission = await makeUser({ role: notifiedRole.name, departmentId: legalDept.id });
    const userOutOfDeptWithPermission = await makeUser({ role: notifiedRole.name, departmentId: otherDept.id });
    const userInDeptWithoutPermission = await makeUser({ role: unnotifiedRole.name, departmentId: legalDept.id });

    const project = await Project.create({ name: 'Notify Scoping Test Project', description: 'x', status: 'Active' });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10); // within a 30-day lead time bucket
    const activity = await Activity.create({
      name: 'Notify Scoping Test Activity',
      projectId: project.id,
      dueDate,
      status: 'Active'
      // assignedTo intentionally left unset -> ownerResolver resolves null -> fallback path
    });

    const rule = await NotificationRule.create({
      name: 'Dept-scoped test rule',
      module: 'Activity',
      triggerType: 'DateBased',
      dateField: 'dueDate',
      leadTimeDays: [30],
      recurrenceIntervalHours: 24,
      priority: 'Medium',
      channels: ['InApp'],
      active: true,
      departmentIds: [legalDept.id]
    });

    await evaluateRules();

    const notifications = await Notification.findAll({
      where: { module: 'Activity', entityId: String(activity.id) }
    });
    const notifiedUserIds = notifications.map((n) => n.userId);

    expect(notifiedUserIds).toContain(userInDeptWithPermission.id);
    expect(notifiedUserIds).not.toContain(userOutOfDeptWithPermission.id);
    expect(notifiedUserIds).not.toContain(userInDeptWithoutPermission.id);

    await rule.destroy();
  });

  test('with no departmentIds set, the notify permission still gates recipients org-wide (no department restriction)', async () => {
    const notifiedRole = await seedRolePermissions('Activity Notify Role (org-wide)', ['activities.notify']);
    const deptA = await Department.findOrCreate({ where: { name: 'Dept A (Notify Test)' } }).then(([d]) => d);
    const deptB = await Department.findOrCreate({ where: { name: 'Dept B (Notify Test)' } }).then(([d]) => d);

    const userA = await makeUser({ role: notifiedRole.name, departmentId: deptA.id });
    const userB = await makeUser({ role: notifiedRole.name, departmentId: deptB.id });

    const project = await Project.create({ name: 'Org-wide Notify Test Project', description: 'x', status: 'Active' });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const activity = await Activity.create({
      name: 'Org-wide Notify Test Activity',
      projectId: project.id,
      dueDate,
      status: 'Active'
    });

    const rule = await NotificationRule.create({
      name: 'Org-wide test rule (no department)',
      module: 'Activity',
      triggerType: 'DateBased',
      dateField: 'dueDate',
      leadTimeDays: [30],
      recurrenceIntervalHours: 24,
      priority: 'Medium',
      channels: ['InApp'],
      active: true,
      departmentIds: []
    });

    await evaluateRules();

    const notifications = await Notification.findAll({
      where: { module: 'Activity', entityId: String(activity.id) }
    });
    const notifiedUserIds = notifications.map((n) => n.userId);

    expect(notifiedUserIds).toContain(userA.id);
    expect(notifiedUserIds).toContain(userB.id);

    await rule.destroy();
  });

  test('Admin always qualifies for the fallback broadcast even without an explicit notify permission', async () => {
    const legalDept = await Department.findOrCreate({ where: { name: 'Legal (Admin Notify Test)' } }).then(([d]) => d);
    const admin = await makeUser({ role: 'Admin', departmentId: legalDept.id });

    const project = await Project.create({ name: 'Admin Notify Test Project', description: 'x', status: 'Active' });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const activity = await Activity.create({
      name: 'Admin Notify Test Activity',
      projectId: project.id,
      dueDate,
      status: 'Active'
    });

    const rule = await NotificationRule.create({
      name: 'Admin fallback test rule',
      module: 'Activity',
      triggerType: 'DateBased',
      dateField: 'dueDate',
      leadTimeDays: [30],
      recurrenceIntervalHours: 24,
      priority: 'Medium',
      channels: ['InApp'],
      active: true,
      departmentIds: [legalDept.id]
    });

    await evaluateRules();

    const notifications = await Notification.findAll({
      where: { module: 'Activity', entityId: String(activity.id) }
    });
    expect(notifications.map((n) => n.userId)).toContain(admin.id);

    await rule.destroy();
  });

  test('a rule scoped to multiple departments notifies users in any of them, but not a third department', async () => {
    const notifiedRole = await seedRolePermissions('Activity Notify Role (multi-dept)', ['activities.notify']);
    const deptA = await Department.findOrCreate({ where: { name: 'Multi-Dept A (Notify Test)' } }).then(([d]) => d);
    const deptB = await Department.findOrCreate({ where: { name: 'Multi-Dept B (Notify Test)' } }).then(([d]) => d);
    const deptC = await Department.findOrCreate({ where: { name: 'Multi-Dept C (Notify Test, excluded)' } }).then(([d]) => d);

    const userInA = await makeUser({ role: notifiedRole.name, departmentId: deptA.id });
    const userInB = await makeUser({ role: notifiedRole.name, departmentId: deptB.id });
    const userInC = await makeUser({ role: notifiedRole.name, departmentId: deptC.id });

    const project = await Project.create({ name: 'Multi-Dept Notify Test Project', description: 'x', status: 'Active' });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10);
    const activity = await Activity.create({
      name: 'Multi-Dept Notify Test Activity',
      projectId: project.id,
      dueDate,
      status: 'Active'
    });

    const rule = await NotificationRule.create({
      name: 'Multi-department test rule',
      module: 'Activity',
      triggerType: 'DateBased',
      dateField: 'dueDate',
      leadTimeDays: [30],
      recurrenceIntervalHours: 24,
      priority: 'Medium',
      channels: ['InApp'],
      active: true,
      departmentIds: [deptA.id, deptB.id]
    });

    await evaluateRules();

    const notifications = await Notification.findAll({
      where: { module: 'Activity', entityId: String(activity.id) }
    });
    const notifiedUserIds = notifications.map((n) => n.userId);

    expect(notifiedUserIds).toContain(userInA.id);
    expect(notifiedUserIds).toContain(userInB.id);
    expect(notifiedUserIds).not.toContain(userInC.id);

    await rule.destroy();
  });
});
