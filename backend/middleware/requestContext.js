const { AsyncLocalStorage } = require('async_hooks');
const jwt = require('jsonwebtoken');

// Per-request store so cross-cutting concerns (e.g. the audit logger running
// inside Sequelize hooks) can access the current actor without threading it
// through every function call.
const als = new AsyncLocalStorage();

function resolveIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || null;
}

// Runs the remainder of the request inside an AsyncLocalStorage context that
// carries the authenticated user (best-effort, non-authoritative) and IP.
// This does NOT enforce auth — route-level middleware still does that.
function requestContextMiddleware(req, res, next) {
  const store = { user: null, ip: resolveIp(req) };

  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      store.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      store.user = null;
    }
  }

  als.run(store, () => next());
}

function getRequestContext() {
  return als.getStore() || null;
}

module.exports = { requestContextMiddleware, getRequestContext };
