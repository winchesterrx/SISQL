const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('--- CARREGANDO API_SIMPLE ---');

router.post('/login', (req, res, next) => {
    console.log('HIT /api/login');
    next();
}, authController.login);

router.get('/test', (req, res) => {
    res.json({ message: 'API OK' });
});

module.exports = router;
