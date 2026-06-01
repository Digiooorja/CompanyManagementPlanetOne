const express = require('express');
const router = express.Router();
const { Op, fn, col, where } = require('sequelize');
const Workflow = require('../models/Workflow');
const Finance = require('../models/Finance');

// GET workflow inbox items for operational overview
router.get('/inbox', async (req, res) => {
  try {
    const department = req.query.department ? String(req.query.department).trim().toLowerCase() : null;
    const statusFilter = {
      status: {
        [Op.in]: ['Awaiting Action', 'Approval Required', 'Review Required', 'Pending']
      }
    };

    const whereClause = department
      ? {
          [Op.and]: [
            statusFilter,
            {
              [Op.or]: [
                where(fn('lower', col('type')), { [Op.like]: `%${department}%` }),
                where(fn('lower', col('currentStep')), { [Op.like]: `%${department}%` }),
                where(fn('lower', col('title')), { [Op.like]: `%${department}%` })
              ]
            }
          ]
        }
      : statusFilter;

    const inboxItems = await Workflow.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    // If a department filter is provided, also include Finance AFE items assigned to that department
    if (department) {
      try {
        const afeStatuses = ['Pending', 'Under Review', 'Awaiting Action', 'Approval Required'];
        const financeAfe = await Finance.findAll({
          where: {
            recordType: 'AFE',
            approvalDepartment: { [Op.like]: `%${department}%` },
            status: { [Op.in]: afeStatuses }
          },
          order: [['createdAt', 'DESC']],
          limit: 10
        });

        // Map finance items into a common inbox shape and merge
        const financeMapped = financeAfe.map((f) => ({
          id: `finance-${f.id}`,
          title: f.item || `AFE #${f.afeNumber || f.id}`,
          type: 'AFE Approval',
          submittedBy: f.submittedBy || null,
          submitDate: f.date || f.createdAt,
          source: 'finance',
          original: f
        }));

        const workflowMapped = inboxItems.map((w) => ({
          id: `workflow-${w.id}`,
          title: w.title,
          type: w.type,
          submittedBy: w.submittedBy,
          submitDate: w.submitDate || w.createdAt,
          source: 'workflow',
          original: w
        }));

        // Merge and sort by submitDate desc
        const merged = [...financeMapped, ...workflowMapped].sort((a, b) => new Date(b.submitDate) - new Date(a.submitDate));
        return res.json(merged.slice(0, 10));
      } catch (err) {
        console.error('Error loading finance AFE for inbox:', err);
      }
    }

    res.json(inboxItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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