const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 5002;

// Load balancing: catalog and order servers
const catalogServers = ["http://catalog:5000", "http://catalog-replica:5000"];
const orderServers = ["http://order:5001", "http://order-replica:5001"];

let catalogIndex = 0;
let orderIndex = 0;

// Cache objects
const searchCache = new Map(); // topic -> list of books
const infoCache = new Map(); // book id -> book info

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

/**
 * Search for books by topic
 */
app.get("/search/:topic", async (req, res) => {
  const topic = req.params.topic;

  if (searchCache.has(topic)) {
    console.log(`CACHE HIT: search for topic "${topic}"`);
    return res.json(searchCache.get(topic));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/search/${topic}`);
    searchCache.set(topic, data); // Save in cache
    console.log(`Fetched from catalog server: ${catalogURL}`);
    res.json(data);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

/**
 * Get book info by ID
 */
app.get("/info/:id", async (req, res) => {
  const id = req.params.id;

  if (infoCache.has(id)) {
    console.log(`CACHE HIT: book info for ID "${id}"`);
    return res.json(infoCache.get(id));
  }

  try {
    const catalogURL = getNext_Catalog_Server();
    const { data } = await axios.get(`${catalogURL}/info/${id}`);
    infoCache.set(id, data); // Save in cache
    console.log(`Fetched from catalog server: ${catalogURL}`);
    res.json(data);
  } catch (err) {
    console.error("Info error:", err.message);
    res.status(500).json({ error: "Failed to fetch book info" });
  }
});

/**
 * Purchase book by ID
 */
/**
 * Purchase book by ID
 */
app.post("/purchase/:id", async (req, res) => {
  try {
    const orderURL = getNext_Order_Server();
    console.log("Attempting purchase via order server:", orderURL);

    const { data } = await axios.post(`${orderURL}/purchase/${req.params.id}`);

    // ❌ لا تحذف الكاش هنا بعد الآن
    // infoCache.delete(req.params.id);

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

    if (err.response && err.response.data && err.response.data.error) {
      console.log("Order service error:", err.response.data.error);
      res.status(err.response.status).json({ error: err.response.data.error });
    } else {
      res.status(500).json({ error: "Failed to purchase book" });
    }
  }
});


/**
 * Invalidate book info cache
 */
app.post("/invalidate/:id", (req, res) => {
  const id = req.params.id;

  if (infoCache.has(id)) {
    infoCache.delete(id);
    console.log(`Cache invalidated for book ID: ${id}`);
    return res.json({ message: `Cache invalidated for book ID ${id}` });
  } else {
    console.log(`No cache found for book ID ${id}, but returning success`);
    return res.json({ message: `No cache found for book ID ${id}` });
  }
});


app.listen(PORT, () => {
  console.log(`Frontend Service running on port ${PORT}`);
});
