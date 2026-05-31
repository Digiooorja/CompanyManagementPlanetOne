const sequelize = require('./database');
const Activity = require('./models/Activity');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    // Find the Subsea activity
    const subsea = await Activity.findOne({
      where: { name: { [sequelize.Sequelize.Op.like]: '%Subsea%' } },
      include: [
        {
          association: 'subActivities',
          attributes: ['id', 'name', 'progress', 'parentActivityId'],
          include: [
            {
              association: 'subActivities',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!subsea) {
      console.log('Subsea activity not found');
      return;
    }

    console.log(`=== Main Activity: ${subsea.name} (ID: ${subsea.id}) ===`);
    console.log(`Sub-activities: ${subsea.subActivities?.length || 0}\n`);

    if (subsea.subActivities) {
      subsea.subActivities.forEach((sub, idx) => {
        console.log(`${idx + 1}. ${sub.name} (ID: ${sub.id}, Progress: ${sub.progress}%)`);
        if (sub.subActivities && sub.subActivities.length > 0) {
          console.log(`   ✓ Has ${sub.subActivities.length} sub-activities:`);
          sub.subActivities.forEach(nested => {
            console.log(`     - ${nested.name} (ID: ${nested.id})`);
          });
        } else {
          console.log(`   ✗ No sub-activities`);
        }
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
