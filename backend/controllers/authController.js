const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        if (user.status !== 'approved') {
            return res.status(403).json({ error: "Sua conta aguarda aprovação do administrador." });
        }

        const token = jwt.sign(
            { id: user.id, nome: user.nome, role: user.role, bancada_id: user.bancada_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, nome: user.nome, role: user.role, bancada_id: user.bancada_id } });
    } catch (error) {
        res.status(500).json({ error: "Erro no login." });
    }
};

const register = async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hashedSenha = await bcrypt.hash(senha, 10);
        await pool.execute(
            'INSERT INTO usuarios (nome, email, senha, role, status) VALUES (?, ?, ?, "user", "pending")',
            [nome, email, hashedSenha]
        );
        res.json({ message: "Cadastro enviado com sucesso. Aguarde aprovação." });
    } catch (error) {
        console.error('ERRO AO REGISTRAR USUÁRIO:', error);
        res.status(500).json({ error: "Erro ao registrar usuário. O e-mail já pode estar em uso." });
    }
};

const registerAdmin = async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const hashedSenha = await bcrypt.hash(senha, 10);
        await pool.execute(
            'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, "admin")',
            [nome, email, hashedSenha]
        );
        res.json({ message: "Admin criado com sucesso." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar admin." });
    }
};

const getProfile = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, nome, email, role, bancada_id FROM usuarios WHERE id = ?',
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar perfil." });
    }
};

module.exports = { login, register, registerAdmin, getProfile };
