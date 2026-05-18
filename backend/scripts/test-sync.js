const sequelize = require('../database');

async function testSync() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Connection successful\n');

    // Load and sync models one by one
    const models = [
      { name: 'User', model: '../models/User' },
      { name: 'Block', model: '../models/Block' },
      { name: 'Project', model: '../models/Project' },
      { name: 'Activity', model: '../models/Activity' },
      { name: 'Document', model: '../models/Document' },
      { name: 'Finance', model: '../models/Finance' },
      { name: 'Notification', model: '../models/Notification' },
      { name: 'Register', model: '../models/Register' },
      { name: 'Report', model: '../models/Report' },
      { name: 'Risk', model: '../models/Risk' },
      { name: 'Workflow', model: '../models/Workflow' }
    ];

    for (const { name, model } of models) {
      try {
        console.log(`Loading model: ${name}...`);
        require(model);
        console.log(`✓ ${name} loaded\n`);
      } catch (err) {
        console.error(`✗ Error loading ${name}:`, err.message);
        console.error(err);
      }
    }

    console.log('\nAll models loaded. Now syncing full schema...');
    await sequelize.sync({ alter: false, force: false });
    console.log('✓ Database schema synchronized successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSync();
