const sequelize = require('../database');

// Load all models
require('../models/User');
require('../models/Project');
require('../models/Activity');
require('../models/Block');
require('../models/Document');
require('../models/Finance');
require('../models/Notification');
require('../models/Register');
require('../models/Report');
require('../models/Risk');
require('../models/Workflow');

// Define cross-model associations after all models are loaded
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Block = require('../models/Block');

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

// Note: Sub-activities associations (Activity.hasMany(Activity) and Activity.belongsTo(Activity))
// are already defined in the Activity model file, so we don't define them here

async function syncDatabase() {
  try {
    console.log('Attempting to connect to MySQL database...');
    await sequelize.authenticate();
    console.log('✓ MySQL connection established');

    console.log('Synchronizing database schema...');
    await sequelize.sync({ alter: false });
    console.log('✓ Database schema synchronized successfully');

    console.log('\nAll tables have been created based on the Sequelize models:');
    console.log('  - users');
    console.log('  - blocks');
    console.log('  - projects');
    console.log('  - activities');
    console.log('  - documents');
    console.log('  - finance');
    console.log('  - notifications');
    console.log('  - registers');
    console.log('  - reports');
    console.log('  - risks');
    console.log('  - workflows');

    console.log('\nNext steps:');
    console.log('  1. Run "npm run seed:blocks" to seed the three blocks');
    console.log('  2. Run "npm run seed:demo" to create a demo user');
    console.log('  3. Run "npm start" to start the backend server');

    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error.message);
    process.exit(1);
  }
}

syncDatabase();
