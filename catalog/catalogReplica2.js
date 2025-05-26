const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 5004;  // منفذ مختلف

app.use(express.json());

const getCatalog = () => JSON.parse(fs.readFileSync('/app/catalog.json'));

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

app.post('/decrement/:id', (req, res) => {
    const catalog = getCatalog();
    const book = catalog.find(b => b.id == req.params.id);
    if (!book || book.quantity <= 0) {
        return res.status(400).json({ error: "Out of stock" });
    }
    book.quantity--;
    fs.writeFileSync('/app/catalog.json', JSON.stringify(catalog, null, 2));
    res.json({ message: "Quantity updated" });
});

app.listen(PORT, () => console.log(`Catalog Replica 2 running on port ${PORT}`));
