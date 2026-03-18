require('./config/env');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

app.get('/test', (req, res) => res.send('OK'));

app.listen(3002, () => console.log('DEBUG SERVER ON 3002'));
