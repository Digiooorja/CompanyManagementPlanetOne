// Builds the real, data-driven table (columns + rows) behind a generated
// report, based on the ReportDefinition's category (and, if set, a specific
// block filter). This replaces the earlier placeholder behaviour where a
// "generated report" was just one hardcoded sentence with no real data.
const { Op } = require('sequelize');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const Finance = require('../models/Finance');
const HseIncident = require('../models/HseIncident');
const Block = require('../models/Block');

function fmtDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toISOString().split('T')[0];
}

function fmtMoney(value) {
  const n = Number(value || 0);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Resolves the ReportDefinition's `block` field (a plain string, e.g. a
// block name, or "All Blocks"/empty for no filter) into a usable filter flag.
function resolveBlockFilter(definition) {
  const block = definition.block;
  return block && block !== 'All Blocks' ? block : null;
}

async function buildOperationsDataset(definition) {
  const blockFilter = resolveBlockFilter(definition);
  const activities = await Activity.findAll({
    where: { parentActivityId: null },
    include: [{ association: 'project', include: [{ association: 'blockDetails' }] }],
    order: [['id', 'ASC']]
  });

  const filtered = activities.filter((a) => {
    if (!blockFilter) return true;
    const blockName = a.project?.blockDetails?.name || a.project?.block;
    return blockName === blockFilter;
  });

  const columns = [
    { key: 'name', label: 'Activity' },
    { key: 'project', label: 'Project' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'progress', label: 'Progress %' },
    { key: 'plannedStart', label: 'Planned Start' },
    { key: 'plannedEnd', label: 'Planned End' },
    { key: 'assignedTo', label: 'Assigned To' }
  ];

  const rows = filtered.map((a) => ({
    name: a.name,
    project: a.project?.name || '-',
    status: a.status,
    priority: a.priority || '-',
    progress: `${a.progress ?? 0}%`,
    plannedStart: fmtDate(a.plannedStartDate),
    plannedEnd: fmtDate(a.plannedEndDate),
    assignedTo: a.assignedTo || '-'
  }));

  const completed = filtered.filter((a) => a.status === 'Completed').length;
  const avgProgress = filtered.length
    ? Math.round(filtered.reduce((sum, a) => sum + (a.progress || 0), 0) / filtered.length)
    : 0;

  return {
    columns,
    rows,
    summaryLines: [
      `Total activities: ${filtered.length}`,
      `Completed: ${completed}`,
      `Average progress: ${avgProgress}%`
    ]
  };
}

async function buildFinancialDataset(definition) {
  const blockFilter = resolveBlockFilter(definition);
  const finances = await Finance.findAll({
    include: [{ association: 'activity', include: [{ association: 'project', include: [{ association: 'blockDetails' }] }] }],
    order: [['id', 'ASC']]
  });

  const filtered = finances.filter((f) => {
    if (!blockFilter) return true;
    const blockName = f.activity?.project?.blockDetails?.name || f.activity?.project?.block;
    return blockName === blockFilter;
  });

  const columns = [
    { key: 'item', label: 'Item' },
    { key: 'recordType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'afeNumber', label: 'AFE Number' },
    { key: 'project', label: 'Project' }
  ];

  const rows = filtered.map((f) => ({
    item: f.item,
    recordType: f.recordType,
    category: f.category,
    amount: fmtMoney(f.amount),
    status: f.status,
    afeNumber: f.afeNumber || '-',
    project: f.activity?.project?.name || '-'
  }));

  const totalAmount = filtered.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const approved = filtered.filter((f) => f.status === 'Approved' || f.status === 'Paid').length;

  return {
    columns,
    rows,
    summaryLines: [
      `Total records: ${filtered.length}`,
      `Total value: ${fmtMoney(totalAmount)}`,
      `Approved/Paid: ${approved}`
    ]
  };
}

async function buildHseDataset(definition) {
  const blockFilter = resolveBlockFilter(definition);
  const incidents = await HseIncident.findAll({ order: [['occurredAt', 'DESC']] });
  const blocks = await Block.findAll({ attributes: ['id', 'name'] });
  const blockMap = blocks.reduce((map, b) => { map[b.id] = b.name; return map; }, {});

  const filtered = incidents.filter((i) => {
    if (!blockFilter) return true;
    return blockMap[i.blockId] === blockFilter;
  });

  const columns = [
    { key: 'occurredAt', label: 'Date' },
    { key: 'incidentType', label: 'Type' },
    { key: 'severity', label: 'Severity' },
    { key: 'location', label: 'Location' },
    { key: 'block', label: 'Block' },
    { key: 'status', label: 'Status' },
    { key: 'description', label: 'Description' }
  ];

  const rows = filtered.map((i) => ({
    occurredAt: fmtDate(i.occurredAt),
    incidentType: i.incidentType,
    severity: i.severity,
    location: i.location || '-',
    block: blockMap[i.blockId] || '-',
    status: i.status,
    description: i.description || '-'
  }));

  const open = filtered.filter((i) => i.status !== 'Closed').length;
  const critical = filtered.filter((i) => i.severity === 'Critical' || i.severity === 'High').length;

  return {
    columns,
    rows,
    summaryLines: [
      `Total incidents: ${filtered.length}`,
      `Open/unresolved: ${open}`,
      `High/Critical severity: ${critical}`
    ]
  };
}

async function buildPerformanceDataset(definition) {
  const blockFilter = resolveBlockFilter(definition);
  const projects = await Project.findAll({
    include: [{ association: 'blockDetails' }],
    order: [['id', 'ASC']]
  });

  const filtered = projects.filter((p) => {
    if (!blockFilter) return true;
    return (p.blockDetails?.name || p.block) === blockFilter;
  });

  const columns = [
    { key: 'name', label: 'Project' },
    { key: 'block', label: 'Block' },
    { key: 'status', label: 'Status' },
    { key: 'completion', label: 'Completion %' },
    { key: 'budget', label: 'Budget' },
    { key: 'spent', label: 'Spent' },
    { key: 'manager', label: 'Manager' }
  ];

  const rows = filtered.map((p) => ({
    name: p.name,
    block: p.blockDetails?.name || p.block || '-',
    status: p.status,
    completion: `${p.completion ?? 0}%`,
    budget: fmtMoney(p.budget),
    spent: fmtMoney(p.spent),
    manager: p.manager || '-'
  }));

  const avgCompletion = filtered.length
    ? Math.round(filtered.reduce((sum, p) => sum + (p.completion || 0), 0) / filtered.length)
    : 0;
  const totalBudget = filtered.reduce((sum, p) => sum + Number(p.budget || 0), 0);
  const totalSpent = filtered.reduce((sum, p) => sum + Number(p.spent || 0), 0);

  return {
    columns,
    rows,
    summaryLines: [
      `Total projects: ${filtered.length}`,
      `Average completion: ${avgCompletion}%`,
      `Budget vs spent: ${fmtMoney(totalBudget)} / ${fmtMoney(totalSpent)}`
    ]
  };
}

// Returns { columns, rows, summaryLines } for the given ReportDefinition,
// pulling real current data from the DB (not placeholder text).
async function buildReportDataset(definition) {
  switch (definition.category) {
    case 'Financial':
      return buildFinancialDataset(definition);
    case 'HSE':
      return buildHseDataset(definition);
    case 'Performance':
      return buildPerformanceDataset(definition);
    case 'Operations':
    default:
      return buildOperationsDataset(definition);
  }
}

module.exports = { buildReportDataset };
