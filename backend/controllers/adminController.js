const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const uploadDDL = async (req, res) => {
    const { sistemaId, ddlContent, orientacoesIa } = req.body;
    try {
        const [existing] = await pool.execute('SELECT id FROM schemas_sql WHERE sistema_id = ?', [sistemaId]);

        if (existing.length > 0) {
            if (ddlContent && ddlContent.trim() !== "") {
                await pool.execute(
                    'UPDATE schemas_sql SET ddl_content = ?, orientacoes_ia = ?, status = "ready" WHERE sistema_id = ?',
                    [ddlContent, orientacoesIa, sistemaId]
                );
            } else {
                await pool.execute(
                    'UPDATE schemas_sql SET orientacoes_ia = ?, status = "ready" WHERE sistema_id = ?',
                    [orientacoesIa, sistemaId]
                );
            }
        } else {
            await pool.execute(
                'INSERT INTO schemas_sql (sistema_id, ddl_content, orientacoes_ia, status) VALUES (?, ?, ?, "ready")',
                [sistemaId, ddlContent, orientacoesIa]
            );
        }
        res.json({ message: "Metadados do sistema atualizados com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar DDL." });
    }
};

const createUser = async (req, res) => {
    const { nome, email, senha, role, bancadaId, bancada_id } = req.body;
    const bid = bancadaId || bancada_id;
    try {
        const hashedSenha = await bcrypt.hash(senha, 10);
        await pool.execute(
            'INSERT INTO usuarios (nome, email, senha, role, bancada_id) VALUES (?, ?, ?, ?, ?)',
            [nome, email, hashedSenha, role || 'user', bid]
        );
        res.json({ message: "Usuário criado com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar usuário." });
    }
};

const getBancadas = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM bancadas');
        console.log('DEBUG BANCADAS:', rows);
        res.json(rows);
    } catch (error) {
        console.error('ERRO AO BUSCAR BANCADAS:', error);
        res.status(500).json({ error: "Erro ao buscar bancadas." });
    }
};

const createBancada = async (req, res) => {
    const { nome } = req.body;
    try {
        const [result] = await pool.execute('INSERT INTO bancadas (nome) VALUES (?)', [nome]);
        res.json({ id: result.insertId, nome });
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar bancada." });
    }
};

const createSistema = async (req, res) => {
    const { nome, descricao } = req.body;
    try {
        const [result] = await pool.execute('INSERT INTO sistemas (nome, descricao) VALUES (?, ?)', [nome, descricao]);
        res.json({ id: result.insertId, nome });
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar sistema." });
    }
};

const associateSistemaBancada = async (req, res) => {
    const { bancadaId, sistemaId } = req.body;
    try {
        await pool.execute('INSERT INTO bancada_sistemas (bancada_id, sistema_id) VALUES (?, ?)', [bancadaId, sistemaId]);
        res.json({ message: "Associação criada." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao associar." });
    }
};

const getUsers = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT u.id, u.nome, u.email, u.role, u.bancada_id, b.nome as bancada_nome 
            FROM usuarios u
            LEFT JOIN bancadas b ON u.bancada_id = b.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
};

const getSistemas = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT s.*, ss.status, ss.updated_at, ss.orientacoes_ia, ss.fdb_file_path, IF(LENGTH(ss.ddl_content) > 0, 1, 0) as has_ddl
            FROM sistemas s
            LEFT JOIN schemas_sql ss ON s.id = ss.sistema_id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar sistemas." });
    }
};

const getUserSistemas = async (req, res) => {
    const { bancadaId, bancada_id } = req.params;
    let bid = bancadaId || bancada_id;
    const usuarioId = req.user?.id;
    const role = req.user?.role;

    console.log(`[USER ${usuarioId}] DEBUG GET USER SISTEMAS - BID: ${bid} ROLE: ${role}`);

    try {
        let rows;
        // Se for admin e não tiver bid, ou se for explicitamente admin, mostramos tudo
        if (role === 'admin' && (!bid || bid === 'undefined' || bid === 'null')) {
            [rows] = await pool.execute(`
                SELECT s.*, ss.status 
                FROM sistemas s
                LEFT JOIN schemas_sql ss ON s.id = ss.sistema_id
            `);
        } else {
            // Caso contrário, mantemos a restrição por bancada
            [rows] = await pool.execute(`
                SELECT s.*, ss.status 
                FROM sistemas s
                JOIN bancada_sistemas bs ON s.id = bs.sistema_id
                LEFT JOIN schemas_sql ss ON s.id = ss.sistema_id
                WHERE bs.bancada_id = ?
            `, [bid]);
        }

        console.log(`[USER ${usuarioId}] DEBUG GET USER SISTEMAS - ENCONTRADOS: ${rows.length}`);
        res.json(rows);
    } catch (error) {
        console.error('ERRO AO BUSCAR SISTEMAS DA BANCADA:', error);
        res.status(500).json({ error: "Erro ao buscar sistemas da bancada." });
    }
};

const checkAIStatus = async (req, res) => {
    const status = {
        openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10,
        gemini: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10
    };
    console.log('[DEBUG STATUS CHECK] Retornando:', status);
    res.json(status);
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ message: "Usuário excluído com sucesso." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir usuário." });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { nome, email, role, bancadaId, bancada_id } = req.body;
    const bid = bancadaId || bancada_id;
    console.log('DEBUG UPDATE USER:', { id, nome, email, role, bid, body: req.body });
    try {
        await pool.execute(
            'UPDATE usuarios SET nome = ?, email = ?, role = ?, bancada_id = ? WHERE id = ?',
            [nome, email, role, bid, id]
        );
        res.json({ message: "Usuário atualizado com sucesso." });
    } catch (error) {
        console.error('ERRO AO ATUALIZAR USUÁRIO:', error);
        res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
};

const handleFDBUpload = async (req, res) => {
    const { sistemaId } = req.body;
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });

    const filePath = req.file.path;
    try {
        const [existing] = await pool.execute('SELECT id FROM schemas_sql WHERE sistema_id = ?', [sistemaId]);

        if (existing.length > 0) {
            await pool.execute(
                'UPDATE schemas_sql SET fdb_file_path = ? WHERE sistema_id = ?',
                [filePath, sistemaId]
            );
        } else {
            await pool.execute(
                'INSERT INTO schemas_sql (sistema_id, fdb_file_path, status) VALUES (?, ?, "pending")',
                [sistemaId, filePath]
            );
        }
        res.json({ message: "Arquivo FDB enviado com sucesso.", path: filePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao salvar arquivo FDB." });
    }
};

module.exports = {
    uploadDDL,
    createUser,
    getBancadas,
    createBancada,
    createSistema,
    associateSistemaBancada,
    getUsers,
    getSistemas,
    getUserSistemas,
    checkAIStatus,
    deleteUser,
    updateUser,
    handleFDBUpload
};
