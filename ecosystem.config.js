module.exports = {
  apps: [{
    name: 'personalai',
    script: 'src/index.js',
    cwd: process.env.HOME + '/personalai',
    restart_delay: 5000,
    max_restarts: 10,
    env: { NODE_ENV: 'production' }
  }]
};
