const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5002;

const CATALOG_URL = 'http://catalog:5000';
const ORDER_URL = 'http://order:5001';

app.use(express.json());

app.get('/search/:topic', async (req, res) => {
    const { data } = await axios.get(`${CATALOG_URL}/search/${req.params.topic}`);
    res.json(data);
});

app.get('/info/:id', async (req, res) => {
    const { data } = await axios.get(`${CATALOG_URL}/info/${req.params.id}`);
    res.json(data);
});

app.post('/purchase/:id', async (req, res) => {
    const { data } = await axios.post(`${ORDER_URL}/purchase/${req.params.id}`);
    res.json(data);
});

app.listen(PORT, () => console.log(`Frontend Service running on port ${PORT}`));
