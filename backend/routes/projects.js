const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

function sumDecimalField(records, field) {
  if (!Array.isArray(records)) return 0;
  return records.reduce((sum, item) => sum + Number(item?.[field] ?? 0), 0);
}

function normalizeProject(project) {
  const projectJson = project.toJSON();
  const activityBudget = Array.isArray(projectJson.activities)
    ? sumDecimalField(projectJson.activities, 'plannedCost')
    : 0;
  const activitySpent = Array.isArray(projectJson.activities)
    ? sumDecimalField(projectJson.activities, 'actualCost')
    : 0;

  return {
    ...projectJson,
    budget: Array.isArray(projectJson.activities)
      ? activityBudget
      : Number(projectJson.budget ?? 0),
    spent: Array.isArray(projectJson.activities)
      ? activitySpent
      : Number(projectJson.spent ?? 0),
    block: projectJson.blockDetails?.name || projectJson.block,
  };
}

// GET all projects
router.get('/', async (req, res) => {
  try {
    const { blockId } = req.query;
    const whereClause = {};
    if (blockId) {
      whereClause.blockId = blockId;
    }

    const projects = await Project.findAll({
      where: whereClause,
      include: [
        {
          association: 'blockDetails',
          attributes: ['id', 'name']
        },
        {
          association: 'activities',
          where: { parentActivityId: null },
          required: false,
          attributes: ['plannedCost', 'actualCost']
        }
      ]
    });

    const normalizedProjects = projects.map((proj) => {
      const normalized = normalizeProject(proj);
      delete normalized.activities;
      return normalized;
    });

    res.json(normalizedProjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          association: 'blockDetails',
          attributes: ['id', 'name']
        },
        {
          association: 'activities',
          where: { parentActivityId: null },
          required: false,
          attributes: ['plannedCost', 'actualCost']
        }
      ]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const normalized = normalizeProject(project);
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new project
router.post('/', async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      blockId: req.body.blockId,
      block: req.body.block
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.update({
      name: req.body.name || project.name,
      description: req.body.description || project.description,
      status: req.body.status || project.status,
      startDate: req.body.startDate || project.startDate,
      endDate: req.body.endDate || project.endDate,
      blockId: req.body.blockId || project.blockId,
      block: req.body.block || project.block
    });

    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;