require('./config/env');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log minimal de cada request
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

const apiRoutes = require('./routes/api');
console.log('--- MONTANDO ROTAS EM /api ---');
app.use('/api', apiRoutes);
console.log('--- ROTAS MONTADAS ---');

app.get('/', (req, res) => {
    res.json({ message: "SISSQL API - ON" });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
