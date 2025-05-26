const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5002;

const catalogServers = ['http://catalog:5000', 'http://catalog-replica:5000'];
const orderServers = ['http://order:5001', 'http://order-replica:5001'];


let catalogIndex = 0;
let orderIndex = 0;

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

// البحث عن كتب حسب الموضوع
app.get('/search/:topic', async (req, res) => {
    try {
        const catalogURL = getNext_Catalog_Server(); // توزيع الحمل
        const { data } = await axios.get(`${catalogURL}/search/${req.params.topic}`);
        res.json(data);
    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).json({ error: "Failed to fetch search results" });
    }
});


// عرض معلومات كتاب محدد
app.get('/info/:id', async (req, res) => {
    try {
        const catalogURL = getNext_Catalog_Server();
        const { data } = await axios.get(`${catalogURL}/info/${req.params.id}`);
        res.json(data);
    } catch (err) {
        console.error("Info error:", err.message);
        res.status(500).json({ error: "Failed to fetch book info" });
    }
});


// شراء كتاب
app.post('/purchase/:id', async (req, res) => {
    try {
        const orderURL = getNext_Order_Server(); // 
        const { data } = await axios.post(`${orderURL}/purchase/${req.params.id}`);

        const orderResponse = {
            message: "Purchase successful",
            order: {
                id: data.id,
                title: data.title,
                time: new Date().toISOString()
            }
        };

        res.json(orderResponse);
    } catch (err) {
        console.error("Purchase error:", err.message);
        res.status(500).json({ error: "Failed to purchase book" });
    }
});

app.listen(PORT, () => console.log(`Frontend Service running on port ${PORT}`));
