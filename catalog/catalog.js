const express = require('express');
const fs = require('fs');
const axios = require('axios');
const app = express();
const PORT = 5000;

app.use(express.json());

const getCatalog = () => JSON.parse(fs.readFileSync('/app/catalog.json'));
const saveCatalog = (catalog) => fs.writeFileSync('/app/catalog.json', JSON.stringify(catalog, null, 2));

// نسخ catalog الأخرى
const REPLICAS = ['http://catalog-replica:5000'];

// GET /search/:topic
app.get('/search/:topic', (req, res) => {
    const catalog = getCatalog();
    const result = catalog.filter(book => book.topic === req.params.topic);
    res.json(result.map(({ id, title }) => ({ id, title })));
});

// GET /info/:id
app.get('/info/:id', (req, res) => {
    const catalog = getCatalog();
    const book = catalog.find(b => b.id == req.params.id);
    book ? res.json(book) : res.status(404).json({ error: "Not found" });
});

// POST /decrement/:id
app.post('/decrement/:id', async (req, res) => {
    const catalog = getCatalog();
    const book = catalog.find(b => b.id == req.params.id);

    if (!book || book.quantity <= 0) {
        return res.status(400).json({ error: "Out of stock" });
    }

    book.quantity--;
    saveCatalog(catalog);

    // مزامنة مع النسخ الأخرى
    for (const replica of REPLICAS) {
        try {
            await axios.post(`${replica}/sync`, { id: book.id, quantity: book.quantity });
        } catch (err) {
            console.warn(`Failed to sync with ${replica}:`, err.message);
        }
    }

    res.json({ message: "Quantity updated" });
});

// POST /sync (يُستخدم داخليًا من قبل النسخ الأخرى)
app.post('/sync', (req, res) => {
    const { id, quantity } = req.body;
    const catalog = getCatalog();
    const book = catalog.find(b => b.id == id);
    if (book) {
        book.quantity = quantity;
        saveCatalog(catalog);
        res.json({ message: 'Synced successfully' });
    } else {
        res.status(404).json({ error: 'Book not found for sync' });
    }
});

app.listen(PORT, () => console.log(`Catalog Service running on port ${PORT}`));
