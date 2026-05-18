const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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

// Define associations after all models are loaded
const Project = require('./models/Project');
const Activity = require('./models/Activity');
const Block = require('./models/Block');

Activity.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
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
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');

    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Backend startup error:', err);
    process.exit(1);
  }
};

startServer();