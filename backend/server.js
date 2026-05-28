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
require('./models/Register');
require('./models/Report');
require('./models/Risk');
require('./models/User');
require('./models/Workflow');
require('./models/Department');
require('./models/Comment');

// Define associations after all models are loaded
const Project = require('./models/Project');
const Activity = require('./models/Activity');
const Finance = require('./models/Finance');
const Block = require('./models/Block');
const User = require('./models/User');
const Department = require('./models/Department');
const Comment = require('./models/Comment');

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

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

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
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Apply schema changes without dropping existing data so startup preserves records.
    const queryInterface = sequelize.getQueryInterface();
    await sequelize.sync({ alter: true, force: false });
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

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Backend startup error:', err);
    process.exit(1);
  }
};

startServer();