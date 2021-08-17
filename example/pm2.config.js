module.exports = {
    apps : [
        {
            name: 'test',
            script: 'test.js',
            cwd : __dirname,
        },
        {
            name: 'cluster-apps',
            script: 'cluster.js',
            cwd : __dirname,
            exec_mode: 'cluster',
            instances: 4,
        },
        {
            name: 'will-filter',
            script: 'will-filter.js',
            cwd: __dirname,
        },
    ]
}
