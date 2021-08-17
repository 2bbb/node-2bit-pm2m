# @2bit/pm2m

package for monitoring pm2

## Install

```bash
npm install @2bit/pm2m
```

## How to use

```javascript
const { PM2Monitor } = require('@2bit/pm2m');

const pm2m = new PM2Monitor(3000);

console.log('boot');

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
```