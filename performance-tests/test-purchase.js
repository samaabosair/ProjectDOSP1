const axios = require("axios");
const BASE_URL = "http://localhost:5002";
const runs = 5;

async function measurePurchaseLatency(id) {
    let totalLatency = 0;

    for (let i = 0; i < runs; i++) {
        const start = process.hrtime();
        await axios.post(`${BASE_URL}/purchase/${id}`);
        const end = process.hrtime(start);
        const latency = end[0] * 1000 + end[1] / 1e6;
        console.log(`Purchase book ID=${id} attempt ${i + 1}: ${latency.toFixed(2)} ms`);
        totalLatency += latency;
    }

    console.log(`Average response time for purchase book ID=${id} = ${(totalLatency / runs).toFixed(2)} ms\n`);
}

// Example usage
(async () => {
    const bookId = "1";

    console.log("=== Purchase experiment ===");
    await measurePurchaseLatency(bookId);
})();
