const bcrypt = require('bcryptjs');
const sequelize = require('../database');
const User = require('../models/User');
const Department = require('../models/Department');

async function seedDemoUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    await User.sync();
    await Department.sync();

    const demoEmail = 'demo@example.com';
    const demoPassword = 'Demo1234';
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    const existingUser = await User.findOne({ where: { email: demoEmail } });
    if (existingUser) {
      console.log(`Found demo user: ${existingUser.email}`);
      process.exit(0);
    }

    const [department] = await Department.findOrCreate({
      where: { name: 'Operations' }
    });

    const user = await User.create({
      username: 'demo_user',
      email: demoEmail,
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      departmentId: department.id,
      department: department.name,
      role: 'User',
      active: true
    });

    console.log(`Created demo user: ${user.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo user:', error);
    process.exit(1);
  }
}

seedDemoUser();
