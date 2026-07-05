-- Migration: 20260604_019_risk_matrix.sql
-- Implements the remaining Requirements §5.15 (Risk Register — Basic) gaps:
--   * `reviewDate` on `risks` — drives the review-date reminder via the
--     shared Notification Engine (§10).
--   * `risk_matrix_settings` — a singleton, Admin-editable table holding the
--     Low/Medium/High weight values and score thresholds used to auto-calc
--     `riskScore` = likelihood × impact and its Low/Medium/High `riskBand`
--     (exposed as Sequelize VIRTUAL attributes on the `Risk` model, not real
--     columns on `risks` — see backend/models/Risk.js).

ALTER TABLE `risks`
ADD COLUMN `reviewDate` DATETIME NULL;

CREATE TABLE IF NOT EXISTS `risk_matrix_settings` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `lowWeight`        INT NOT NULL DEFAULT 1,
    `mediumWeight`     INT NOT NULL DEFAULT 2,
    `highWeight`       INT NOT NULL DEFAULT 3,
    `mediumThreshold`  INT NOT NULL DEFAULT 4,
    `highThreshold`    INT NOT NULL DEFAULT 7,
    `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
