const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Block = require('../models/Block');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Document = require('../models/Document');
const Contract = require('../models/Contract');
const Licence = require('../models/Licence');
const ComplianceObligation = require('../models/ComplianceObligation');
const Correspondence = require('../models/Correspondence');
const Decision = require('../models/Decision');
const Risk = require('../models/Risk');

const RESULTS_PER_CATEGORY = 6;

// Truncates a longer text field (e.g. Decision.description, which stands in
// for a title since Decision has no dedicated title field) to a readable
// result-list label.
function truncate(text, max = 80) {
  const value = String(text || '').trim();
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

// Mirrors routes/documents.js's canViewDocument() — kept as a small local
// copy rather than requiring routes/documents.js (route modules shouldn't
// depend on each other).
function canViewDocument(user, doc) {
  if (doc.confidentialityLevel !== 'Confidential') return true;
  if (!user || !user.role || user.role === 'Guest') return false;
  if (user.role === 'Admin') return true;
  if (doc.ownerId && user.id === doc.ownerId) return true;
  const allowedRoles = Array.isArray(doc.allowedRoles) ? doc.allowedRoles : [];
  return allowedRoles.includes(user.role);
}

// GET /api/search?q=<term> - site-wide search backing the global search bar
// in the top header (Layout.tsx). Searches across the primary content
// modules and returns a flat, ranked-by-category list of
// { type, id, title, subtitle, link } so the frontend doesn't need to know
// which route each module lives at - it just renders and links to whatever
// comes back. Modules with a real per-record detail page (Block, Project,
// Activity, Document) link straight to it; modules that only have a list
// page (Task, Contract, Licence, Compliance, Correspondence, Decision, Risk)
// link to that list page with a `q` param the page can optionally use to
// pre-filter (falls back to just landing on the right page/module either way).
router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ query: q, results: [] });
    }

    const like = { [Op.like]: `%${q}%` };

    const [blocks, projects, activities, tasks, documents, contracts, licences, obligations, correspondence, decisions, risks] =
      await Promise.all([
        Block.findAll({ where: { name: like }, limit: RESULTS_PER_CATEGORY }),
        Project.findAll({ where: { name: like }, limit: RESULTS_PER_CATEGORY }),
        Activity.findAll({ where: { name: like }, limit: RESULTS_PER_CATEGORY }),
        Task.findAll({ where: { title: like }, limit: RESULTS_PER_CATEGORY }),
        Document.findAll({
          where: { [Op.or]: [{ title: like }, { filename: like }] },
          limit: RESULTS_PER_CATEGORY * 2 // extra headroom since some get filtered out by confidentiality below
        }),
        Contract.findAll({ where: { [Op.or]: [{ title: like }, { counterparty: like }] }, limit: RESULTS_PER_CATEGORY }),
        Licence.findAll({ where: { [Op.or]: [{ licenceNumber: like }, { licenceType: like }] }, limit: RESULTS_PER_CATEGORY }),
        ComplianceObligation.findAll({ where: { description: like }, limit: RESULTS_PER_CATEGORY }),
        Correspondence.findAll({ where: { subject: like }, limit: RESULTS_PER_CATEGORY }),
        Decision.findAll({ where: { description: like }, limit: RESULTS_PER_CATEGORY }),
        Risk.findAll({ where: { title: like }, limit: RESULTS_PER_CATEGORY })
      ]);

    const results = [];

    blocks.forEach((b) =>
      results.push({ type: 'Block', id: b.id, title: b.name, subtitle: b.status || '', link: `/blocks/${b.id}` })
    );
    projects.forEach((p) =>
      results.push({ type: 'Project', id: p.id, title: p.name, subtitle: p.status || '', link: `/projects/${p.id}` })
    );
    activities.forEach((a) =>
      results.push({ type: 'Activity', id: a.id, title: a.name, subtitle: a.status || '', link: `/activities/${a.id}` })
    );
    tasks.forEach((t) =>
      results.push({
        type: 'Task',
        id: t.id,
        title: t.title,
        subtitle: t.status || '',
        link: `/tasks?q=${encodeURIComponent(t.title)}`
      })
    );
    documents
      .filter((d) => canViewDocument(req.user, d))
      .slice(0, RESULTS_PER_CATEGORY)
      .forEach((d) =>
        results.push({
          type: 'Document',
          id: d.id,
          title: d.title,
          subtitle: d.documentType || '',
          link: `/documents/${d.id}`
        })
      );
    contracts.forEach((c) =>
      results.push({
        type: 'Contract',
        id: c.id,
        title: c.title,
        subtitle: c.counterparty || '',
        link: `/contracts?q=${encodeURIComponent(c.title)}`
      })
    );
    licences.forEach((l) =>
      results.push({
        type: 'Licence',
        id: l.id,
        title: l.licenceNumber || l.licenceType || `Licence ${l.id}`,
        subtitle: l.licenceType || '',
        link: `/licences?q=${encodeURIComponent(l.licenceNumber || l.licenceType || '')}`
      })
    );
    obligations.forEach((o) =>
      results.push({
        type: 'Compliance',
        id: o.id,
        title: truncate(o.description),
        subtitle: o.regulatoryBody || '',
        link: `/compliance?q=${encodeURIComponent(truncate(o.description, 40))}`
      })
    );
    correspondence.forEach((c) =>
      results.push({
        type: 'Correspondence',
        id: c.id,
        title: c.subject,
        subtitle: c.regulator || '',
        link: `/correspondence?q=${encodeURIComponent(c.subject)}`
      })
    );
    decisions.forEach((d) =>
      results.push({
        type: 'Decision',
        id: d.id,
        title: truncate(d.description),
        subtitle: d.status || '',
        link: `/decisions?q=${encodeURIComponent(truncate(d.description, 40))}`
      })
    );
    risks.forEach((r) =>
      results.push({
        type: 'Risk',
        id: r.id,
        title: r.title,
        subtitle: r.severity || '',
        link: `/registers/${r.id}?q=${encodeURIComponent(r.title)}`
      })
    );

    res.json({ query: q, results });
  } catch (err) {
    console.error('Error performing global search:', err);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
