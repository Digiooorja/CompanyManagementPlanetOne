const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// GET all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.findAll();
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
router.post('/', async (req, res) => {
  try {
    const newReport = await Report.create({
      title: req.body.title,
      content: req.body.content,
      generatedDate: req.body.generatedDate,
      type: req.body.type,
      createdBy: req.body.createdBy
    });
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update report
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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