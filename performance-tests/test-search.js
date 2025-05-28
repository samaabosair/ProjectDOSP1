const axios = require("axios");
const BASE_URL = "http://localhost:5002";
const runs = 10;

async function measureSearchLatency(topic, useCache) {
    let totalLatency = 0;

    // For no cache, you may need to restart the server to clear cache
    // or add an endpoint to clear the search cache if needed.

    for (let i = 0; i < runs; i++) {
        const start = process.hrtime();
        await axios.get(`${BASE_URL}/search/${topic}`);
        const end = process.hrtime(start);
        const latency = end[0] * 1000 + end[1] / 1e6;
        console.log(`[${useCache ? "With Cache" : "Without Cache"}] Search "${topic}" attempt ${i + 1}: ${latency.toFixed(2)} ms`);
        totalLatency += latency;
    }

    console.log(`Average response time for search "${topic}" ${useCache ? "with cache" : "without cache"} = ${(totalLatency / runs).toFixed(2)} ms\n`);
}

// Example usage
(async () => {
    const topic = "programming";

    console.log("=== Search experiment without cache ===");
    await measureSearchLatency(topic, false);

    console.log("=== Search experiment with cache ===");
    await measureSearchLatency(topic, true);
})();
