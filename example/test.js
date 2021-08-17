(async function main() {
    while(true) {
        console.log('test');
        await new Promise(r => setTimeout(r, 3000));
    }
})();