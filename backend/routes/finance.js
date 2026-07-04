const express = require('express');
const router = express.Router();
const { optionalAuthMiddleware } = require('../middleware/auth');
const Finance = require('../models/Finance');
const Activity = require('../models/Activity');
const Project = require('../models/Project');

router.use(optionalAuthMiddleware);

function isFinanceOrAccounts(user) {
  const department = String(user?.department || '').toLowerCase();
  return user?.role === 'Admin' || department.includes('finance') || department.includes('account');
}

function canApproveFinance(user, approvalDepartment) {
  if (user?.role === 'Admin') return true;
  if (isFinanceOrAccounts(user)) return true;
  if (!approvalDepartment) return false;

  const userDept = String(user.department || '').toLowerCase();
  const requiredDept = String(approvalDepartment || '').toLowerCase();
  return requiredDept.includes(userDept) || userDept.includes(requiredDept);
}

function canApprovePaid(user, approvalDepartment) {
  if (user?.role === 'Admin') return true;
  if (!approvalDepartment) return isFinanceOrAccounts(user);
  const userDept = String(user.department || '').toLowerCase();
  const requiredDept = String(approvalDepartment || '').toLowerCase();
  return requiredDept.includes(userDept) || userDept.includes(requiredDept) || isFinanceOrAccounts(user);
}

