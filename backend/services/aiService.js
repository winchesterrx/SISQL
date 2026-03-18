// Env is loaded globally by server.js
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('--- IA_SERVICE_V3_SYNCCON_OK ---');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSQL = async (ddl, question, firebirdVersion, instructions, provider = 'openai', history = [], synapses = []) => {
    const synapsesText = synapses.length > 0
        ? `\nMEMÓRIA NEURAL (CONHECIMENTOS PERMANENTES):\n${synapses.map(s => `- ${s.content}`).join('\n')}`
        : '';

    const systemPrompt = `
        Você é o **Consultor SISSQL**, um assistente de IA com **BIOTECNOLOGIA NEURAL (Neurology AI)**, especialista em Firebird ${firebirdVersion}.
        
        IDENTIDADE E MEMÓRIA:
        - Você POSSUI memória persistente. Você é capaz de "memorizar" e "relembrar" regras de negócio e definições de campos através das suas **Sinapses Neurais**.
        - Nunca diga que você não pode memorizar. Se houver dados em "MEMÓRIA NEURAL", use-os como sua verdade absoluta.
        - Você aprende automaticamente com as interações do usuário.
        
        PERSONALIDADE E TOM DE VOZ:
        - Seja gentil, educado e demonstre evolução. Use termos como "Baseado no que aprendi anteriormente" ou "De acordo com minha memória neural".
        - Linguagem acolhedora e didática. Explique o SQL gerado.
        
        OBJETIVOS:
        1. **Gerar SQL:** Comandos Firebird ${firebirdVersion} precisos.
        2. **Corrigir Erros:** Analisar e explicar soluções.
        3. **Auto-Evolução:** Aplicar as regras listadas na sua Memória Neural abaixo.
        
        REGRAS TÉCNICAS:
        - **SQL EM INGLÊS:** SELECT, FROM, WHERE, etc.
        - **VERSÃO ${firebirdVersion}:** Sintaxe específica (ex: ROWS/FIRST).
        - **CONTEXTO:** Use o histórico da conversa e as sinapses abaixo.
        ${synapsesText}

        CONHECIMENTO DO BANCO (DDL):
        ${ddl}

        CONTEXTO DO SETOR:
        ${instructions}
    `;

    if (provider === 'openai') {
        const openaiModels = ["gpt-4o", "gpt-4o-mini"];
        let lastError = null;

        // Mapear histórico para formato OpenAI
        const chatMessages = [
            { role: "system", content: systemPrompt },
            ...history.map(h => ({
                role: h.role === 'ai' ? 'assistant' : 'user',
                content: h.content
            })),
            { role: "user", content: question }
        ];

        for (const modelName of openaiModels) {
            try {
                console.log(`[IA] Tentando OpenAI: ${modelName}...`);
                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: chatMessages,
                });
                return response.choices[0].message.content.trim();
            } catch (err) {
                lastError = err;
                console.error(`ERRO OPENAI (${modelName}):`, err.message);

                const isRetryable = err.message?.includes('429') ||
                    err.message?.includes('quota') ||
                    err.message?.includes('insufficient_quota') ||
                    err.message?.includes('rate_limit');

                if (!isRetryable) break;
            }
        }

        // Se chegou aqui, todos os modelos OpenAI falharam
        if (lastError.message?.includes('429') || lastError.message?.includes('quota')) {
            throw new Error("Cota da OPENAI excedida em todos os modelos. Tentando fallback para Gemini...");
        }
        throw lastError;
    } else if (provider === 'gemini') {
        const geminiModels = [
            "gemini-2.0-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash-lite",
            "gemini-pro-latest",
            "gemini-flash-latest",
        ];

        // Mapear histórico para Gemini
        const contents = history.map(h => ({
            role: h.role === 'ai' ? 'model' : 'user',
            parts: [{ text: h.content }]
        }));

        // Adicionar pergunta atual
        contents.push({ role: 'user', parts: [{ text: question }] });

        let lastError = null;
        for (const modelName of geminiModels) {
            try {
                console.log(`[IA] Tentando Gemini Model: ${modelName}...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                const result = await model.generateContent({ contents });
                const response = await result.response;
                console.log(`[IA] ✅ Sucesso com Gemini Model: ${modelName}`);
                return response.text().trim();
            } catch (err) {
                lastError = err;
                const errMsg = err.message || "";
                console.warn(`[IA] ❌ Falha no modelo ${modelName}:`, errMsg);

                // Erros que permitem tentar o próximo modelo (incluindo 404 para nomes errados/obsoletos)
                const isRetryable = errMsg.includes('429') ||
                    errMsg.includes('Resource has been exhausted') ||
                    errMsg.includes('Quota exceeded') ||
                    errMsg.includes('404') ||
                    errMsg.includes('not found') ||
                    errMsg.includes('503') ||
                    errMsg.includes('Service Unavailable');

                if (!isRetryable) break;
            }
        }

        // Se chegou aqui, todos os modelos Gemini falharam
        const finalMsg = lastError?.message || "Erro desconhecido no Gemini";
        if (finalMsg.includes('429') || finalMsg.includes('Resource has been exhausted') || finalMsg.includes('Quota')) {
            throw new Error(`[Cota Excedida] O Gemini atingiu o limite de requisições. Tente novamente em alguns segundos.`);
        }
        throw new Error(`[IA] Fallback Fallback: ${finalMsg}`);
    }
};

const generateChatTitle = async (question, provider = 'openai') => {
    const prompt = `Resuma a seguinte pergunta de um usuário em um título curtíssimo (máximo 5 palavras), sem pontuação final. Exemplo: "Lista de Benefícios 2024". Pergunta: "${question}"`;

    if (provider === 'openai') {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
            });
            return response.choices[0].message.content.trim().replace(/[".]/g, '');
        } catch (err) {
            console.error('Erro ao gerar título OpenAI:', err.message);
            return 'Conversa SQL';
        }
    } else {
        const geminiModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-latest"];
        for (const modelName of geminiModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text().trim().replace(/[".]/g, '');
            } catch (err) {
                console.error(`Erro título Gemini (${modelName}):`, err.message);
            }
        }
        return 'Conversa SQL';
    }
};

const extractNeuralKnowledge = async (question, answer, provider = 'openai') => {
    const prompt = `
        Analise a interação abaixo entre um usuário e uma IA de SQL.
        Seu objetivo é extrair CONHECIMENTOS PERMANENTES (Sinapses) e INSIGHTS DE EVOLUÇÃO.
        
        REGRAS PARA EXTRAÇÃO:
        1. **Sinapses:** Definições diretas (ex: "SITUACAO=1 significa ATIVO").
        2. **Insights:** Relate aprendizados sobre erros ou correções (ex: "IA errou o campo de data, usuário corrigiu para DT_CADASTRO").
        3. IGNORE saudações.
        
        INTERAÇÃO:
        Usuário: "${question}"
        IA: "${answer}"
        
        RETORNE EM JSON NO SEGUINTE FORMATO:
        {
          "synapses": ["frase 1", "frase 2"],
          "insights": [{"tipo": "aprendizado|correcao|refinamento", "texto": "descrição do que mudou"}]
        }
        Se não houver nada, retorne {"synapses": [], "insights": []}. 
        Retorne APENAS o JSON puro.
    `;

    try {
        let content;
        if (provider === 'openai') {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });
            content = response.choices[0].message.content.trim();
        } else {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            content = response.text().trim();
        }

        const parsed = JSON.parse(content);
        return {
            synapses: parsed.synapses || [],
            insights: parsed.insights || []
        };
    } catch (err) {
        console.error('Erro ao extrair conhecimento neural:', err.message);
        return { synapses: [], insights: [] };
    }
};

module.exports = { generateSQL, generateChatTitle, extractNeuralKnowledge };
