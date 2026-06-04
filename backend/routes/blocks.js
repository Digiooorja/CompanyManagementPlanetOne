const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const Project = require('../models/Project');
const Licence = require('../models/Licence');

function sumDecimalField(records, field) {
  if (!Array.isArray(records)) return 0;
  return records.reduce((sum, item) => sum + Number(item?.[field] ?? 0), 0);
}

function normalizeProjectBudget(project) {
  const projectJson = project.toJSON();
  const activityBudget = Array.isArray(projectJson.activities)
    ? sumDecimalField(projectJson.activities, 'plannedCost')
    : 0;
  const activitySpent = Array.isArray(projectJson.activities)
    ? sumDecimalField(projectJson.activities, 'actualCost')
    : 0;

  return {
    ...projectJson,
    budget: Array.isArray(projectJson.activities) && projectJson.activities.length > 0
      ? activityBudget
      : Number(projectJson.budget ?? 0),
    spent: Array.isArray(projectJson.activities) && projectJson.activities.length > 0
      ? activitySpent
      : Number(projectJson.spent ?? 0),
  };
}

// GET all blocks
router.get('/', async (req, res) => {
  try {
    const blocks = await Block.findAll();
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET block by ID
router.get('/:id', async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    const blockProjects = await Project.findAll({
      where: { blockId: block.id },
      include: [
        {
          association: 'activities',
          where: { parentActivityId: null },
          required: false,
          attributes: ['plannedCost', 'actualCost']
        }
      ]
    });

    const normalizedProjects = blockProjects.map((proj) => normalizeProjectBudget(proj));
    const blockBudget = sumDecimalField(normalizedProjects, 'budget');
    const blockSpent = sumDecimalField(normalizedProjects, 'spent');

    const blockJson = block.toJSON();
    res.json({
      ...blockJson,
      budget: blockBudget,
      spent: blockSpent,
      projects: normalizedProjects,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new block
router.post('/', async (req, res) => {
  try {
    const block = await Block.create({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      operator: req.body.operator || null,
      workingInterest: req.body.workingInterest || null,
      area: req.body.area || null,
      location: req.body.location || null,
    });

    if (req.body.newLicence && req.body.newLicence.licenceNumber) {
      await Licence.create({
        licenceNumber: req.body.newLicence.licenceNumber,
        licenceType: req.body.newLicence.licenceType || 'Exploration',
        blockIds: [block.id],
        issuedBy: req.body.newLicence.issuedBy || null,
        startDate: req.body.newLicence.startDate || null,
        expiryDate: req.body.newLicence.expiryDate || null,
        status: req.body.newLicence.status || 'Active',
      });
    }

    res.status(201).json(block);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update block
router.put('/:id', async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    await block.update({
      name: req.body.name || block.name,
      description: req.body.description || block.description,
      status: req.body.status || block.status,
      operator: req.body.operator || block.operator,
      workingInterest: req.body.workingInterest || block.workingInterest,
      area: req.body.area || block.area,
      location: req.body.location || block.location,
    });

    res.json(block);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE block
router.delete('/:id', async (req, res) => {
  try {
    const block = await Block.findByPk(req.params.id);
    if (!block) return res.status(404).json({ message: 'Block not found' });

    await block.destroy();
    res.json({ message: 'Block deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;