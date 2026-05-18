const sequelize = require('../database');
const Block = require('../models/Block');

async function seedBlocks() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    await Block.sync();

    const blocks = [
      {
        name: 'Deep Water',
        description: 'Large offshore deep water block with ongoing exploration and production operations.',
        status: 'Active',
        licenceStart: '2024-01-05',
        licenceExpiry: '2034-01-04',
        operator: 'BlueOcean Energy',
        workingInterest: '42%',
        area: '3,100 sq km',
        location: 'North Sea Deep Water'
      },
      {
        name: 'Shallow Water',
        description: 'Nearshore shallow water block with survey and development phase activities.',
        status: 'Active',
        licenceStart: '2025-05-10',
        licenceExpiry: '2030-05-09',
        operator: 'Coastal Energy',
        workingInterest: '35%',
        area: '1,900 sq km',
        location: 'Gulf of Mexico Coastal'
      },
      {
        name: 'On Shore',
        description: 'Onshore block focused on pipeline infrastructure and field development.',
        status: 'Active',
        licenceStart: '2024-09-15',
        licenceExpiry: '2029-09-14',
        operator: 'TerraField Resources',
        workingInterest: '28%',
        area: '4,200 sq km',
        location: 'Permian Basin'
      }
    ];

    for (const blockData of blocks) {
      const [block, created] = await Block.findOrCreate({
        where: { name: blockData.name },
        defaults: blockData
      });
      console.log(`${created ? 'Created' : 'Found'} block: ${block.name}`);
    }

    console.log('Block seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding blocks:', error);
    process.exit(1);
  }
}

seedBlocks();
