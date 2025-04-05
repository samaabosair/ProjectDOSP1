const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 5002;

const CATALOG_URL = 'http://catalog:5000';
const ORDER_URL = 'http://order:5001';

app.use(express.json());

// البحث عن كتب حسب الموضوع
app.get('/search/:topic', async (req, res) => {
    try {
        const { data } = await axios.get(`${CATALOG_URL}/search/${req.params.topic}`);
        res.json(data);
    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).json({ error: "Failed to fetch search results" });
    }
});

// عرض معلومات كتاب محدد
app.get('/info/:id', async (req, res) => {
    try {
        const { data } = await axios.get(`${CATALOG_URL}/info/${req.params.id}`);
        res.json(data);
    } catch (err) {
        console.error("Info error:", err.message);
        res.status(500).json({ error: "Failed to fetch book info" });
    }
});

// شراء كتاب
app.post('/purchase/:id', async (req, res) => {
    try {
        // ارسال الطلب إلى خدمة الأوردر
        const { data } = await axios.post(`${ORDER_URL}/purchase/${req.params.id}`);

        // بناء الاستجابة المطلوبة
        const orderResponse = {
            message: "Purchase successful",
            order: {
                id: data.id, // ID من البيانات المسترجعة
                title: data.title, // اسم الكتاب
                time: new Date().toISOString() // الوقت الحالي
            }
        };

        // إرسال الاستجابة
        res.json(orderResponse);
    } catch (err) {
        console.error("Purchase error:", err.message);
        res.status(500).json({ error: "Failed to purchase book" });
    }
});

app.listen(PORT, () => console.log(`Frontend Service running on port ${PORT}`));
