/* global module */
module.exports = {
  apps: [
    { name: 'backend-api', script: 'dist/app/server.js', instances: 'max', exec_mode: 'cluster' },
    { name: 'backend-worker', script: 'dist/workers/worker.js', instances: 1, exec_mode: 'fork' },
  ],
};
