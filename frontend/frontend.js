const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 5002;
 ///
// Backend services (catalog and order replicas)
const catalogServers = ["http://catalog:5000", "http://catalog-replica:5000"];
const orderServers = ["http://order:5001", "http://order-replica:5001"];

let catalogIndex = 0;
let orderIndex = 0;

// In-memory cache objects
const searchCache = new Map();
const infoCache = new Map();

// Round-robin load balancing for catalog service
function getNext_Catalog_Server() {
  const server = catalogServers[catalogIndex];
  catalogIndex = (catalogIndex + 1) % catalogServers.length;
  return server;
}

// Round-robin load balancing for order service
function getNext_Order_Server() {
  const server = orderServers[orderIndex];
  orderIndex = (orderIndex + 1) % orderServers.length;
  return server;
}

app.use(express.json());

// Search for books by topic
app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;

  if (searchCache.has(topic)) {
    return res.json(searchCache.get(topic));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/search/${topic}`);
    searchCache.set(topic, data); // Cache the result
    res.json(data);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

// Get information about a specific book
app.get("/info/:id", async (req, res) => {
  const id = req.params.id;

  if (infoCache.has(id)) {
    return res.json(infoCache.get(id));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/info/${id}`);
    infoCache.set(id, data); // Cache the result
    res.json(data);
  } catch (err) {
    console.error("Info error:", err.message);
    res.status(500).json({ error: "Failed to fetch book info" });
  }
});

// Purchase a book
app.post("/purchase/:id", async (req, res) => {
  try {
    const orderURL = getNext_Order_Server();
    const { data } = await axios.post(`${orderURL}/purchase/${req.params.id}`);

    // Invalidate book info cache after purchase
    infoCache.delete(req.params.id);

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

app.listen(PORT, () =>
  console.log(`Frontend Service running on port ${PORT}`)
);
