const pool = require('../config/db');

const createSession = async (req, res) => {
    try {
        const { sistemaId, titulo } = req.body;
        const usuarioId = req.user.id;
        const bancadaId = req.user.bancada_id;

        const [result] = await pool.execute(
            'INSERT INTO chat_sessions (usuario_id, bancada_id, sistema_id, titulo) VALUES (?, ?, ?, ?)',
            [usuarioId, bancadaId, sistemaId, titulo || 'Nova Conversa']
        );

        res.status(201).json({
            id: result.insertId,
            titulo: titulo || 'Nova Conversa',
            sistema_id: sistemaId,
            bancada_id: bancadaId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar sessão de chat.' });
    }
};

const getSessions = async (req, res) => {
    try {
        const { sistemaId } = req.params;
        const usuarioId = req.user.id;

        const [sessions] = await pool.execute(
            'SELECT * FROM chat_sessions WHERE usuario_id = ? AND sistema_id = ? ORDER BY created_at DESC',
            [usuarioId, sistemaId]
        );

        res.json(sessions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar sessões de chat.' });
    }
};

const getMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const usuarioId = req.user.id;
        const role = req.user.role;

        // Verificar se a sessão pertence ao usuário (ou se é admin)
        const query = role === 'admin'
            ? 'SELECT id FROM chat_sessions WHERE id = ?'
            : 'SELECT id FROM chat_sessions WHERE id = ? AND usuario_id = ?';
        const params = role === 'admin' ? [sessionId] : [sessionId, usuarioId];

        const [session] = await pool.execute(query, params);

        if (session.length === 0) {
            return res.status(403).json({ error: 'Acesso negado ou sessão não encontrada.' });
        }

        const [messages] = await pool.execute(
            'SELECT role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [sessionId]
        );

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar mensagens do chat.' });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const usuarioId = req.user.id;
        const role = req.user.role;

        const query = role === 'admin'
            ? 'DELETE FROM chat_sessions WHERE id = ?'
            : 'DELETE FROM chat_sessions WHERE id = ? AND usuario_id = ?';
        const params = role === 'admin' ? [sessionId] : [sessionId, usuarioId];

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sessão não encontrada.' });
        }

        res.json({ message: 'Sessão excluída com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir sessão de chat.' });
    }
};

const renameSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { titulo } = req.body;
        const usuarioId = req.user.id;
        const role = req.user.role;

        const query = role === 'admin'
            ? 'UPDATE chat_sessions SET titulo = ? WHERE id = ?'
            : 'UPDATE chat_sessions SET titulo = ? WHERE id = ? AND usuario_id = ?';
        const params = role === 'admin' ? [titulo, sessionId] : [titulo, sessionId, usuarioId];

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sessão não encontrada.' });
        }

        res.json({ message: 'Sessão renomeada com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao renomear sessão de chat.' });
    }
};

module.exports = {
    createSession,
    getSessions,
    getMessages,
    deleteSession,
    renameSession
};
