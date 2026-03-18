const pool = require('../config/db');
const { generateSQL, generateChatTitle, extractNeuralKnowledge } = require('../services/aiService');

console.log('--- AI_CONTROLLER_V3_SYNCCON_OK ---');

const askAI = async (req, res) => {
    try {
        const { sistemaId, pergunta, versaoFirebird, provider, sessionId } = req.body;
        const usuarioId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: "Sessão de chat não identificada." });
        }

        // 1. Buscar sistema e DDL
        let sistemaRows;
        if (req.user.role === 'admin') {
            [sistemaRows] = await pool.execute(`
                SELECT s.*, ss.ddl_content, ss.orientacoes_ia 
                FROM sistemas s
                LEFT JOIN schemas_sql ss ON s.id = ss.sistema_id
                WHERE s.id = ?
            `, [sistemaId]);
        } else {
            [sistemaRows] = await pool.execute(`
                SELECT s.*, ss.ddl_content, ss.orientacoes_ia 
                FROM sistemas s
                JOIN bancada_sistemas bs ON s.id = bs.sistema_id
                JOIN usuarios u ON bs.bancada_id = u.bancada_id
                LEFT JOIN schemas_sql ss ON s.id = ss.sistema_id
                WHERE s.id = ? AND u.id = ?
            `, [sistemaId, usuarioId]);
        }

        if (sistemaRows.length === 0) {
            return res.status(403).json({ error: "Acesso negado a este setor ou setor inexistente." });
        }

        const data = sistemaRows[0];

        if (!data.ddl_content) {
            return res.status(400).json({ error: "Este setor ainda não foi analisado pela IA (DDL ausente)." });
        }

        // --- Lógica de Título Inteligente e Tags ---
        let novoTituloGerado = null;
        const [sessionRows] = await pool.execute('SELECT titulo FROM chat_sessions WHERE id = ?', [sessionId]);

        if (sessionRows.length > 0) {
            const updates = [];
            const values = [];

            if (sessionRows[0].titulo === 'Nova Conversa') {
                try {
                    novoTituloGerado = await generateChatTitle(pergunta, provider || 'openai');
                    updates.push('titulo = ?');
                    values.push(novoTituloGerado);
                } catch (titleErr) {
                    console.error('Erro ao gerar título:', titleErr.message);
                }
            }

            // Sempre atualizar a versão e o provedor
            updates.push('firebird_version = ?', 'ai_provider = ?');
            values.push(versaoFirebird, provider || 'openai');

            if (updates.length > 0) {
                values.push(sessionId);
                await pool.execute(`UPDATE chat_sessions SET ${updates.join(', ')} WHERE id = ?`, values);
            }
        }
        // -------------------------------------------

        // 2. Buscar histórico recente da sessão (últimas 10 mensagens) ANTES de inserir a nova
        const [historyRows] = await pool.execute(
            'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10',
            [sessionId]
        );
        const history = historyRows.reverse(); // Colocar em ordem cronológica

        // 3. BUSCAR MEMÓRIA NEURAL (Sinapses) do sistema
        const [synapseRows] = await pool.execute(
            'SELECT content FROM ia_synapses WHERE sistema_id = ? ORDER BY created_at ASC',
            [sistemaId]
        );

        // 4. Salvar pergunta atual do usuário no banco
        await pool.execute(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [sessionId, 'user', pergunta]
        );

        // 5. Chamar o serviço de IA para o SQL com Fallback Automático, Histórico e Memória Neural
        let sqlGerado;
        let providerUsado = provider || 'openai';

        try {
            sqlGerado = await generateSQL(
                data.ddl_content,
                pergunta,
                versaoFirebird,
                data.orientacoes_ia || '',
                providerUsado,
                history,
                synapseRows
            );
        } catch (aiErr) {
            console.warn(`[V3_LOG] IA [${providerUsado}] falhou, tentando fallback...`, aiErr.message);
            // Tentar o outro provedor
            const fallbackProvider = providerUsado === 'openai' ? 'gemini' : 'openai';
            try {
                sqlGerado = await generateSQL(
                    data.ddl_content,
                    pergunta,
                    versaoFirebird,
                    data.orientacoes_ia || '',
                    fallbackProvider,
                    history,
                    synapseRows
                );
                providerUsado = fallbackProvider; // Atualizar provedor se fallback funcionar
            } catch (fallbackErr) {
                console.error('[V3_LOG] Fallback também falhou:', fallbackErr.message);
                sqlGerado = `ERRO: Inteligência Indisponível (V3 SYNC).
                             
                             Motivo: ${fallbackErr.message}
                             
                             DICA: Verifique suas cotas nos painéis da OpenAI ou Gemini e as chaves no .env.`;
            }
        }

        // 6. Salvar resposta da IA
        await pool.execute(
            'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)',
            [sessionId, 'ai', sqlGerado]
        );

        // 🚀 APRENDIZADO AUTOMÁTICO (ASSÍNCRONO)
        // Não esperamos o aprendizado para responder ao usuário
        setImmediate(async () => {
            try {
                const { synapses: newSynapses, insights } = await extractNeuralKnowledge(pergunta, sqlGerado, providerUsado);

                // 1. Salvar Sinapses (Conhecimento Direto)
                if (newSynapses && newSynapses.length > 0) {
                    console.log(`🧠 [V3] IA EXTRAIU ${newSynapses.length} NOVAS SINAPSES.`);
                    for (const sContent of newSynapses) {
                        const [exists] = await pool.execute(
                            'SELECT id FROM ia_synapses WHERE sistema_id = ? AND content = ?',
                            [sistemaId, sContent]
                        );
                        if (exists.length === 0) {
                            await pool.execute(
                                'INSERT INTO ia_synapses (sistema_id, usuario_id, content) VALUES (?, ?, ?)',
                                [sistemaId, usuarioId, sContent]
                            );
                        }
                    }
                }

                // 2. Salvar Insights (Evolução e Correções)
                if (insights && insights.length > 0) {
                    console.log(`💡 [V3] IA GEROU ${insights.length} INSIGHTS DE EVOLUÇÃO.`);
                    for (const ins of insights) {
                        await pool.execute(
                            'INSERT INTO ia_insights (sistema_id, usuario_id, session_id, tipo, insight, contexto) VALUES (?, ?, ?, ?, ?, ?)',
                            [sistemaId, usuarioId, sessionId, ins.tipo || 'aprendizado', ins.texto, pergunta]
                        );
                    }
                }
            } catch (learnErr) {
                console.error('Erro no aprendizado automático (V3):', learnErr.message);
            }
        });

        res.json({
            sql: sqlGerado,
            novoTitulo: novoTituloGerado,
            learned: true
        });

    } catch (error) {
        console.error('ERRO FATAL NO CHAT AI (V3):', error);
        res.status(500).json({ error: "Erro interno V3.", details: error.message });
    }
};

