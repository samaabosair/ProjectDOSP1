const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 5002;

// Catalog and Order service endpoints
const catalogServers = ["http://catalog:5000", "http://catalog-replica:5000"];
const orderServers = ["http://order:5001", "http://order-replica:5001"];

// Index for round-robin load balancing
let catalogIndex = 0;
let orderIndex = 0;

// Cache to store search and info results
const cache = new Map();

// Get the next catalog server using round-robin
function getNext_Catalog_Server() {
  const server = catalogServers[catalogIndex];
  catalogIndex = (catalogIndex + 1) % catalogServers.length;
  return server;
}

// Get the next order server using round-robin
function getNext_Order_Server() {
  const server = orderServers[orderIndex];
  orderIndex = (orderIndex + 1) % orderServers.length;
  return server;
}

app.use(express.json());

// Search books by topic (with cache)
app.get("/search/:topic", async (req, res) => {
  const key = `search-${req.params.topic}`;

  // Check if result exists in cache
  if (cache.has(key)) {
    console.log("Cache hit:", key);
    return res.json(cache.get(key));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(
      `${catalogURL}/search/${req.params.topic}`
    );

    // Store result in cache
    cache.set(key, data);
    console.log("Cache miss - fetched from server:", key);
    res.json(data);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Get book info by ID (with cache)
app.get("/info/:id", async (req, res) => {
  const key = `info-${req.params.id}`;

  // Check if info exists in cache
  if (cache.has(key)) {
    console.log("Cache hit:", key);
    return res.json(cache.get(key));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/info/${req.params.id}`);

    // Store info in cache
    cache.set(key, data);
    console.log("Cache miss - fetched from server:", key);
    res.json(data);
  } catch (err) {
    console.error("Info error:", err.message);
    res.status(500).json({ error: "Failed to fetch book info" });
  }
});

// Purchase book and invalidate cache
app.post("/purchase/:id", async (req, res) => {
  try {
    const orderURL = getNext_Order_Server();
    const { data } = await axios.post(`${orderURL}/purchase/${req.params.id}`);

    // Invalidate cached info after purchase
    cache.delete(`info-${req.params.id}`);

    const orderResponse = {
      message: "Purchase successful",
      order: {
        id: data.id,
        title: data.title,
        time: new Date().toISOString(),
      },
    };

    res.json(orderResponse);
  } catch (err) {
    console.error("Purchase error:", err.message);
    res.status(500).json({ error: "Failed to purchase book" });
  }
});

// Start the frontend service
app.listen(PORT, () => console.log(`Frontend Service running on port ${PORT}`));
