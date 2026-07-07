const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const AWS = require('aws-sdk');
const { Op, where, fn, col } = require('sequelize');
const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Role = require('../models/Role');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION_NAME || process.env.AWS_REGION
});

// Apply strict administration and role verification gates globally
// (Requirements §5.1 business rule: "Only Admin/HR role can create, edit or
// deactivate a profile" — this system has no separate HR role yet, so Admin/IT
// is the sole profile-management authority.)
router.use(authMiddleware);
router.use(adminMiddleware);

const PROFILE_ATTRS = ['id', 'username', 'firstName', 'lastName', 'employeeId'];

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { association: 'departmentDetails', attributes: ['id', 'name'] },
        { association: 'reportingManager', attributes: PROFILE_ATTRS }
      ]
    });

    const response = users.map((user) => {
      const userJSON = user.toJSON();
      userJSON.department = userJSON.departmentDetails?.name || null;
      return userJSON;
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { association: 'departmentDetails', attributes: ['id', 'name'] },
        { association: 'reportingManager', attributes: PROFILE_ATTRS },
        { association: 'directReports', attributes: PROFILE_ATTRS }
      ]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const response = user.toJSON();
    response.department = user.departmentDetails?.name || null;
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users/:id/history - full profile/role change history from the
// central Audit Log (Requirements §5.1 acceptance criteria + §5.4).
router.get('/users/:id/history', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { entityType: 'User', entityId: String(req.params.id) },
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /users/:id/allocations - team allocation view: which
// projects/blocks/tasks this person is currently working on (Requirements
// §5.1 key feature: "Team allocation view").
router.get('/users/:id/allocations', async (req, res) => {
  try {
    const userId = req.params.id;

    const tasks = await Task.findAll({
      where: { assignedToId: userId, status: { [Op.ne]: 'Completed' } },
      attributes: ['id', 'title', 'status', 'progress', 'relatedType', 'relatedId']
    });

    const user = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'username'] });
    const assignName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase() : '';

    const activities = assignName
      ? await Activity.findAll({
          where: where(fn('LOWER', col('assignedTo')), assignName),
          attributes: ['id', 'name', 'status', 'progress', 'projectId']
        })
      : [];

    const projectIds = Array.from(new Set(activities.map((a) => a.projectId).filter(Boolean)));
    const projects = projectIds.length > 0 ? await Project.findAll({ where: { id: projectIds } }) : [];

    res.json({ tasks, activities, projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /users/:id/photo - profile photo upload (Requirements §5.1 key data field)
router.post('/users/:id/photo', upload.single('file'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!req.file) return res.status(400).json({ message: 'File is required (field name "file")' });

    const s3Key = `profile-photos/${user.id}-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    await s3.upload({
      Bucket: process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }).promise();

    const region = process.env.AWS_S3_REGION_NAME || process.env.AWS_REGION;
    const bucket = process.env.AWS_STORAGE_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
    const photoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    await user.update({ photoUrl });
    res.json({ photoUrl });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST new user
router.post('/users', async (req, res) => {
  try {
    if (req.body.role) {
      const roleExists = await Role.findOne({ where: { name: req.body.role } });
      if (!roleExists) {
        return res.status(400).json({ message: `Invalid role "${req.body.role}" — see /api/admin/roles for valid options` });
      }
    }

    let reportingManager = null;
    if (req.body.reportingManagerId) {
      reportingManager = await User.findByPk(req.body.reportingManagerId);
      if (!reportingManager) {
        return res.status(400).json({ message: 'Invalid reportingManagerId' });
      }
    }

    let selectedDepartment = null;
    if (req.body.departmentId) {
      selectedDepartment = await Department.findByPk(req.body.departmentId);
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid departmentId' });
      }
    } else if (req.body.department) {
      selectedDepartment = await Department.findOne({ where: { name: req.body.department } });
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid department name' });
      }
    } else {
      selectedDepartment = await Department.findOne({ where: { name: 'Operations' } });
    }

    // Securely hash password using bcryptjs
    let hashedPassword = req.body.password;
    if (hashedPassword) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(hashedPassword, salt);
    } else {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash('Password123!', salt);
    }

    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role,
      active: req.body.active !== undefined ? req.body.active : true,
      departmentId: selectedDepartment ? selectedDepartment.id : null,
      employeeId: req.body.employeeId || null,
      designation: req.body.designation || null,
      reportingManagerId: req.body.reportingManagerId || null,
      phone: req.body.phone || null,
      qualifications: req.body.qualifications || null,
      startDate: req.body.startDate || null
    });

    // Notify the reporting manager when a new team member is onboarded (§5.1 alert)
    if (reportingManager) {
      await Notification.create({
        message: `${user.firstName || user.username} has joined as your direct report.`,
        type: 'Info',
        userId: reportingManager.id,
        module: 'User',
        entityType: 'User',
        entityId: String(user.id),
        triggerType: 'Manual',
        priority: 'Low',
        status: 'Pending'
      });
    }

    const response = user.toJSON();
    delete response.password;
    response.department = selectedDepartment ? selectedDepartment.name : null;
    response.departmentDetails = selectedDepartment ? { id: selectedDepartment.id, name: selectedDepartment.name } : null;
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update user
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.role) {
      const roleExists = await Role.findOne({ where: { name: req.body.role } });
      if (!roleExists) {
        return res.status(400).json({ message: `Invalid role "${req.body.role}" — see /api/admin/roles for valid options` });
      }
    }

    if (req.body.reportingManagerId !== undefined && req.body.reportingManagerId !== null) {
      if (Number(req.body.reportingManagerId) === user.id) {
        return res.status(400).json({ message: 'A user cannot be their own reporting manager' });
      }
      const reportingManager = await User.findByPk(req.body.reportingManagerId);
      if (!reportingManager) {
        return res.status(400).json({ message: 'Invalid reportingManagerId' });
      }
    }

    let selectedDepartment = null;
    if (req.body.departmentId !== undefined) {
      selectedDepartment = await Department.findByPk(req.body.departmentId);
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid departmentId' });
      }
    } else if (req.body.department !== undefined) {
      selectedDepartment = await Department.findOne({ where: { name: req.body.department } });
      if (!selectedDepartment) {
        return res.status(400).json({ message: 'Invalid department name' });
      }
    }

    const wasActive = user.active;

    const updateData = {
      username: req.body.username || user.username,
      email: req.body.email || user.email,
      firstName: req.body.firstName !== undefined ? req.body.firstName : user.firstName,
      lastName: req.body.lastName !== undefined ? req.body.lastName : user.lastName,
      role: req.body.role || user.role,
      active: req.body.active !== undefined ? req.body.active : user.active,
      departmentId: selectedDepartment ? selectedDepartment.id : user.departmentId,
      employeeId: req.body.employeeId !== undefined ? req.body.employeeId : user.employeeId,
      designation: req.body.designation !== undefined ? req.body.designation : user.designation,
      reportingManagerId: req.body.reportingManagerId !== undefined ? req.body.reportingManagerId : user.reportingManagerId,
      phone: req.body.phone !== undefined ? req.body.phone : user.phone,
      qualifications: req.body.qualifications !== undefined ? req.body.qualifications : user.qualifications,
      startDate: req.body.startDate !== undefined ? req.body.startDate : user.startDate
    };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.update(updateData);

    // Notify Admins when a profile is deactivated (offboarding trigger, §5.1 alert)
    if (wasActive && updateData.active === false) {
      const admins = await User.findAll({ where: { role: 'Admin', active: true } });
      for (const admin of admins) {
        await Notification.create({
          message: `${user.firstName || user.username} has been deactivated — review the offboarding checklist.`,
          type: 'Warning',
          userId: admin.id,
          module: 'User',
          entityType: 'User',
          entityId: String(user.id),
          triggerType: 'Manual',
          priority: 'Medium',
          status: 'Pending'
        });
      }
    }

    await user.reload({
      include: [
        { association: 'departmentDetails', attributes: ['id', 'name'] },
        { association: 'reportingManager', attributes: PROFILE_ATTRS }
      ]
    });

    const response = user.toJSON();
    delete response.password;
    response.department = user.departmentDetails?.name || null;
    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Automated DB backup management (Launch Readiness Checklist §1) ---
// Lets an Admin verify the automated schedule is actually producing backups,
// and trigger an on-demand backup before risky operations (e.g. a migration)
// without needing shell/CLI access to the server.
router.get('/backups', (req, res) => {
  try {
    const { listBackups } = require('../services/backupService');
    res.json(listBackups());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/backups/run', async (req, res) => {
  try {
    const { runBackup } = require('../services/backupService');
    const result = await runBackup();
    if (!result.ok) return res.status(500).json({ message: result.reason || 'Backup failed' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalProjects, totalActivities] = await Promise.all([
      User.count(),
      User.count({ where: { active: true } }),
      Project.count(),
      Activity.count()
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalProjects,
      totalActivities
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;