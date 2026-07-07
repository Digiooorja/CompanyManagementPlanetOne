const express = require('express');
const router = express.Router();
const HseIncident = require('../models/HseIncident');
const HseExposureRecord = require('../models/HseExposureRecord');

// GET /metrics - TRIR/LTIF safety metrics roll-up. Registered before `/:id`
// so it isn't swallowed by that param route (same convention as
// risks.js's /matrix-config and budgetLines.js's /summary).
//
// TRIR (Total Recordable Incident Rate) = recordable incidents × 200,000 / exposure hours
// LTIF (Lost Time Injury Frequency)     = lost-time incidents × 1,000,000 / exposure hours
// Exposure hours are now sourced from real recorded data in
// `hse_exposure_records` (see POST/GET /exposure-hours below), summed for
// the requested block. The `totalManHours` query param is still honoured as
// a one-off manual override (e.g. testing a scenario) and takes precedence
// over the stored total when supplied.
router.get('/metrics', async (req, res) => {
  try {
    const { blockId, totalManHours } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;

    const incidents = await HseIncident.findAll({ where });

    const recordableCount = incidents.filter((i) => i.isRecordable).length;
    const lostTimeCount = incidents.filter((i) => Number(i.manHoursLost || 0) > 0).length;
    const totalManHoursLost = incidents.reduce((sum, i) => sum + Number(i.manHoursLost || 0), 0);
    const openCount = incidents.filter((i) => i.status !== 'Closed').length;
    const overdueCount = incidents.filter((i) => i.daysOverdue > 0).length;

    const exposureWhere = {};
    if (blockId) exposureWhere.blockId = blockId;
    const exposureRecords = await HseExposureRecord.findAll({ where: exposureWhere });
    const recordedExposureHours = exposureRecords.reduce((sum, r) => sum + Number(r.manHours || 0), 0);

    const exposureHours = totalManHours ? Number(totalManHours) : (recordedExposureHours > 0 ? recordedExposureHours : null);
    const trir = exposureHours ? Number(((recordableCount * 200000) / exposureHours).toFixed(2)) : null;
    const ltif = exposureHours ? Number(((lostTimeCount * 1000000) / exposureHours).toFixed(2)) : null;

    res.json({
      totalIncidents: incidents.length,
      recordableCount,
      lostTimeCount,
      totalManHoursLost,
      openCount,
      overdueCount,
      exposureHours,
      exposureSource: totalManHours ? 'override' : (recordedExposureHours > 0 ? 'recorded' : 'none'),
      trir,
      ltif
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Exposure hours (recorded man-hours worked, feeds TRIR/LTIF above) ----
// Registered before `/:id` for the same reason as `/metrics`.

// GET all exposure-hour records — filterable by blockId
router.get('/exposure-hours', async (req, res) => {
  try {
    const { blockId } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    const records = await HseExposureRecord.findAll({ where, order: [['periodStart', 'DESC'], ['createdAt', 'DESC']] });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new exposure-hours record
router.post('/exposure-hours', async (req, res) => {
  try {
    const record = await HseExposureRecord.create({
      blockId: req.body.blockId || null,
      periodLabel: req.body.periodLabel,
      periodStart: req.body.periodStart || null,
      periodEnd: req.body.periodEnd || null,
      manHours: req.body.manHours || 0,
      recordedById: req.user?.id || null,
      notes: req.body.notes || null
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update an exposure-hours record
router.put('/exposure-hours/:id', async (req, res) => {
  try {
    const record = await HseExposureRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Exposure-hours record not found' });

    await record.update({
      blockId: req.body.blockId !== undefined ? req.body.blockId : record.blockId,
      periodLabel: req.body.periodLabel || record.periodLabel,
      periodStart: req.body.periodStart !== undefined ? req.body.periodStart : record.periodStart,
      periodEnd: req.body.periodEnd !== undefined ? req.body.periodEnd : record.periodEnd,
      manHours: req.body.manHours !== undefined ? req.body.manHours : record.manHours,
      notes: req.body.notes !== undefined ? req.body.notes : record.notes
    });

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an exposure-hours record
router.delete('/exposure-hours/:id', async (req, res) => {
  try {
    const record = await HseExposureRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Exposure-hours record not found' });
    await record.destroy();
    res.json({ message: 'Exposure-hours record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all HSE incidents — filterable by blockId, status and severity
router.get('/', async (req, res) => {
  try {
    const { blockId, status, severity } = req.query;
    const where = {};
    if (blockId) where.blockId = blockId;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const incidents = await HseIncident.findAll({ where, order: [['occurredAt', 'DESC']] });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET HSE incident by ID
router.get('/:id', async (req, res) => {
  try {
    const incident = await HseIncident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ message: 'HSE incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new HSE incident
router.post('/', async (req, res) => {
  try {
    const incident = await HseIncident.create({
      blockId: req.body.blockId || null,
      incidentType: req.body.incidentType || 'Observation',
      severity: req.body.severity || 'Low',
      occurredAt: req.body.occurredAt || null,
      location: req.body.location || null,
      description: req.body.description || null,
      reportedBy: req.body.reportedBy || null,
      immediateAction: req.body.immediateAction || null,
      rootCause: req.body.rootCause || null,
      correctiveAction: req.body.correctiveAction || null,
      actionOwner: req.body.actionOwner || null,
      actionDueDate: req.body.actionDueDate || null,
      status: req.body.status || 'Open',
      manHoursLost: req.body.manHoursLost || 0,
      isRecordable: !!req.body.isRecordable
    });
    res.status(201).json(incident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update HSE incident — direct transition to Closed is rejected; use
// POST /:id/close, which enforces the rootCause + correctiveAction gate
// (§7 business rule, mirrors the AFE reconciliation-sign-off pattern in
// backend/routes/finance.js).
router.put('/:id', async (req, res) => {
  try {
    const incident = await HseIncident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ message: 'HSE incident not found' });

    if (req.body.status === 'Closed' && incident.status !== 'Closed') {
      return res.status(400).json({
        message: 'Closing an HSE incident requires rootCause and correctiveAction — use POST /:id/close instead'
      });
    }

    await incident.update({
      blockId: req.body.blockId !== undefined ? req.body.blockId : incident.blockId,
      incidentType: req.body.incidentType || incident.incidentType,
      severity: req.body.severity || incident.severity,
      occurredAt: req.body.occurredAt !== undefined ? req.body.occurredAt : incident.occurredAt,
      location: req.body.location !== undefined ? req.body.location : incident.location,
      description: req.body.description !== undefined ? req.body.description : incident.description,
      reportedBy: req.body.reportedBy !== undefined ? req.body.reportedBy : incident.reportedBy,
      immediateAction: req.body.immediateAction !== undefined ? req.body.immediateAction : incident.immediateAction,
      rootCause: req.body.rootCause !== undefined ? req.body.rootCause : incident.rootCause,
      correctiveAction: req.body.correctiveAction !== undefined ? req.body.correctiveAction : incident.correctiveAction,
      actionOwner: req.body.actionOwner !== undefined ? req.body.actionOwner : incident.actionOwner,
      actionDueDate: req.body.actionDueDate !== undefined ? req.body.actionDueDate : incident.actionDueDate,
      status: req.body.status && req.body.status !== 'Closed' ? req.body.status : incident.status,
      manHoursLost: req.body.manHoursLost !== undefined ? req.body.manHoursLost : incident.manHoursLost,
      isRecordable: req.body.isRecordable !== undefined ? !!req.body.isRecordable : incident.isRecordable
    });

    res.json(incident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /:id/close - close an incident, gated on rootCause + correctiveAction
// being recorded (either already on the record or supplied in this request).
router.post('/:id/close', async (req, res) => {
  try {
    const incident = await HseIncident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ message: 'HSE incident not found' });
    if (incident.status === 'Closed') {
      return res.status(400).json({ message: 'This incident is already closed' });
    }

    const rootCause = req.body.rootCause !== undefined ? req.body.rootCause : incident.rootCause;
    const correctiveAction = req.body.correctiveAction !== undefined ? req.body.correctiveAction : incident.correctiveAction;

    if (!rootCause || !correctiveAction) {
      return res.status(400).json({ message: 'rootCause and correctiveAction are required to close an HSE incident' });
    }

    await incident.update({
      rootCause,
      correctiveAction,
      status: 'Closed',
      closedById: req.user?.id || null,
      closedAt: new Date()
    });

    res.json(incident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE HSE incident
router.delete('/:id', async (req, res) => {
  try {
    const incident = await HseIncident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ message: 'HSE incident not found' });
    await incident.destroy();
    res.json({ message: 'HSE incident deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
