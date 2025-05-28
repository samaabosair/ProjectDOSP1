const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 5002;

const catalogServers = ["http://catalog:5000", "http://catalog-replica:5000"];
const orderServers = ["http://order:5001", "http://order-replica:5001"];

let catalogIndex = 0;
let orderIndex = 0;

const searchCache = new Map(); // topic -> list of books
const infoCache = new Map();   // book id -> book info

function getNext_Catalog_Server() {
  const server = catalogServers[catalogIndex];
  catalogIndex = (catalogIndex + 1) % catalogServers.length;
  return server;
}

function getNext_Order_Server() {
  const server = orderServers[orderIndex];
  orderIndex = (orderIndex + 1) % orderServers.length;
  return server;
}

app.use(express.json());

// ======================
// /search/:topic
// ======================
app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;
  const start = process.hrtime();

  if (searchCache.has(topic)) {
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`CACHE HIT: search for topic "${topic}" - Latency: ${latency} ms`);
    return res.json(searchCache.get(topic));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/search/${topic}`);
    searchCache.set(topic, data);
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`CACHE MISS: search for topic "${topic}" from ${catalogURL} - Latency: ${latency} ms`);
    res.json(data);
  } catch (err) {
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.error(`Search error after ${latency} ms:`, err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// ======================
// /info/:id
// ======================
app.get("/info/:id", async (req, res) => {
  const id = req.params.id;
  const start = process.hrtime();

  if (infoCache.has(id)) {
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`CACHE HIT: book info for ID "${id}" - Latency: ${latency} ms`);
    return res.json(infoCache.get(id));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/info/${id}`);
    infoCache.set(id, data);
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`CACHE MISS: book info for ID "${id}" from ${catalogURL} - Latency: ${latency} ms`);
    res.json(data);
  } catch (err) {
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.error(`Info error after ${latency} ms:`, err.message);
    res.status(500).json({ error: "Failed to fetch book info" });
  }
});

// ======================
// /purchase/:id
// ======================
app.post("/purchase/:id", async (req, res) => {
  const start = process.hrtime();

  try {
    const orderURL = getNext_Order_Server();
    console.log("Attempting purchase via order server:", orderURL);

    const { data } = await axios.post(`${orderURL}/purchase/${req.params.id}`);

    // بعد الشراء الناجح، نحذف الكاش المتعلق بالكتاب المحدد
    infoCache.delete(req.params.id);

    const orderResponse = {
      message: "Purchase successful",
      order: {
        id: data.order.id,
        title: data.order.title,
        time: data.order.time,
      },
    };

    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`Purchase completed - Latency: ${latency} ms`);

    res.json(orderResponse);
  } catch (err) {
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.error(`Purchase error after ${latency} ms:`, err.message);
    if (err.response && err.response.data && err.response.data.error) {
      res.status(err.response.status).json({ error: err.response.data.error });
    } else {
      res.status(500).json({ error: "Failed to purchase book" });
    }
  }
});

// ======================
// /invalidate/:id
// ======================
app.post("/invalidate/:id", (req, res) => {
  const id = req.params.id;
  const start = process.hrtime();

  if (infoCache.has(id)) {
    infoCache.delete(id);
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`Cache invalidated for book ID: ${id} - Overhead: ${latency} ms`);
    res.json({ message: `Cache invalidated for book ID ${id}` });
  } else {
    const end = process.hrtime(start);
    const latency = (end[0] * 1000 + end[1] / 1e6).toFixed(3);
    console.log(`No cache found for book ID ${id} - Invalidation overhead: ${latency} ms`);
    res.json({ message: `No cache to invalidate for book ID ${id}` });
  }
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
  console.log(`Frontend Service running on port ${PORT}`);
});
