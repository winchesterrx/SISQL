const db = require('../config/db');
const { OpenAI } = require('openai');

// Configuração do Ollama (Local LLM)
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\s+/g, "");
const OLLAMA_MODEL = (process.env.OLLAMA_MODEL || 'llama3.2').trim().replace(/\s+/g, "");

const atlasController = {
    chat: async (req, res) => {
        console.log("--- [ATLAS] VERSION 2.3 - MODEL: GEMINI-2.0-FLASH ---");
        console.log("--- [ATLAS] INÍCIO DO CICLO DE REQUISIÇÃO ---");
        try {
            const { message, history } = req.body;
            console.log("[ATLAS] Mensagem recebida:", message);
            console.log("[ATLAS] Histórico recebido (length):", history ? history.length : 0);

            if (!message) {
                console.warn("[ATLAS] Erro: Campo 'message' ausente no corpo da requisição.");
                return res.status(400).json({
                    success: false,
                    error: "Corpo da requisição inválido: campo 'message' esperado."
                });
            }

            console.log(`[ATLAS] Inicializando modelo LOCAL Ollama (${OLLAMA_MODEL}) em ${OLLAMA_BASE_URL}...`);

            const systemInstruction = `
You are ATLAS, a highly advanced, premium AI assistant.
Your persona is: intelligent, articulate, natural, confident, calm, helpful, and polished.

CORE GUIDELINES:
1. ALWAYS provide detailed, contextual, and rich answers. DO NOT give dry, one-line robotic responses unless the user explicitly asks for a very short answer.
2. Maintain a warm, conversational flow but remain highly professional and articulate. You are not a generic command-line bot.
3. If asked to explain something, elaborate naturally and provide useful insights.
4. Do not act like a programmed machine ("I am an AI", "Waiting for input"). Act like a seamless, highly capable digital partner.
5. Answer in spoken Portuguese (pt-BR) by default, but adapt to the user's language.

COMMAND DETECTION (HIDDEN):
If the user asks for a system action (e.g., "open the dashboard"), append the tag [COMMAND:command_name] to the end of your response.

CURRENT CONTEXT HISTORY: ${JSON.stringify(history)}
            `;

            console.log("[ATLAS] Preparando contexto para Ollama...");

            const messages = [
                { role: "system", content: systemInstruction }
            ];

            if (history && Array.isArray(history)) {
                history.forEach(msg => {
                    messages.push({
                        role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content || msg.parts?.[0]?.text || ''
                    });
                });
            }

            messages.push({ role: "user", content: message });

            console.log("[ATLAS] Enviando requisição para provedor LOCAL...");

            const ollamaRequest = {
                model: OLLAMA_MODEL,
                messages: messages,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: 200, // Balanço: respostas articuladas mas rápidas
                    repeat_penalty: 1.15
                }
            };

            console.log(`\n[OLLAMA] -> ${OLLAMA_BASE_URL}/api/chat | Model: ${OLLAMA_MODEL} | Context: ${messages.length} msgs`);

            const startTime = Date.now();
            const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ollamaRequest)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Ollama API falhou: ${response.status} - ${errText} `);
            }

            const result = await response.json();
            const responseText = result.message.content;
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log("\n==================================================");
            console.log(`[OLLAMA VERIFICATION] RESPONSE RECEIVED IN ${duration}s`);
            console.log("==================================================");
            console.log(`-> RAW RESPONSE OUTPUT: \n${responseText}`);
            console.log("--------------------------------------------------\n");

            let finalResponse = responseText;
            const commandMatch = responseText.match(/\[COMMAND:(.*?)\]/);
            const memoryMatch = responseText.match(/\[MEMORY:(.*?)=(.*?)\]/);

            let isCommand = false;
            let command = null;

            if (commandMatch) {
                isCommand = true;
                command = commandMatch[1].trim();
                finalResponse = finalResponse.replace(commandMatch[0], "").trim();
                console.log("[ATLAS] Comando detectado:", command);
            }

            if (memoryMatch) {
                const key = memoryMatch[1].trim();
                const val = memoryMatch[2].trim();
                const userId = req.user.id;
                console.log(`[ATLAS] Memória detectada: ${key}=${val} para Usuário ID: ${userId} `);

                db.execute(
                    "INSERT INTO ai_memory (user_id, key_name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
                    [userId, key, val, val]
                ).then(() => {
                    console.log("[ATLAS] Memória salva com sucesso no banco.");
                }).catch(e => {
                    console.error("[ATLAS] Falha ao persistir memória:", e.message);
                });

                finalResponse = finalResponse.replace(memoryMatch[0], "").trim();
            }

            console.log("[ATLAS] Ciclo finalizado com sucesso. Enviando resposta.");
            res.json({
                success: true,
                reply: finalResponse, // Mudado para 'reply' conforme solicitado
                isCommand,
                command
            });

        } catch (error) {
            console.error("[ATLAS] ERRO CRÍTICO NO BACKEND:", error);
            if (error.response) {
                console.error("[ATLAS] Detalhes do erro da API (Google):", JSON.stringify(error.response.data, null, 2));
            }
            res.status(500).json({
                success: false,
                error: error.message || "Erro interno no processamento cognitivo da ATLAS.",
                details: error.response ? error.response.data : undefined,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    getMemory: async (req, res) => {
        try {
            const userId = req.user.id;
            const [memories] = await db.execute(
                "SELECT key_name, value FROM ai_memory WHERE user_id = ?",
                [userId]
            );
            res.json(memories);
        } catch (error) {
            res.status(500).json({ error: "Erro ao recuperar memória." });
        }
    },

    saveMemory: async (req, res) => {
        try {
            const { key, value } = req.body;
            const userId = req.user.id;
            await db.execute(
                "INSERT INTO ai_memory (user_id, key_name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?",
                [userId, key, value, value]
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Erro ao salvar memória." });
        }
    },

    generateTTS: async (req, res) => {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: "O campo 'text' é obrigatório." });
            }

            const { exec } = require('child_process');
            const path = require('path');
            const fs = require('fs');

            // Configurar provedor e voz via .env (Padrão: edge-tts com Francisca)
            const ttsProvider = process.env.TTS_PROVIDER || 'edge';
            const voiceModel = process.env.VOICE_MODEL || 'pt-BR-FranciscaNeural';

            console.log(`[ATLAS TTS] Gerando voz Premium (${ttsProvider} - ${voiceModel}) para:`, text.substring(0, 50) + "...");

            if (ttsProvider !== 'edge') {
                console.warn("[ATLAS TTS] Provedores além de 'edge' não implementados ainda. Usando edge-tts padrão.");
            }

            // Sanitiza o texto para terminal (remove aspas perigosas)
            const safeText = text.replace(/"/g, '\\"').replace(/'/g, "");
            const tempFilePath = path.join(__dirname, '..', `temp_tts_${Date.now()}.mp3`);

            // Comando do edge-tts chamando o python como módulo
            const command = `python -m edge_tts --voice "${voiceModel}" --text "${safeText}" --write-media "${tempFilePath}"`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error("[ATLAS TTS] Erro catastrófico na geração (edge-tts):", error);
                    console.error("Stderr:", stderr);
                    return res.status(500).json({ error: "Erro interno na sintetização de voz (Edge TTS)." });
                }

                if (!fs.existsSync(tempFilePath)) {
                    console.error("[ATLAS TTS] Arquivo MP3 não foi gerado pelo edge-tts.");
                    return res.status(500).json({ error: "Falha na geração do arquivo de áudio." });
                }

                // Lê o buffer, deleta o arquivo temporário e envia o MP3 para o React
                const buffer = fs.readFileSync(tempFilePath);
                fs.unlinkSync(tempFilePath);

                res.set('Content-Type', 'audio/mpeg');
                res.send(buffer);
                console.log("[ATLAS TTS] Áudio Neural Livre gerado e enviado com sucesso.");
            });

        } catch (error) {
            console.error("[ATLAS TTS] Erro no endpoint TTS:", error);
            res.status(500).json({ error: "Erro assíncrono interno na sintetização de voz." });
        }
    }
};

module.exports = atlasController;
