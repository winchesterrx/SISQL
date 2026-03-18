import React, { useState, useEffect } from 'react';
import { MessageSquare, Database, Settings, Send, User, LogOut, ChevronRight, Activity, Zap, Sparkles, Shield, Cpu, Code2, Trash2, Plus, MessageCircle, Loader2, Copy, Brain, Menu, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import ReactMarkdown from 'react-markdown';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';

const WelcomeView = ({ user, onStart }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center"
    >
        <div className="mb-8 relative">
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <Sparkles className="w-20 h-20 text-blue-400 relative z-10" />
        </div>

        <h1 className="text-5xl font-black mb-4">
            Bem-vindo ao <span className="gradient-text">SISSQL</span>
        </h1>

        <p className="text-xl text-slate-400 mb-12 leading-relaxed">
            Sua central inteligente de suporte técnico. Aqui você gera comandos SQL precisos para os sistemas do seu setor, com o poder transformador da IA.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
            <div className="glass p-6 rounded-2xl border-white/5 hover:border-blue-500/30 transition-colors">
                <Shield className="w-10 h-10 text-emerald-400 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">Segurança de Dados</h3>
                <p className="text-sm text-slate-500">Acesso restrito apenas aos setores que sua bancada possui permissão.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-white/5 hover:border-blue-500/30 transition-colors">
                <Cpu className="w-10 h-10 text-blue-400 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">Multi-Cérebro</h3>
                <p className="text-sm text-slate-500">Escolha entre ChatGPT ou Gemini para obter a melhor resposta SQL.</p>
            </div>
            <div className="glass p-6 rounded-2xl border-white/5 hover:border-blue-500/30 transition-colors">
                <Code2 className="w-10 h-10 text-purple-400 mb-4 mx-auto" />
                <h3 className="font-bold mb-2">Firebird Expert</h3>
                <p className="text-sm text-slate-500">Suporte nativo às versões 2.5 e 5.0 com sintaxe otimizada.</p>
            </div>
        </div>

        <div className="space-y-4">
            <p className="text-slate-500 font-medium">Como começar?</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 font-bold">1. Escolha seu Setor na lateral</span>
                <span className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 font-bold">2. Envie sua dúvida no chat</span>
                <span className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 font-bold">3. Veja a mágica acontecer!</span>
            </div>
        </div>

        <motion.p
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="mt-16 text-xs text-slate-600 uppercase tracking-widest font-bold"
        >
            Selecione um setor à esquerda para iniciar o chat
        </motion.p>
    </motion.div>
);

const SQLCodeBlock = ({ code, version }) => {
    return (
        <div className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b1120] group/sql">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SQL FIREBIRD GERADO</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {version}
                    </span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(code);
                            alert("Código copiado!");
                        }}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Copiar código"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div className="p-5 font-mono text-[13px] leading-relaxed text-blue-100/90 overflow-x-auto custom-scrollbar whitespace-pre-wrap">
                {code.split('\n').map((line, i) => {
                    const isKeyword = (word) => ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LEFT', 'RIGHT', 'INNER', 'UNION', 'ALL', 'EXISTS', 'IN', 'AND', 'OR', 'BETWEEN', 'FIRST', 'ROWS', 'TO'].includes(word.toUpperCase());

                    return (
                        <div key={i} className="flex gap-4">
                            <span className="w-4 text-slate-700 text-right select-none">{i + 1}</span>
                            <span>
                                {line.split(/(\s+)/).map((part, j) => (
                                    isKeyword(part.trim()) ?
                                        <span key={j} className="text-blue-400 font-bold">{part}</span> :
                                        part
                                ))}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { nome: 'Usuário', email: 'user@sissql.com', bancada_id: 1 });
    const [sectors, setSectors] = useState([]);
    const [selectedSector, setSelectedSector] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState('2.5');
    const [provider, setProvider] = useState('openai');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [isFocused, setIsFocused] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [pergunta, setPergunta] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSectors, setLoadingSectors] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [synapses, setSynapses] = useState([]);
    const [isNeuralModalOpen, setIsNeuralModalOpen] = useState(false);
    const [newSynapseContent, setNewSynapseContent] = useState('');
    const [loadingNeurology, setLoadingNeurology] = useState(false);
    const [justLearned, setJustLearned] = useState(false);

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const res = await api.get('/me');
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            } catch (err) {
                console.error("Erro ao sincronizar perfil", err);
            }
        };
        syncProfile();
    }, []);

    useEffect(() => {
        const loadSectors = async () => {
            const bid = user?.bancada_id || user?.bancadaId;
            if (!bid && user?.role !== 'admin') {
                setLoadingSectors(false);
                return;
            }
            setLoadingSectors(true);
            try {
                const res = await api.get(`/user/sistemas/${bid}`);
                setSectors(res.data.map(s => ({
                    id: s.id,
                    nome: s.nome,
                    pronto: s.status === 'ready'
                })));
            } catch (err) {
                console.error("Erro ao carregar setores", err);
            } finally {
                setLoadingSectors(false);
            }
        };
        loadSectors();
    }, [user]);

    const loadSessions = async (sistemaId) => {
        try {
            const res = await api.get(`/chat/sessions/${sistemaId}`);
            setSessions(res.data);
            if (res.data.length > 0) {
                // Auto-selecionar a mais recente
                selectSession(res.data[0]);
            } else {
                createNewSession(sistemaId);
            }
        } catch (err) {
            console.error("Erro ao carregar sessões", err);
        }
    };

    const createNewSession = async (sistemaId) => {
        try {
            const res = await api.post('/chat/sessions', { sistemaId, titulo: 'Nova Conversa' });
            setSessions(prev => [res.data, ...prev]);
            setActiveSession(res.data);
            setMessages([]);
        } catch (err) {
            console.error("Erro ao criar nova sessão", err);
        }
    };

    const selectSession = async (session) => {
        setActiveSession(session);
        setLoading(true);
        try {
            const res = await api.get(`/chat/messages/${session.id}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Erro ao carregar mensagens", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (id) => {
        if (!window.confirm('Excluir esta conversa permanentemente?')) return;
        try {
            await api.delete(`/chat/sessions/${id}`);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (activeSession?.id === id) {
                setActiveSession(null);
                setMessages([]);
            }
        } catch (err) {
            console.error("Erro ao excluir sessão", err);
        }
    };

    useEffect(() => {
        if (selectedSector) {
            loadSessions(selectedSector.id);
            loadSynapses(selectedSector.id);
        }
    }, [selectedSector]);

    const loadSynapses = async (sistemaId) => {
        try {
            const res = await api.get(`/ai/synapses/${sistemaId}`);
            setSynapses(res.data);
        } catch (err) {
            console.error("Erro ao carregar sinapses", err);
        }
    };

    const addSynapse = async () => {
        if (!newSynapseContent.trim() || !selectedSector) return;
        setLoadingNeurology(true);
        try {
            await api.post('/ai/synapses', { sistemaId: selectedSector.id, content: newSynapseContent });
            setNewSynapseContent('');
            loadSynapses(selectedSector.id);
        } catch (err) {
            console.error("Erro ao salvar sinapse", err);
        } finally {
            setLoadingNeurology(false);
        }
    };

    const removeSynapse = async (id) => {
        try {
            await api.delete(`/ai/synapses/${id}`);
            loadSynapses(selectedSector.id);
        } catch (err) {
            console.error("Erro ao remover sinapse", err);
        }
    };

    useEffect(() => {
        if (selectedSector) {
            setShowWelcome(false);
        }
    }, [selectedSector]);

    const sendMessage = async () => {
        if (!pergunta.trim() || !selectedSector) return;

        const newMsg = { role: 'user', content: pergunta };
        setMessages([...messages, newMsg]);
        setPergunta('');
        setLoading(true);

        try {
            const res = await api.post('/ai/ask', {
                sistemaId: selectedSector.id,
                pergunta,
                versaoFirebird: selectedVersion,
                provider,
                sessionId: activeSession.id
            });
            // Atualizar as tags da sessão no estado local (sobrescrever com o uso atual)
            setSessions(prev => prev.map(s =>
                s.id === activeSession.id
                    ? {
                        ...s,
                        firebird_version: selectedVersion,
                        ai_provider: provider,
                        titulo: res.data.novoTitulo || s.titulo
                    }
                    : s
            ));

            setMessages(prev => [...prev, { role: 'ai', content: res.data.sql }]);

            // 🧠 SE A IA APRENDEU ALGO NOVO
            if (res.data.learned) {
                loadSynapses(selectedSector.id);
                setJustLearned(true);
                setTimeout(() => setJustLearned(false), 5000); // 5 segundos de brilho
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Erro inesperado ao gerar SQL. Tente novamente mais tarde.';
            setMessages(prev => [...prev, { role: 'error', content: errorMsg }]);
        } finally {
            setLoading(false);
        }
    };

    // Scroll automático para o fim do chat
    useEffect(() => {
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, loading]);

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen w-full bg-dark-bg text-slate-100 overflow-hidden font-sans relative">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:relative inset-y-0 left-0 w-72 glass border-r border-white/5 flex flex-col z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="cursor-pointer" onClick={() => { setSelectedSector(null); setShowWelcome(true); if(window.innerWidth < 768) setIsSidebarOpen(false); }}>
                        <h1 className="text-2xl font-black gradient-text">SISSQL</h1>
                        <div className="flex items-center justify-between mt-2">
                            <div className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-sm inline-block uppercase tracking-[0.2em]">
                                Painel v1.0
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {user?.role === 'admin' && (
                    <div className="px-6 py-4 border-b border-white/5">
                        <Link to="/admin" className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-3 py-2.5 rounded-lg uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" /> Acessar Painel Admin
                        </Link>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar">
                    {!selectedSector ? (
                        <>
                            <div className="flex items-center justify-between px-2 mb-4">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Seus Setores</p>
                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">{sectors.length}</span>
                            </div>

                            <div className="space-y-1">
                                {loadingSectors ? (
                                    <div className="p-4 flex flex-col items-center gap-2 opacity-50">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Sincronizando...</p>
                                    </div>
                                ) : sectors.length === 0 ? (
                                    <div className="p-4 text-center">
                                        <p className="text-xs text-slate-500">Nenhum setor disponível para esta bancada.</p>
                                    </div>
                                ) : sectors.map(sector => (
                                    <button
                                        key={sector.id}
                                        onClick={() => { setSelectedSector(sector); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group relative overflow-hidden ${selectedSector?.id === sector.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <Database className={`w-5 h-5 ${selectedSector?.id === sector.id ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'}`} />
                                            <span className="font-semibold text-sm">{sector.nome}</span>
                                        </div>
                                        {sector.pronto ? (
                                            <Zap className={`w-4 h-4 relative z-10 ${selectedSector?.id === sector.id ? 'text-blue-200' : 'text-yellow-500 animate-pulse'}`} />
                                        ) : (
                                            <Activity className="w-4 h-4 text-slate-700 relative z-10" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-6">
                                <button
                                    onClick={() => setSelectedSector(null)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                                <div className="flex-1 truncate">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Conversas em</p>
                                    <h3 className="text-sm font-bold truncate">{selectedSector.nome}</h3>
                                </div>
                            </div>

                            <button
                                onClick={() => createNewSession(selectedSector.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 mb-6 rounded-xl border border-white/5 bg-white/5 hover:bg-blue-600 hover:text-white transition-all group shadow-inner"
                            >
                                <Plus className="w-4 h-4 text-blue-400 group-hover:text-white" />
                                <span className="text-sm font-bold">Novo Chat</span>
                            </button>

                            <div className="flex-1 space-y-1 overflow-y-auto">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Histórico</p>
                                {sessions.map(session => (
                                    <div
                                        key={session.id}
                                        className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer border ${activeSession?.id === session.id
                                            ? 'bg-blue-600/10 text-white border-blue-500/30'
                                            : 'text-slate-400 hover:bg-white/5 border-transparent hover:text-slate-200'
                                            }`}
                                        onClick={() => { selectSession(session); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className={`text-sm font-medium truncate ${activeSession?.id === session.id ? 'text-white' : 'text-slate-300'}`}>
                                                    {session.titulo}
                                                </span>
                                                <div className="flex gap-1 shrink-0">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase">
                                                        FB {session.firebird_version || '2.5'}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${(session.ai_provider || 'openai') === 'openai'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                        }`}>
                                                        {session.ai_provider || 'openai'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 p-3 glass rounded-2xl border-white/5 shadow-inner">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg">
                            {user?.nome?.charAt(0) || 'G'}
                        </div>
                        <div className="flex-1 truncate">
                            <p className="font-bold text-sm text-white">{user?.nome || 'Admin'}</p>
                            <p className="text-[10px] text-slate-500 truncate uppercase tracking-tight">{user?.email || 'admin@sissql.com'}</p>
                        </div>
                        <button onClick={logout} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col w-full min-w-0 relative overflow-hidden">
                {/* Mobile Topbar */}
                <div className="md:hidden p-4 border-b border-white/5 flex items-center gap-3 glass sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg text-white hover:bg-white/10 active:scale-95 transition-all">
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-black gradient-text truncate">SISSQL</h1>
                </div>

                {/* Header Seletores */}
                {!showWelcome && (
                    <motion.header
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                <Activity className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-bold text-blue-400">{selectedSector?.nome}</span>
                            </div>
                            <div className="h-4 w-px bg-white/10 mx-2"></div>
                            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/5 shadow-inner">
                                {['2.5', '5.0'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setSelectedVersion(v)}
                                        className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedVersion === v ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
                                    >
                                        FIREBIRD {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsNeuralModalOpen(true)}
                                className={`p-2 rounded-xl border transition-all flex items-center gap-2 font-black text-xs uppercase relative overflow-hidden ${justLearned ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : (synapses.length > 0 ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white border-blue-400/50' : 'bg-slate-800/80 text-slate-500 hover:text-blue-400 hover:border-blue-400/30 border-white/5')}`}
                                title="Memória Neural (Neurology AI)"
                            >
                                {justLearned && (
                                    <motion.div
                                        initial={{ x: '-100%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    />
                                )}
                                <Brain className={`w-4 h-4 ${synapses.length > 0 || justLearned ? 'animate-pulse' : ''}`} />
                                <span className="hidden md:inline">{justLearned ? 'IA APRENDEU! ✨' : 'Neurology AI'}</span>
                            </button>

                            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/5 shadow-inner">
                                {['openai', 'gemini'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setProvider(p)}
                                        className={`px-4 py-1.5 text-xs font-black rounded-lg uppercase transition-all flex items-center gap-2 ${provider === p ? (p === 'openai' ? 'bg-emerald-600' : 'bg-purple-600') + ' text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
                                    >
                                        {p === 'openai' ? <Sparkles className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                        {p === 'gemini' ? 'GÊMEOS' : p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.header>
                )}

                <AnimatePresence mode="wait">
                    {showWelcome ? (
                        <WelcomeView user={user} key="welcome" />
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Chat Area - Corrigido para ser flex-1 e controlar o scroll */}
                            <div className="flex-1 overflow-hidden flex flex-col relative">
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={idx}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] rounded-3xl p-5 shadow-2xl relative ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-700 to-blue-600 text-white rounded-tr-none' : 'glass border-white/5 rounded-tl-none'}`}>
                                                {msg.role === 'user' ? (
                                                    <p className="text-[15px] leading-relaxed font-medium">{msg.content}</p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {msg.role === 'error' ? (
                                                            <p className="text-red-400 font-bold">{msg.content}</p>
                                                        ) : (
                                                            <div className="text-[15px] leading-relaxed w-full overflow-hidden markdown-text">
                                                                <ReactMarkdown
                                                                    className="prose prose-invert prose-sm max-w-none w-full"
                                                                    components={{
                                                                        code({node, inline, className, children, ...props}) {
                                                                            const match = /language-(\w+)/.exec(className || '');
                                                                            if (!inline && match && match[1] === 'sql') {
                                                                                return (
                                                                                    <div className="my-4">
                                                                                        <SQLCodeBlock
                                                                                            code={String(children).replace(/\n$/, '')}
                                                                                            version={selectedVersion}
                                                                                        />
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return !inline ? (
                                                                                <SyntaxHighlighter
                                                                                    style={dracula}
                                                                                    language={match ? match[1] : 'text'}
                                                                                    PreTag="div"
                                                                                    className="rounded-lg my-4 !bg-black/30 !border !border-white/10"
                                                                                    {...props}
                                                                                >
                                                                                    {String(children).replace(/\n$/, '')}
                                                                                </SyntaxHighlighter>
                                                                            ) : (
                                                                                <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-blue-300 font-mono text-[13px]" {...props}>
                                                                                    {children}
                                                                                </code>
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {msg.content || ''}
                                                                </ReactMarkdown>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="glass p-5 rounded-3xl rounded-tl-none flex flex-col gap-3 border-white/5 max-w-[400px]">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-1.5">
                                                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                        <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-purple-500 rounded-full" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processamento Neural...</span>
                                                </div>

                                                <div className="space-y-2 border-l border-white/10 pl-4 py-1">
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center gap-2 text-[9px] text-blue-400/60 font-medium"
                                                    >
                                                        <Database className="w-3 h-3" /> Acessando Sinapses do Setor...
                                                    </motion.div>
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.8 }}
                                                        className="flex items-center gap-2 text-[9px] text-purple-400/60 font-medium"
                                                    >
                                                        <Brain className="w-3 h-3" /> Recuperando Contexto Histórico...
                                                    </motion.div>
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 1.6 }}
                                                        className="flex items-center gap-2 text-[9px] text-emerald-400/60 font-medium"
                                                    >
                                                        <Sparkles className="w-3 h-3" /> Gerando SQL Firebird {selectedVersion}...
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Anchor para scroll automático */}
                                    <div id="chat-end" />
                                </div>

                                {/* Input Area - Fixada no rodapé via Flex com Posição Ajustada */}
                                <div className="p-4 md:p-8 pb-6 md:pb-20 bg-gradient-to-t from-dark-bg via-dark-bg to-transparent relative z-30">
                                    <div className="max-w-5xl mx-auto relative group">
                                        {/* Borda LED Animada (Neon Moderno com Estados) */}
                                        <div className={`ai-border-led 
                                            ${loading ? 'ai-border-led-processing' : ''} 
                                            ${showSuccess ? 'ai-border-led-success' : ''} 
                                            ${isFocused || loading || showSuccess ? 'ai-border-led-active' : ''}`}>
                                            <div className={`ai-inner-container relative flex items-center p-3 transition-all duration-500 ${loading ? 'thinking-bg' : 'bg-[#0f172a]'}`}>
                                                <div className="pl-4 pr-2">
                                                    {loading ? (
                                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                                            <Cpu className="w-5 h-5 text-blue-400" />
                                                        </motion.div>
                                                    ) : (
                                                        <MessageSquare className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-400' : 'text-slate-500'}`} />
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={pergunta}
                                                    onChange={(e) => setPergunta(e.target.value)}
                                                    onFocus={() => setIsFocused(true)}
                                                    onBlur={() => setIsFocused(false)}
                                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                    disabled={loading}
                                                    placeholder={loading ? "A Inteligência está formulando a lógica..." : `Descreva sua dúvida técnica sobre o banco da ${selectedSector?.nome}...`}
                                                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-slate-600 font-medium text-sm disabled:text-slate-400"
                                                />
                                                <button
                                                    onClick={sendMessage}
                                                    disabled={loading}
                                                    className={`relative overflow-hidden p-4 rounded-3xl transition-all shadow-xl active:scale-105 flex items-center justify-center ${loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/30'}`}
                                                >
                                                    {loading ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Send className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Glow Inferior Estilo AI */}
                                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-4 rounded-full blur-[30px] transition-all duration-1000 z-10 ${loading ? 'bg-blue-500/50 opacity-100' : 'bg-transparent opacity-0'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de Memória Neural (Neurology) */}
                <AnimatePresence>
                    {isNeuralModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsNeuralModalOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-2xl glass border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.2)] flex flex-col max-h-[80vh]"
                            >
                                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-600/10 to-transparent flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                                            <Brain className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                                                Cérebro Neural <span className="text-blue-500">Neurology</span>
                                            </h2>
                                            <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-[0.2em]">Visualização Completa de Sinapses e Conhecimentos Ativos</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsNeuralModalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                                        <LogOut className="w-6 h-6 rotate-180" />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05),transparent)]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        <div className="glass p-4 rounded-2xl border-blue-500/10 bg-blue-500/5">
                                            <Activity className="w-5 h-5 text-blue-400 mb-2" />
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Status do Cérebro</h4>
                                            <p className="text-sm font-bold text-white">Totalmente Operacional</p>
                                        </div>
                                        <div className="glass p-4 rounded-2xl border-emerald-500/10 bg-emerald-500/5">
                                            <Cpu className="w-5 h-5 text-emerald-400 mb-2" />
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Modo de Aprendizado</h4>
                                            <p className="text-sm font-bold text-white">Self-Learning Ativado</p>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-yellow-500" /> Ensinar Novo Conhecimento Permanente
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newSynapseContent}
                                                onChange={(e) => setNewSynapseContent(e.target.value)}
                                                placeholder="Ex: 'O campo STATUS=1 significa cadastro ativo', 'Sempre traga os nomes em ordem alfabética'..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all"
                                                onKeyPress={(e) => e.key === 'Enter' && addSynapse()}
                                            />
                                            <button
                                                onClick={addSynapse}
                                                disabled={loadingNeurology}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                            >
                                                {loadingNeurology ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Memorizar'}
                                            </button>
                                        </div>
                                        <p className="mt-2 text-[10px] text-slate-500 italic">Essas regras serão carregadas em TODAS as conversas futuras deste setor.</p>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block font-bold">Sinapses Ativas ({synapses.length})</label>
                                        </div>
                                        {synapses.length === 0 ? (
                                            <div className="p-8 text-center glass border-dashed border-white/5 rounded-2xl">
                                                <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                                <p className="text-sm text-slate-500 italic">A IA ainda não possui memórias personalizadas para este setor. Ensine algo agora!</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {synapses.map(s => (
                                                    <motion.div
                                                        layout
                                                        key={s.id}
                                                        className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-blue-500/20 transition-all"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                                                            <span className="text-sm text-slate-300 pr-4">{s.content}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeSynapse(s.id)}
                                                            className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                                    <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-black">Neurology Engine Powered by SISSQL Core v1.0</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;

