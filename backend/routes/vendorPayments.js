const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const VendorInvoice = require('../models/VendorInvoice');

const BUCKETS = ['Current', '0-30', '31-60', '61-90', '90+'];

// GET all vendor invoices — filterable by blockId, status and aging bucket.
// `bucket` is evaluated in application code (not SQL) since agingBucket is a
// VIRTUAL field, same approach the Notification Engine uses for VIRTUAL
// threshold fields (see backend/services/notificationEngine.js).
router.get('/', async (req, res) => {
  try {
    const { blockId, status, bucket } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;

    let invoices = await VendorInvoice.findAll({ where, order: [['dueDate', 'ASC']] });
    if (bucket) {
      invoices = invoices.filter((inv) => inv.agingBucket === bucket);
    }

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /aging-summary - totals per bucket/currency, aggregated directly from
// the same line-item rows returned by GET / (mirrors budgetLines/summary —
// the roll-up always equals the sum of the underlying invoices by construction).
router.get('/aging-summary', async (req, res) => {
  try {
    const invoices = await VendorInvoice.findAll({ where: { status: { [Op.ne]: 'Paid' } } });

    const groups = new Map();
    for (const invoice of invoices) {
      const key = `${invoice.agingBucket}|${invoice.currency}`;
      if (!groups.has(key)) {
        groups.set(key, {
          bucket: invoice.agingBucket,
          currency: invoice.currency,
          invoiceCount: 0,
          totalOutstanding: 0
        });
      }
      const g = groups.get(key);
      g.invoiceCount += 1;
      g.totalOutstanding += invoice.outstandingAmount;
    }

    // Guarantee every bucket/currency combo is present (zero-filled) so the
    // frontend aging matrix never has to guess about missing cells.
    const currencies = ['GHS', 'USD'];
    for (const bucket of BUCKETS) {
      for (const currency of currencies) {
        const key = `${bucket}|${currency}`;
        if (!groups.has(key)) {
          groups.set(key, { bucket, currency, invoiceCount: 0, totalOutstanding: 0 });
        }
      }
    }

    res.json(Array.from(groups.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET vendor invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Vendor invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new vendor invoice
router.post('/', async (req, res) => {
  try {
    const invoice = await VendorInvoice.create({
      vendor: req.body.vendor,
      invoiceNumber: req.body.invoiceNumber || null,
      blockId: req.body.blockId || null,
      financeId: req.body.financeId || null,
      invoiceDate: req.body.invoiceDate || null,
      dueDate: req.body.dueDate || null,
      amount: req.body.amount || 0,
      currency: req.body.currency || 'USD',
      amountPaid: req.body.amountPaid || 0,
      status: req.body.status || 'Open',
      notes: req.body.notes || null
    });
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update vendor invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Vendor invoice not found' });

    await invoice.update({
      vendor: req.body.vendor !== undefined ? req.body.vendor : invoice.vendor,
      invoiceNumber: req.body.invoiceNumber !== undefined ? req.body.invoiceNumber : invoice.invoiceNumber,
      blockId: req.body.blockId !== undefined ? req.body.blockId : invoice.blockId,
      financeId: req.body.financeId !== undefined ? req.body.financeId : invoice.financeId,
      invoiceDate: req.body.invoiceDate !== undefined ? req.body.invoiceDate : invoice.invoiceDate,
      dueDate: req.body.dueDate !== undefined ? req.body.dueDate : invoice.dueDate,
      amount: req.body.amount !== undefined ? req.body.amount : invoice.amount,
      currency: req.body.currency || invoice.currency,
      amountPaid: req.body.amountPaid !== undefined ? req.body.amountPaid : invoice.amountPaid,
      status: req.body.status || invoice.status,
      notes: req.body.notes !== undefined ? req.body.notes : invoice.notes
    });

    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE vendor invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Vendor invoice not found' });
    await invoice.destroy();
    res.json({ message: 'Vendor invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
