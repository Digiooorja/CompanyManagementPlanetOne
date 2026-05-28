const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Finance = require('../models/Finance');
const Activity = require('../models/Activity');

router.use(authMiddleware);

function isFinanceOrAccounts(user) {
  const department = String(user?.department || '').toLowerCase();
  return user?.role === 'Admin' || department.includes('finance') || department.includes('account');
}

function canApprovePaid(user, approvalDepartment) {
  if (user?.role === 'Admin') return true;
  if (!approvalDepartment) return isFinanceOrAccounts(user);
  const userDept = String(user.department || '').toLowerCase();
  const requiredDept = String(approvalDepartment || '').toLowerCase();
  return requiredDept.includes(userDept) || userDept.includes(requiredDept) || isFinanceOrAccounts(user);
}

// GET all finance items
router.get('/', async (req, res) => {
  try {
    const items = await Finance.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET finance item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new finance item
router.post('/', async (req, res) => {
  try {
    if (!isFinanceOrAccounts(req.user)) {
      return res.status(403).json({ message: 'Finance or Accounts access required' });
    }

    const payload = {
      item: req.body.item,
      amount: req.body.amount,
      category: req.body.category,
      type: req.body.type,
      recordType: req.body.recordType || 'Entry',
      activityId: req.body.activityId || null,
      approvalDepartment: req.body.approvalDepartment || null,
      status: req.body.status || 'Pending',
      invoiceNumber: req.body.invoiceNumber || null,
      afeNumber: req.body.afeNumber || null,
      transactionDetails: req.body.transactionDetails || null,
      transactionDate: req.body.transactionDate || null,
      date: req.body.date || null
    };

    if (payload.status === 'Paid' && !payload.transactionDetails) {
      return res.status(400).json({ message: 'Transaction details are required when marking an item as Paid' });
    }

    const newItem = await Finance.create(payload);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update finance item
router.put('/:id', async (req, res) => {
  try {
    if (!isFinanceOrAccounts(req.user)) {
      return res.status(403).json({ message: 'Finance or Accounts access required' });
    }

    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    const requestedStatus = req.body.status || item.status;
    const approvalDepartment = req.body.approvalDepartment || item.approvalDepartment;

    if (requestedStatus === 'Paid' && item.status !== 'Paid') {
      if (!req.body.transactionDetails && !item.transactionDetails) {
        return res.status(400).json({ message: 'Transaction details are required to mark an item as Paid' });
      }
      if (!canApprovePaid(req.user, approvalDepartment)) {
        return res.status(403).json({ message: 'Approval from the assigned department is required to clear this invoice' });
      }
    }

    await item.update({
      item: req.body.item || item.item,
      amount: req.body.amount || item.amount,
      category: req.body.category || item.category,
      type: req.body.type || item.type,
      recordType: req.body.recordType || item.recordType,
      activityId: req.body.activityId !== undefined ? req.body.activityId : item.activityId,
      approvalDepartment: req.body.approvalDepartment || item.approvalDepartment,
      status: requestedStatus,
      invoiceNumber: req.body.invoiceNumber || item.invoiceNumber,
      afeNumber: req.body.afeNumber || item.afeNumber,
      transactionDetails: req.body.transactionDetails || item.transactionDetails,
      transactionDate: req.body.transactionDate || item.transactionDate,
      date: req.body.date || item.date
    });

    if (requestedStatus === 'Paid' && item.status !== 'Paid' && item.activityId) {
      const activity = await Activity.findByPk(item.activityId);
      if (activity) {
        const currentActual = Number(activity.actualCost || 0);
        const invoiceAmount = Number(item.amount || 0);
        await activity.update({ actualCost: currentActual + invoiceAmount });
      }
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE finance item
router.delete('/:id', async (req, res) => {
  try {
    if (!isFinanceOrAccounts(req.user)) {
      return res.status(403).json({ message: 'Finance or Accounts access required' });
    }

    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    await item.destroy();
    res.json({ message: 'Finance item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;