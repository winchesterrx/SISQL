import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log("🚀 [SISSQL] SISTEMA INICIANDO...");

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("Elemento #root não encontrado no DOM!");
    }

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
    console.log("✅ [SISSQL] RENDERIZAÇÃO INICIAL DISPARADA.");
} catch (error) {
    console.error("❌ [SISSQL] ERRO FATAL NA INICIALIZAÇÃO:", error);
    document.body.innerHTML = `
        <div style="background: #1e293b; color: #ef4444; padding: 40px; font-family: sans-serif; height: 100vh;">
            <h1 style="font-size: 24px; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">SISSQL: ERRO CRÍTICO DE BOOT</h1>
            <pre style="background: #000; padding: 20px; border-radius: 10px; overflow: auto; margin-top: 20px;">${error.stack || error.message}</pre>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">Verifique o console do desenvolvedor para mais detalhes.</p>
        </div>
    `;
}
