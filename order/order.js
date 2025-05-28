const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = 5001;

const CATALOG_URL = 'http://catalog:5000';
const ORDER_REPLICAS = ['http://order-replica:5001'];

app.use(express.json());

app.post('/purchase/:id', async (req, res) => {
    try {
        const { data } = await axios.get(`${CATALOG_URL}/info/${req.params.id}`);

        if (data.quantity <= 0) {
            return res.status(400).json({ error: "Out of stock" });
        }

        await axios.post(`${CATALOG_URL}/decrement/${req.params.id}`);

        const orders = JSON.parse(fs.readFileSync('./orders.json'));
        const order = { id: data.id, title: data.title, time: new Date().toISOString() };
        orders.push(order);
        fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));

        for (const replica of ORDER_REPLICAS) {
            try {
                await axios.post(`${replica}/sync`, order);
            } catch (err) {
                console.warn(`Failed to sync order with ${replica}:`, err.message);
            }
        }

        try {
            await axios.post(`http://frontend:5002/invalidate/${req.params.id}`);
        } catch (err) {
            console.warn("Failed to notify frontend:", err.message);
        }

        res.json({ message: "Purchase successful", order });
    } catch (e) {
        console.error("Purchase failed:", e.message);
        res.status(500).json({ error: "Failed to purchase" });
    }
});

app.post('/sync', (req, res) => {
    const order = req.body;
    const orders = JSON.parse(fs.readFileSync('./orders.json'));
    orders.push(order);
    fs.writeFileSync('./orders.json', JSON.stringify(orders, null, 2));
    res.json({ message: "Order synced" });
});

app.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
