const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');

// GET all workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.findAll();
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new workflow
router.post('/', async (req, res) => {
  try {
    const newWorkflow = await Workflow.create({
      title: req.body.title || req.body.name,
      type: req.body.type,
      submittedBy: req.body.submittedBy,
      submitDate: req.body.submitDate,
      currentStep: req.body.currentStep,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      description: req.body.description,
      amount: req.body.amount,
      steps: req.body.steps || [],
      status: req.body.status || 'Awaiting Action'
    });
    res.status(201).json(newWorkflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update workflow
router.put('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

    await workflow.update({
      title: req.body.title || req.body.name || workflow.title,
      type: req.body.type || workflow.type,
      submittedBy: req.body.submittedBy || workflow.submittedBy,
      submitDate: req.body.submitDate || workflow.submitDate,
      currentStep: req.body.currentStep || workflow.currentStep,
      priority: req.body.priority || workflow.priority,
      dueDate: req.body.dueDate || workflow.dueDate,
      description: req.body.description || workflow.description,
      amount: req.body.amount !== undefined ? req.body.amount : workflow.amount,
      steps: req.body.steps || workflow.steps,
      status: req.body.status || workflow.status
    });

    res.json(workflow);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE workflow
router.delete('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findByPk(req.params.id);
    if (!workflow) return res.status(404).json({ message: 'Workflow not found' });

    await workflow.destroy();
    res.json({ message: 'Workflow deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;