// Configurable Risk Register scoring matrix (Requirements §5.15).
//
// Holds the current Low/Medium/High → numeric weight mapping and the score
// thresholds that separate the Low/Medium/High risk bands, in an in-process
// cache so `Risk.riskScore`/`Risk.riskBand` (Sequelize VIRTUAL getters, which
// must be synchronous) can read it without a DB round-trip on every access.
//
// The cache is loaded from the `risk_matrix_settings` table at server
// startup (see server.js) and refreshed whenever an Admin updates it via
// `PUT /api/risks/matrix-config` (see routes/risks.js) — no code change is
// needed to retune the matrix, matching the rest of the app's "Admin
// configurable, no code change" convention (§10.4).

const DEFAULTS = Object.freeze({
  lowWeight: 1,
  mediumWeight: 2,
  highWeight: 3,
  // score >= highThreshold        => 'High' band
  // mediumThreshold <= score < highThreshold => 'Medium' band
  // score < mediumThreshold        => 'Low' band
  mediumThreshold: 4,
  highThreshold: 7
});

let current = { ...DEFAULTS };

function getRiskMatrixConfig() {
  return { ...current };
}

function setRiskMatrixConfig(partial) {
  current = { ...current, ...partial };
  return getRiskMatrixConfig();
}

function weightFor(level) {
  const key = `${String(level || '').toLowerCase()}Weight`;
  return current[key] || current.lowWeight;
}

function computeScore(severity, probability) {
  return weightFor(severity) * weightFor(probability);
}

function computeBand(score) {
  if (score >= current.highThreshold) return 'High';
  if (score >= current.mediumThreshold) return 'Medium';
  return 'Low';
}

module.exports = {
  DEFAULTS,
  getRiskMatrixConfig,
  setRiskMatrixConfig,
  computeScore,
  computeBand
};
