module.exports = {
  apps: [
    {
      name: "htmlscroll",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 19000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 19000
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 19000,
        args: "start -p 19000"
      }
    }
  ]
};
