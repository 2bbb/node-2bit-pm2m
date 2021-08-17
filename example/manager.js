const path = require('path');
const { PM2Monitor } = require(path.join(__dirname, '../lib/index.js'));

const pm2m = new PM2Monitor({
    appFilters: ['test', 'cluster-apps-app'],
    ignorePM2Modules: true, // ignore pm2 module (e.g. pm2-logrotate)
});

console.log('[boot manager]');

pm2m.on('initial', (arg) => {
    console.log(`[${arg.pm_id}] initial state of ${arg.name} is ${arg.status}`);
});

pm2m.on('restarted', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is restarted`, previous.restart_time, current.restart_time);
});

pm2m.on('errored', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is errored`, previous.restart_time, current.restart_time);
});

pm2m.on('stopped', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is stopped`, previous.restart_time, current.restart_time);
});

pm2m.on('stopping', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is stopping`, previous.restart_time, current.restart_time);
});

pm2m.on('exit', options => {
    console.log('exit myself', options);
});

pm2m.on('monitor_error', (err) => {
    console.error(err);
});