const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const ReportDefinition = require('../models/ReportDefinition');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

// ---- Report catalogue (definitions) ----
// These routes must come before the generic '/:id' routes below so
// "/definitions" isn't matched as an :id.

// GET the report catalogue (name/category/frequency/format/block/last-generated)
router.get('/definitions', async (req, res) => {
  try {
    const definitions = await ReportDefinition.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
    res.json(definitions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a single report definition
router.get('/definitions/:id', async (req, res) => {
  try {
    const definition = await ReportDefinition.findByPk(req.params.id);
    if (!definition) return res.status(404).json({ message: 'Report definition not found' });
    res.json(definition);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new report definition (catalogue entry) — requires reports.manage
router.post('/definitions', authMiddleware, requirePermission('reports.manage'), async (req, res) => {
  try {
    const definition = await ReportDefinition.create({
      name: req.body.name,
      category: req.body.category || 'Operations',
      description: req.body.description || null,
      frequency: req.body.frequency || 'Monthly',
      formats: Array.isArray(req.body.formats) && req.body.formats.length > 0 ? req.body.formats : ['PDF'],
      block: req.body.block || 'All Blocks'
    });
    res.status(201).json(definition);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a report definition — requires reports.manage
router.put('/definitions/:id', authMiddleware, requirePermission('reports.manage'), async (req, res) => {
  try {
    const definition = await ReportDefinition.findByPk(req.params.id);
    if (!definition) return res.status(404).json({ message: 'Report definition not found' });

    await definition.update({
      name: req.body.name || definition.name,
      category: req.body.category || definition.category,
      description: req.body.description !== undefined ? req.body.description : definition.description,
      frequency: req.body.frequency || definition.frequency,
      formats: Array.isArray(req.body.formats) && req.body.formats.length > 0 ? req.body.formats : definition.formats,
      block: req.body.block !== undefined ? req.body.block : definition.block
    });

    res.json(definition);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a report definition — requires reports.manage
router.delete('/definitions/:id', authMiddleware, requirePermission('reports.manage'), async (req, res) => {
  try {
    const definition = await ReportDefinition.findByPk(req.params.id);
    if (!definition) return res.status(404).json({ message: 'Report definition not found' });
    await definition.destroy();
    res.json({ message: 'Report definition deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /definitions/:id/generate — logs a real generated-report instance
// (appears in the "Recently Generated Reports" list) and bumps the
// definition's lastGeneratedDate. Requires login so createdBy is genuine.
router.post('/definitions/:id/generate', authMiddleware, async (req, res) => {
  try {
    const definition = await ReportDefinition.findByPk(req.params.id);
    if (!definition) return res.status(404).json({ message: 'Report definition not found' });

    const generatedDate = new Date();
    const formats = Array.isArray(definition.formats) ? definition.formats : ['PDF'];
    const format = req.body?.format && formats.includes(req.body.format) ? req.body.format : formats[0];
    const typeByCategory = { Operations: 'Activity', Financial: 'Finance', HSE: 'Custom', Performance: 'Project' };

    const report = await Report.create({
      title: definition.name,
      content: `${definition.name} (${definition.category}) generated for ${definition.block || 'All Blocks'} in ${format} format.`,
      generatedDate,
      type: typeByCategory[definition.category] || 'Custom',
      createdBy: req.user?.id || null,
      definitionId: definition.id
    });

    await definition.update({ lastGeneratedDate: generatedDate });

    res.status(201).json({ report, definition });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ---- Generated report instances (log / "Recently Generated Reports") ----

// GET all reports, most recently generated first
router.get('/', async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['generatedDate', 'DESC']] });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newReport = await Report.create({
      title: req.body.title,
      content: req.body.content,
      generatedDate: req.body.generatedDate,
      type: req.body.type,
      createdBy: req.body.createdBy || req.user?.id || null,
      definitionId: req.body.definitionId || null
    });
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update report
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    await report.update({
      title: req.body.title || report.title,
      content: req.body.content || report.content,
      generatedDate: req.body.generatedDate || report.generatedDate,
      type: req.body.type || report.type,
      createdBy: req.body.createdBy || report.createdBy
    });

    res.json(report);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE report
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    await report.destroy();
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;