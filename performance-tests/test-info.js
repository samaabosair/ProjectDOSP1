const axios = require('axios');

async function measureAverageLatency(id, runs, useCache) {
    let totalLatency = 0;

    for (let i = 0; i < runs; i++) {
        if (!useCache) {
            // امسح الكاش
            await axios.post(`http://localhost:5002/invalidate/${id}`);
        }

        const start = process.hrtime();
        await axios.get(`http://localhost:5002/info/${id}`);
        const end = process.hrtime(start);

        const latency = end[0] * 1000 + end[1] / 1e6;
        totalLatency += latency;

        console.log(`[${useCache ? "With Cache" : "Without Cache"}] Run ${i + 1}: ${latency.toFixed(3)} ms`);
    }

    const average = totalLatency / runs;
    console.log(`\n>>> Average latency (${useCache ? "with cache" : "without cache"}): ${average.toFixed(3)} ms\n`);
}

(async () => {
    const bookId = "1"; // استخدم ID كتاب موجود فعلاً
    const runs = 10;

    console.log("=== Testing WITHOUT Cache ===");
    await measureAverageLatency(bookId, runs, false);

    console.log("=== Testing WITH Cache ===");
    await measureAverageLatency(bookId, runs, true);
})();
