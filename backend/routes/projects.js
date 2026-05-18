const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

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
        }
      ]
    });

    const normalizedProjects = projects.map((proj) => {
      const projectJson = proj.toJSON();
      return {
        ...projectJson,
        block: projectJson.blockDetails?.name || projectJson.block,
      };
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
        }
      ]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const projectJson = project.toJSON();
    res.json({
      ...projectJson,
      block: projectJson.blockDetails?.name || projectJson.block,
    });
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