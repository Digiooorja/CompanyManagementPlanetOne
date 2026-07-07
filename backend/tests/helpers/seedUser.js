/**
 * Creates a minimal, valid User row for tests that need a real FK target
 * (many models have NOT NULL-enforced-at-insert FKs to `users`, e.g.
 * Task.assignedToId, BudgetLine.revisionRequestedById,
 * ForexTransaction.requestedById) even when the column itself is nullable -
 * InnoDB still validates the FK at insert time for any non-null value.
 * Always use a real seeded user's `.id` in test JWTs rather than an
 * arbitrary made-up number.
 */
const User = require('../../models/User');

let counter = 0;

async function makeUser(overrides = {}) {
  counter += 1;
  const unique = `${Date.now()}_${counter}`;
  return User.create({
    username: `testuser_${unique}`,
    email: `testuser_${unique}@example.com`,
    password: 'not-a-real-hash',
    firstName: 'Test',
    lastName: 'User',
    role: 'User',
    ...overrides,
  });
}

module.exports = { makeUser };
