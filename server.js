const express = require('express');
const path = require('path');
const app = express();

// Port ayarı: Render-in verdiyi portu götürür, yoxdursa 3000-də işləyir
const PORT = process.env.PORT || 3000;

// Statik faylları (html, css, js) oxumaq üçün
app.use(express.static(path.join(__dirname, '.')));

// Əsas səhifə olaraq index.html-i açır
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serverimiz ${PORT} portunda uğurla start götürdü...`);
});