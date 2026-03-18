import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Activity, Cpu, Sparkles, Database, History, ChevronRight, Users } from 'lucide-react';
import api from '../../services/api';

const AICortex = () => {
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState([]);
    const [synapses, setSynapses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [sRes, iRes, synRes] = await Promise.all([
                api.get('admin/ai/stats'),
                api.get('admin/ai/insights'),
                api.get('admin/ai/all-synapses')
            ]);
            setStats(sRes.data);
            setInsights(iRes.data);
            setSynapses(synRes.data);
        } catch (err) {
            console.error("Erro ao carregar Córtex IA", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s update
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
            <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <Brain className="w-12 h-12 text-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)]" />
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mapeando Sinapses...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header com Animação de Neurônios */}
            <div className="relative glass p-10 rounded-[3rem] border-white/5 overflow-hidden bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
                            animate={{
                                x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                                y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                                scale: [1, 1.5, 1],
                                opacity: [0.1, 0.4, 0.1]
                            }}
                            transition={{ duration: 10 + Math.random() * 20, repeat: Infinity }}
                            className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
                        />
                    ))}
                    <svg className="absolute inset-0 w-full h-full opacity-10">
                        <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        {[...Array(15)].map((_, i) => (
                            <motion.line
                                key={i}
                                x1={Math.random() * 100 + '%'}
                                y1={Math.random() * 100 + '%'}
                                x2={Math.random() * 100 + '%'}
                                y2={Math.random() * 100 + '%'}
                                stroke="url(#lineGrad)"
                                strokeWidth="0.5"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: [0, 1, 0], opacity: [0, 0.2, 0] }}
                                transition={{ duration: 5 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5 }}
                            />
                        ))}
                    </svg>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-6 bg-blue-600 rounded-[2rem] shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-blue-400/50">
                        <Brain className="w-16 h-16 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Córtex Neural SISSQL</h2>
                        <p className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-4">Núcleo Central de Processamento e Aprendizado</p>
                        <div className="flex gap-4">
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-lg uppercase flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> IA Operacional
                            </span>
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black rounded-lg uppercase">
                                Modo: Self-Learning v2.5
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total de Sinapses', value: stats?.totalSynapses || 0, icon: Database, color: 'text-blue-500' },
                    { label: 'Insights Gerados', value: stats?.totalInsights || 0, icon: Zap, color: 'text-yellow-500' },
                    { label: 'Evolução (7d)', value: `+${stats?.learningRate || 0}`, icon: Activity, color: 'text-emerald-500' },
                    { label: 'Setores Mapeados', value: [...new Set(synapses.map(s => s.sistema_id))].length, icon: Cpu, color: 'text-purple-500' },
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="glass p-6 rounded-3xl border-white/5 hover:border-white/10 transition-all group"
                    >
                        <item.icon className={`w-8 h-8 ${item.color} mb-4 group-hover:scale-110 transition-transform`} />
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</h4>
                        <p className="text-3xl font-black text-white">{item.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Insights Feed */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5 overflow-hidden relative">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <History className="text-blue-400" /> Feed de Evolução
                    </h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {insights.length === 0 ? (
                            <div className="text-center py-20 text-slate-600 font-bold uppercase text-[10px]">Aguardando primeiros aprendizados...</div>
                        ) : insights.map((insight, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={insight.id}
                                className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${insight.tipo === 'correcao' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {insight.tipo}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-bold">
                                        {new Date(insight.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-300 leading-tight mb-2">"{insight.insight}"</p>
                                <div className="flex items-center gap-2 text-[9px] text-slate-600 font-black uppercase">
                                    <Database className="w-3 h-3" /> {insight.sistema_nome}
                                    <ChevronRight className="w-3 h-3" />
                                    <Users className="w-3 h-3" /> {insight.usuario_nome}
                                </div>
                                {insight.contexto && (
                                    <div className="mt-2 p-2 bg-black/20 rounded-lg text-[10px] text-slate-500 italic">
                                        Contexto: {insight.contexto}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Mapa de Sinapses Coletivas */}
                <div className="glass p-8 rounded-[2.5rem] border-white/5">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Database className="text-purple-400" /> Inteligência Coletiva (Sinapses)
                    </h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {synapses.map((syn, idx) => (
                            <div key={syn.id} className="p-4 bg-slate-800/50 border border-white/5 rounded-xl hover:border-purple-500/30 transition-all flex items-center gap-4">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-white mb-1">{syn.content}</p>
                                    <div className="flex items-center gap-3 text-[9px] text-slate-500 font-black uppercase">
                                        <span className="text-purple-400">{syn.sistema_nome}</span>
                                        <span className="text-slate-700">|</span>
                                        <span>Por: {syn.usuario_nome}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AICortex;
