module.exports = {
  apps: [
    {
      name: "copycat-bot",
      script: "./src/app.js",
      watch: false, // Watch is disabled restarts handled via git hook
      instances: 1,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2/error.log",
      out_file: "./logs/pm2/output.log",
      time: true,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Restart strategy
      exp_backoff_restart_delay: 100,

      // Resource management
      node_args: "--max-old-space-size=1536",
    },
  ],
};
