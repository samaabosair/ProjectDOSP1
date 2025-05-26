const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = 5001;
const CATALOG_URL = 'http://catalog:5000';

app.use(express.json());

app.post('/purchase/:id', async (req, res) => {
    try {
        console.log(`Received purchase request for book ID: ${req.params.id}`);

        const { data } = await axios.get(`${CATALOG_URL}/info/${req.params.id}`);

        if (data.quantity <= 0) {
            console.log("Out of stock for book ID:", req.params.id);
            return res.status(400).json({ error: "Out of stock" });
        }

        await axios.post(`${CATALOG_URL}/decrement/${req.params.id}`);

        const orders = JSON.parse(fs.readFileSync('./orders.json'));
        const order = { id: data.id, title: data.title, time: new Date().toISOString() };
        orders.push(order);
        fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));

        console.log("Purchase successful for book ID:", req.params.id);

        res.json({
            message: "Purchase successful",
            order: order
        });

    } catch (e) {
        console.error("Purchase failed:", e.message);
        res.status(500).json({ error: "Failed to purchase" });
    }
});

app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
