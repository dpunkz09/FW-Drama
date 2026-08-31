module.exports = {
  apps: [
    {
      name: 'fwdrama',

      // Run: npm run preview
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/flixworld.xyz/FW-Drama',

      // Single instance
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,

      // Memory threshold
      max_memory_restart: '300M',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
      },

      // Logs
      out_file: '/var/www/flixworld.xyz/FW-Drama/logs/out.log',
      error_file: '/var/www/flixworld.xyz/FW-Drama/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};