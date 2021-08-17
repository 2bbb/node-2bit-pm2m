(async function main() {
    while(true) {
        console.log('this will be filter');
        await new Promise(r => setTimeout(r, 300));
    }
})();