#!/usr/bin/env node
/**
 * Clean install — see LAUNCH_READINESS_CHECKLIST.md §6 "Operational readiness".
 *
 * `frontend/node_modules` has been observed getting into a partially-installed state (stale/
 * conflicting nested deps after switching branches, interrupted installs, etc.). This script wipes
 * every node_modules/lockfile in the repo and reinstalls from a clean slate, so it's safe to run as
 * the canonical "make sure the install is actually clean" step before a build/deploy.
 *
 * Usage:
 *   node scripts/clean-install.js
 *   npm run install:clean   (same thing, from the repo root)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

const targets = [
  { dir: repoRoot, label: 'root' },
  { dir: path.join(repoRoot, 'backend'), label: 'backend' },
  { dir: path.join(repoRoot, 'frontend'), label: 'frontend' }
];

function removeIfExists(targetPath) {
  if (fs.existsSync(targetPath)) {
    console.log(`Removing ${path.relative(repoRoot, targetPath) || '.'}`);
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

console.log('--- Removing node_modules and lockfiles ---');
for (const { dir } of targets) {
  removeIfExists(path.join(dir, 'node_modules'));
  removeIfExists(path.join(dir, 'package-lock.json'));
}

console.log('\n--- Installing root (frontend workspace) ---');
execSync('npm install', { cwd: repoRoot, stdio: 'inherit' });

console.log('\n--- Installing backend ---');
execSync('npm install', { cwd: path.join(repoRoot, 'backend'), stdio: 'inherit' });

console.log('\nClean install complete.');