const getSynapses = async (req, res) => {
    try {
        const { sistemaId } = req.params;
        const [rows] = await pool.execute(
            'SELECT id, content, created_at FROM ia_synapses WHERE sistema_id = ? ORDER BY created_at DESC',
            [sistemaId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar Memória Neural." });
    }
};

const saveSynapse = async (req, res) => {
    try {
        const { sistemaId, content } = req.body;
        const usuarioId = req.user.id;

        await pool.execute(
            'INSERT INTO ia_synapses (sistema_id, usuario_id, content) VALUES (?, ?, ?)',
            [sistemaId, usuarioId, content]
        );

        res.status(201).json({ message: "Conhecimento memorizado com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar na Memória Neural." });
    }
};

const deleteSynapse = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM ia_synapses WHERE id = ?', [id]);
        res.json({ message: "Conhecimento removido da memória." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover da Memória Neural." });
    }
};

const getAIStats = async (req, res) => {
    try {
        const [synapseCount] = await pool.execute('SELECT COUNT(*) as total FROM ia_synapses');
        const [insightCount] = await pool.execute('SELECT COUNT(*) as total FROM ia_insights');
        const [recentSynapses] = await pool.execute('SELECT COUNT(*) as total FROM ia_synapses WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');

        res.json({
            totalSynapses: synapseCount[0].total,
            totalInsights: insightCount[0].total,
            learningRate: recentSynapses[0].total,
            status: 'Operational'
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar estatísticas da IA." });
    }
};

const getAIInsights = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT i.*, s.nome as sistema_nome, u.nome as usuario_nome 
            FROM ia_insights i
            JOIN sistemas s ON i.sistema_id = s.id
            JOIN usuarios u ON i.usuario_id = u.id
            ORDER BY i.created_at DESC LIMIT 50
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar insights da IA." });
    }
};

const getAllSynapses = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT syn.*, s.nome as sistema_nome, u.nome as usuario_nome
            FROM ia_synapses syn
            JOIN sistemas s ON syn.sistema_id = s.id
            JOIN usuarios u ON syn.usuario_id = u.id
            ORDER BY syn.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar todas as sinapses." });
    }
};

module.exports = { askAI, getSynapses, saveSynapse, deleteSynapse, getAIStats, getAIInsights, getAllSynapses };
