const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = 5000;

app.use(express.json());

const getCatalog = () => JSON.parse(fs.readFileSync('/app/catalog.json'));
const saveCatalog = (catalog) => fs.writeFileSync('/app/catalog.json', JSON.stringify(catalog, null, 2));

const REPLICAS = ['http://catalog-replica:5000'];

app.get('/search/:topic', (req, res) => {
    const catalog = getCatalog();
    const result = catalog.filter(book => book.topic === req.params.topic);
    res.json(result.map(({ id, title }) => ({ id, title })));
});

app.get('/info/:id', (req, res) => {
    const catalog = getCatalog();
    const book = catalog.find(b => b.id == req.params.id);
    book ? res.json(book) : res.status(404).json({ error: "Not found" });
});

app.post('/decrement/:id', async (req, res) => {
    try {
        const catalog = getCatalog();
        const book = catalog.find(b => b.id == req.params.id);

        if (!book || book.quantity <= 0) {
            return res.status(400).json({ error: "Out of stock" });
        }

        book.quantity--;
        saveCatalog(catalog);

        // مزامنة
        for (const replica of REPLICAS) {
            try {
                await axios.post(`${replica}/sync`, { id: book.id, quantity: book.quantity });
            } catch (err) {
                console.warn(`Failed to sync with ${replica}:`, err.message);
            }
        }

        // حذف الكاش من الفرونت
        try {
            await axios.post(`http://frontend:5002/invalidate/${book.id}`);
        } catch (err) {
            console.warn("Failed to notify frontend for cache invalidation:", err.message);
        }

        res.json({ message: "Quantity updated" });
    } catch (e) {
        console.error("Error in decrement:", e.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/sync', async (req, res) => {
    const { id, quantity } = req.body;
    const catalog = getCatalog();
    const book = catalog.find(b => b.id == id);

    if (book) {
        book.quantity = quantity;
        saveCatalog(catalog);

        try {
            await axios.post(`http://frontend:5002/invalidate/${book.id}`);
        } catch (err) {
            console.warn("Failed to notify frontend (sync):", err.message);
        }

        res.json({ message: 'Synced successfully' });
    } else {
        res.status(404).json({ error: 'Book not found for sync' });
    }
});

app.listen(PORT, () => console.log(`Catalog Service running on port ${PORT}`));