// Recomputes an AFE's committed/actual-to-date from the Invoice/Entry rows
// linked to it via `afeId` — the "automatic aggregation of actuals from
// linked vendor payments" key feature (§5.10). Uses `.save()` so the
// variancePercent beforeSave hook still runs.
async function recalcAfeActuals(afeId) {
  if (!afeId) return;
  const afe = await Finance.findByPk(afeId);
  if (!afe || afe.recordType !== 'AFE') return;

  const linked = await Finance.findAll({ where: { afeId } });
  const actualToDate = linked
    .filter((f) => f.status === 'Paid')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const committedAmount = linked
    .filter((f) => ['Approved', 'Under Review', 'Pending'].includes(f.status))
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  afe.actualToDate = actualToDate;
  afe.committedAmount = committedAmount;
  await afe.save();
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

// GET next AFE number (projectId and/or activityId optional)
router.get('/next-afe', async (req, res) => {
  try {
    const { projectId, activityId } = req.query;
    let activity = null;
    let project = null;
    let count = 0;

    if (activityId) {
      activity = await Activity.findByPk(activityId);
      if (activity) project = await Project.findByPk(activity.projectId);
      count = await Finance.count({ where: { recordType: 'AFE', activityId: Number(activityId) } });
    } else if (projectId) {
      const acts = await Activity.findAll({ where: { projectId: Number(projectId) }, attributes: ['id'] });
      const actIds = acts.map((a) => a.id);
      if (actIds.length > 0) {
        count = await Finance.count({ where: { recordType: 'AFE', activityId: actIds } });
      } else {
        count = 0;
      }
      project = await Project.findByPk(projectId);
    } else {
      count = await Finance.count({ where: { recordType: 'AFE' } });
    }

    const projectCode = project ? String(project.name).replace(/\s+/g, '').toUpperCase().slice(0,5) : `P${projectId || '00'}`;
    const activityCode = activity ? String(activity.name).replace(/\s+/g, '').toUpperCase().slice(0,5) : (activityId ? `A${activityId}` : 'NA');
    const nextSeq = Number(count || 0) + 1;
    const seqStr = String(nextSeq).padStart(3, '0');
    const afeNumber = `${projectCode}-${activityCode}-${seqStr}`;

    res.json({ afeNumber, next: nextSeq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET pending AFEs for dashboard
router.get('/pending', async (req, res) => {
  try {
    const items = await Finance.findAll({
      where: {
        recordType: 'AFE',
        status: ['Pending', 'Under Review']
      },
      include: [{
        model: Activity,
        as: 'activity',
        include: [{
          model: Project,
          as: 'project'
        }]
      }]
    });
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
      afeId: req.body.afeId || null,
      committedAmount: req.body.committedAmount || 0,
      actualToDate: req.body.actualToDate || 0,
      approvalDate: req.body.approvalDate || null,
      approvingAuthority: req.body.approvingAuthority || null,
      transactionDetails: req.body.transactionDetails || null,
      transactionDate: req.body.transactionDate || null,
      date: req.body.date || null
    };

    if (payload.status === 'Paid' && !payload.transactionDetails) {
      return res.status(400).json({ message: 'Transaction details are required when marking an item as Paid' });
    }

    const newItem = await Finance.create(payload);

    if (newItem.afeId) {
      await recalcAfeActuals(newItem.afeId);
    }

    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update finance item
router.put('/:id', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    const requestedStatus = req.body.status || item.status;
    const approvalDepartment = req.body.approvalDepartment || item.approvalDepartment;

    // AFE closure requires reconciliation sign-off (§5.10 business rule) —
    // it cannot be set via a plain field edit, only via POST /:id/close.
    if (item.recordType === 'AFE' && requestedStatus === 'Closed' && item.status !== 'Closed') {
      return res.status(400).json({
        message: 'AFE closure requires reconciliation sign-off — use POST /:id/close instead'
      });
    }

    if (requestedStatus !== item.status && !canApproveFinance(req.user, approvalDepartment)) {
      return res.status(403).json({ message: 'Approval from the assigned department or Finance/Accounts access is required' });
    }

    if (requestedStatus === 'Paid' && item.status !== 'Paid') {
      if (!req.body.transactionDetails && !item.transactionDetails) {
        return res.status(400).json({ message: 'Transaction details are required to mark an item as Paid' });
      }
      if (!canApprovePaid(req.user, approvalDepartment)) {
        return res.status(403).json({ message: 'Approval from the assigned department is required to clear this invoice' });
      }
    }

    const previousStatus = item.status;

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
      afeId: req.body.afeId !== undefined ? req.body.afeId : item.afeId,
      committedAmount: req.body.committedAmount !== undefined ? req.body.committedAmount : item.committedAmount,
      actualToDate: req.body.actualToDate !== undefined ? req.body.actualToDate : item.actualToDate,
      approvalDate: req.body.approvalDate !== undefined ? req.body.approvalDate : item.approvalDate,
      approvingAuthority: req.body.approvingAuthority !== undefined ? req.body.approvingAuthority : item.approvingAuthority,
      transactionDetails: req.body.transactionDetails || item.transactionDetails,
      transactionDate: req.body.transactionDate || item.transactionDate,
      approvedBy: req.body.approvedBy !== undefined ? req.body.approvedBy : item.approvedBy,
      actionComment: req.body.actionComment !== undefined ? req.body.actionComment : item.actionComment,
      date: req.body.date || item.date
    });

    if (requestedStatus === 'Paid' && previousStatus !== 'Paid' && item.activityId) {
      const activity = await Activity.findByPk(item.activityId);
      if (activity) {
        const currentActual = Number(activity.actualCost || 0);
        const invoiceAmount = Number(item.amount || 0);
        await activity.update({ actualCost: currentActual + invoiceAmount });
      }
    }

    // Keep the governing AFE's committed/actual-to-date in sync whenever a
    // linked payment's status changes (§5.10 "automatic aggregation").
    if (item.afeId && requestedStatus !== previousStatus) {
      await recalcAfeActuals(item.afeId);
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/create-supplement - Supplementary AFE workflow (§5.10): creates
// a new AFE row chained to the original via parentAfeId, for when projected
// spend (committed + actual) exceeds the authorised amount.
router.post('/:id/create-supplement', async (req, res) => {
  try {
    if (!isFinanceOrAccounts(req.user)) {
      return res.status(403).json({ message: 'Finance or Accounts access required' });
    }

    const original = await Finance.findByPk(req.params.id);
    if (!original) return res.status(404).json({ message: 'AFE not found' });
    if (original.recordType !== 'AFE') {
      return res.status(400).json({ message: 'Supplementary AFEs can only be created against an AFE record' });
    }

    const { additionalAmount, item, category } = req.body;
    if (!additionalAmount || Number(additionalAmount) <= 0) {
      return res.status(400).json({ message: 'additionalAmount is required and must be positive' });
    }

    const existingSupplements = await Finance.count({ where: { parentAfeId: original.id } });
    const nextSupplementNumber = existingSupplements + 1;

    const supplement = await Finance.create({
      item: item || `${original.item} (Supplement ${nextSupplementNumber})`,
      amount: additionalAmount,
      category: category || original.category,
      type: original.type,
      recordType: 'AFE',
      activityId: original.activityId,
      approvalDepartment: original.approvalDepartment,
      status: 'Pending',
      afeNumber: `${original.afeNumber || `AFE-${original.id}`}-S${nextSupplementNumber}`,
      parentAfeId: original.id,
      supplementNumber: nextSupplementNumber
    });

    res.status(201).json(supplement);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/close - AFE closure with mandatory reconciliation sign-off
// (§5.10 business rule / acceptance criteria).
router.post('/:id/close', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });
    if (item.recordType !== 'AFE') {
      return res.status(400).json({ message: 'Only AFE records can be closed via reconciliation sign-off' });
    }
    if (item.status === 'Closed') {
      return res.status(400).json({ message: 'This AFE is already closed' });
    }
    if (!req.body.reconciliationConfirmed) {
      return res.status(400).json({ message: 'reconciliationConfirmed must be true to close an AFE' });
    }
    if (!canApproveFinance(req.user, item.approvalDepartment)) {
      return res.status(403).json({ message: 'Finance/Accounts approval is required to close an AFE' });
    }

    await item.update({
      status: 'Closed',
      reconciledById: req.user?.id || null,
      reconciledAt: new Date(),
      actionComment: req.body.comment || item.actionComment
    });

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

// PUT delegate AFE
router.put('/:id/delegate', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    const { delegateTo, comment } = req.body;
    if (!delegateTo) return res.status(400).json({ message: 'delegateTo is required' });

    const actor = req.user?.username || req.user?.email || 'Unknown User';
    
    const history = item.delegationHistory || [];
    history.push({
      by: actor,
      action: 'Delegated',
      to: delegateTo,
      comment: comment || '',
      at: new Date().toISOString()
    });

    await item.update({
      delegatedTo: delegateTo,
      delegationHistory: history,
      status: 'Under Review'
    });

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT approve AFE
router.put('/:id/approve', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    const { comment } = req.body;
    const actor = req.user?.username || req.user?.email || 'Unknown User';
    
    const history = item.delegationHistory || [];
    history.push({
      by: actor,
      action: 'Approved',
      to: 'System',
      comment: comment || '',
      at: new Date().toISOString()
    });

    await item.update({
      approvedBy: actor,
      delegationHistory: history,
      status: 'Approved'
    });

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT reject AFE
router.put('/:id/reject', async (req, res) => {
  try {
    const item = await Finance.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Finance item not found' });

    const { comment } = req.body;
    const actor = req.user?.username || req.user?.email || 'Unknown User';
    
    const history = item.delegationHistory || [];
    history.push({
      by: actor,
      action: 'Rejected',
      to: 'System',
      comment: comment || '',
      at: new Date().toISOString()
    });

    await item.update({
      delegationHistory: history,
      status: 'Rejected'
    });

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;