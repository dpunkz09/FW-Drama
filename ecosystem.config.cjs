module.exports = {
  apps: [
    {
      name: 'flixworld',
      script: 'server.js',
      cwd: '/var/www/flixworld.xyz/FW-Drama',

      // Run multiple instances equal to CPU count for load balancing
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,

      // Memory threshold before auto-restart
      max_memory_restart: '300M',

      // Environment variables for production
      env: {
        NODE_ENV: 'production',
        PORT: 7777,
      },

      // Logs
      out_file: '/var/www/flixworld.xyz/FW-Drama/logs/out.log',
      error_file: '/var/www/flixworld.xyz/FW-Drama/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
