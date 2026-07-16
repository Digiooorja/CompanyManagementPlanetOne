// PM2 process manager config — see LAUNCH_READINESS_CHECKLIST.md §6 "Operational readiness".
//
// Runs the backend API and the frontend as long-lived, auto-restarting processes instead of raw
// `node server.js` / `vite` in a terminal (a closed terminal used to take the whole app down).
//
// Prerequisites:
//   npm install -g pm2
//   cd frontend && npm run build   (production only — builds the static bundle `vite preview` serves)
//
// This config is aimed at production/staging resilience (auto-restart on crash), not hot-reload
// development — for day-to-day dev work just run `npm run dev` directly in backend/ and frontend/.
//
// Usage (from the repo root):
//   pm2 start ecosystem.config.js                # start both apps
//   pm2 status | pm2 logs | pm2 restart all | pm2 stop all
//   pm2 save && pm2 startup                      # persist across reboots (prints an OS-specific command
//                                                 # to run once; on Windows use pm2-windows-startup instead)
//
// Equivalent npm scripts are defined in package.json (npm run pm2:start / pm2:stop / pm2:logs / pm2:status).

module.exports = {
  apps: [
    {
      name: 'planetone-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      watch: false,
      out_file: '../logs/backend-out.log',
      error_file: '../logs/backend-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'planetone-frontend',
      cwd: './frontend',
      // Serves the pre-built dist/ via `vite preview` — run `npm run build` in frontend/ first.
      script: 'npm',
      args: 'run preview -- --host --port 4173',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      watch: false,
      out_file: '../logs/frontend-out.log',
      error_file: '../logs/frontend-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
