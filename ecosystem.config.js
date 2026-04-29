// PM2 process configuration for production (IONOS VPS).
// Run with: pm2 startOrReload ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: 'madaspot',
      // Use the `npm` binary so we honor the package.json `start` script
      // (next start), not `next dev`.
      script: 'npm',
      args: 'run start',
      cwd: '/root/mada-spot',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Send logs to a single file so `pm2 logs madaspot` is useful.
      out_file: '/var/log/pm2/madaspot.out.log',
      error_file: '/var/log/pm2/madaspot.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
