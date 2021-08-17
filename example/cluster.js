(async function main() {
    while(true) {
        console.log('cluster', process.env.CLUSTER_ID);
        await new Promise(r => setTimeout(r, 3000 + parseInt(process.env.CLUSTER_ID) * 500));
    }
})();