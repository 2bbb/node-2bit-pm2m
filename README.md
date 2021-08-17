# @2bit/pm2m

package for monitoring pm2

## Install

```bash
npm install @2bit/pm2m
```

## How to use

```javascript
const pm2m = new PM2Monitor({
    appFilters: ['test', 'cluster-apps-app'],
    ignorePM2Modules: true, // ignore pm2 module (e.g. pm2-logrotate)
});

console.log('[boot manager]');

// first app status

pm2m.on('initial', (arg) => {
    console.log(`[${arg.pm_id}] initial state of ${arg.name} is ${arg.status}`);
});

// on app restarted

pm2m.on('restarted', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is restarted`, previous.restart_time, current.restart_time);
});

// status was changed

pm2m.on('changed_state', ({pm_id, name, status, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} changed status to ${status} now`, previous.restart_time, current.restart_time);
});

// or more concrete

pm2m.on('errored', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is errored`, previous.restart_time, current.restart_time);
});

pm2m.on('stopped', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is stopped`, previous.restart_time, current.restart_time);
});

pm2m.on('stopping', ({pm_id, name, cluster_id, previous, current}) => {
    console.log(`[${pm_id}] ${name}:${cluster_id} is stopping`, previous.restart_time, current.restart_time);
});

// call when pm2m will exit soon

pm2m.on('exit', options => {
    console.log('exit myself', options);
});

// pm2m got error

pm2m.on('monitor_error', (err) => {
    console.error(err);
});
```