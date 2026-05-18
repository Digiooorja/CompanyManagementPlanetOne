const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../database');

// Load all models
require('../models/Project');
require('../models/Activity');
require('../models/Block');
require('../models/Document');
require('../models/Finance');
require('../models/Notification');
require('../models/Register');
require('../models/Report');
require('../models/User');
require('../models/Workflow');

async function syncDatabase() {
  try {
    console.log('Authenticating database connection...');
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    console.log('\nSynchronizing database schema...');
    await sequelize.sync({ alter: true });
    console.log('✓ Database schema synchronized');

    console.log('\nChecking activities table structure...');
    const activityTableInfo = await sequelize.getQueryInterface().describeTable('activities');
    
    console.log('\nActivities table columns:');
    Object.keys(activityTableInfo).forEach(column => {
      console.log(`  - ${column}: ${activityTableInfo[column].type}`);
    });

    console.log('\n✓ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncDatabase();
