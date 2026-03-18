import React, { useState, useEffect } from 'react';
import {
    Users, ShieldCheck, Database, LayoutDashboard, Plus,
    Trash2, CheckCircle2, UploadCloud, Loader2, Sparkles, Cpu,
    Code2, ArrowLeft, Check, Server, Key, Zap, Brain, Activity, UserCheck, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import AICortex from './AICortex';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('status');
    const [users, setUsers] = useState([]);
    const [sistemas, setSistemas] = useState([]);
    const [bancadas, setBancadas] = useState([]);
    const [aiStatus, setAiStatus] = useState({ openai: false, gemini: false });
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedPendingUser, setSelectedPendingUser] = useState(null);
    const [approveBancadaId, setApproveBancadaId] = useState('');
    const [approveRole, setApproveRole] = useState('user');

    // Form states
    const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', role: 'user', bancadaId: '' });
    const [editingUser, setEditingUser] = useState(null);

    // AI Training states
    const [selectedSistema, setSelectedSistema] = useState(null);
    const [ddlContent, setDdlContent] = useState('');
    const [orientacoesIa, setOrientacoesIa] = useState('');
    const [savingDDL, setSavingDDL] = useState(false);
    const [fdbFile, setFdbFile] = useState(null);
    const [uploadingFdb, setUploadingFdb] = useState(false);

    const fetchData = async () => {
        try {
            const [uRes, sRes, stRes, bRes, pRes] = await Promise.all([
                api.get('admin/users'),
                api.get('admin/sistemas'),
                api.get('admin/status'),
                api.get('admin/bancadas'),
                api.get('admin/pending-users').catch(() => ({ data: [] }))
            ]);
            setUsers(uRes.data || []);
            const newSistemas = sRes.data || [];
            setSistemas(newSistemas);
            setAiStatus(stRes.data || { openai: false, gemini: false });
            setBancadas(bRes.data || []);
            setPendingUsers(pRes.data || []);

            // Sync selected sistema if any
            if (selectedSistema) {
                const updated = newSistemas.find(s => s.id === selectedSistema.id);
                if (updated) setSelectedSistema(updated);
            }
        } catch (err) {
            console.error("Erro ao carregar dados admin", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('admin/users', newUser);
            setShowUserModal(false);
            setNewUser({ nome: '', email: '', senha: '', role: 'user', bancadaId: '' });
            fetchData();
            alert("Usuário criado com sucesso!");
        } catch (err) {
            alert("Erro ao criar usuário: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
        try {
            await api.delete(`admin/users/${id}`);
            fetchData();
            alert("Usuário excluído com sucesso!");
        } catch (err) {
            alert("Erro ao excluir usuário.");
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`admin/users/${editingUser.id}`, editingUser);
            setShowEditModal(false);
            setEditingUser(null);
            fetchData();
            alert("Usuário atualizado com sucesso!");
        } catch (err) {
            alert("Erro ao atualizar usuário: " + (err.response?.data?.error || err.message));
        }
    };

    const handleUploadDDL = async (e) => {
        e.preventDefault();
        if (!selectedSistema) return;
        setSavingDDL(true);
        try {
            await api.post('admin/upload-ddl', {
                sistemaId: selectedSistema.id,
                ddlContent,
                orientacoesIa
            });
            alert("Metadados salvos com sucesso!");
            fetchData();
        } catch (err) {
            alert("Erro ao salvar: " + (err.response?.data?.error || err.message));
        } finally {
            setSavingDDL(false);
        }
    };

    const handleFDBUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedSistema) return;

        const formData = new FormData();
        formData.append('fdb', file);
        formData.append('sistemaId', selectedSistema.id);

        setUploadingFdb(true);
        try {
            await api.post('admin/upload-fdb', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Banco .fdb enviado com sucesso!");
            fetchData();
        } catch (err) {
            alert("Erro no upload do .fdb: " + (err.response?.data?.error || err.message));
        } finally {
            setUploadingFdb(false);
            setFdbFile(null);
        }
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="h-screen bg-dark-bg flex flex-col items-center justify-center gap-4 text-white">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="font-bold uppercase tracking-widest text-slate-500">Sincronizando Sistema...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-dark-bg text-slate-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 glass border-r border-white/5 flex flex-col z-30">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h1 className="text-xl font-black gradient-text">ADMIN</h1>
                    <Link to="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('status')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'status' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-bold text-sm">Status</span>
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
                        <Users className="w-5 h-5" />
                        <span className="font-bold text-sm">Usuários</span>
                    </button>
                    <button onClick={() => setActiveTab('pending')} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'pending' ? 'bg-amber-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-5 h-5" />
                            <span className="font-bold text-sm">Aprovações</span>
                        </div>
                        {pendingUsers.length > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('db')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'db' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
                        <Database className="w-5 h-5" />
                        <span className="font-bold text-sm">Setores & IA</span>
                    </button>
                    <button onClick={() => setActiveTab('cortex')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'cortex' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'hover:bg-white/5 text-slate-400'}`}>
                        <Brain className="w-5 h-5" />
                        <span className="font-bold text-sm">Córtex IA</span>
                    </button>
                    <Link to="/admin/atlas" className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all hover:bg-cyan-600 text-slate-400 hover:text-white group">
                        <Activity className="w-5 h-5 group-hover:animate-pulse text-cyan-500" />
                        <span className="font-bold text-sm">Interface ATLAS</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 relative">
                {activeTab === 'status' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <h2 className="text-4xl font-black text-white">Status da Infraestrutura</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                                {aiStatus.openai && <div className="absolute top-0 right-0 p-4 animate-pulse"><Zap className="w-4 h-4 text-emerald-500/50" /></div>}
                                <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-white">OpenAI <Sparkles className="text-emerald-400 w-5 h-5" /></h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${aiStatus.openai ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${aiStatus.openai ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {aiStatus.openai ? 'Ativo e Pronto' : 'Indisponível / Erro'}
                                    </span>
                                </div>
                            </div>
                            <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                                {aiStatus.gemini && <div className="absolute top-0 right-0 p-4 animate-pulse"><Zap className="w-4 h-4 text-purple-500/50" /></div>}
                                <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-white">Gêmeos <Cpu className="text-purple-400 w-5 h-5" /></h3>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${aiStatus.gemini ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${aiStatus.gemini ? 'text-purple-500' : 'text-red-500'}`}>
                                        {aiStatus.gemini ? 'Ativo e Pronto' : 'Indisponível / Erro'}
                                    </span>
                                </div>
                            </div>
                            <div className="glass p-8 rounded-[2.5rem] border-white/5">
                                <h3 className="text-xl font-black mb-4 flex items-center gap-2">Banco de Dados <Server className="text-blue-400 w-5 h-5" /></h3>
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Ativo</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-white">Usuários</h2>
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="bg-blue-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Plus className="w-5 h-5" /> Novo Usuário
                            </button>
                        </div>
                        <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Nome</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">E-mail</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Bancada</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Role</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold">{u.nome}</td>
                                            <td className="px-6 py-4 text-slate-400">{u.email}</td>
                                            <td className="px-6 py-4 text-sm">{u.bancada_nome}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${u.role === 'admin' ? 'border-amber-500/50 text-amber-500 bg-amber-500/5' : 'border-slate-700 text-slate-500 bg-slate-800'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                                                    className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-white">Aprovações Pendentes</h2>
                        </div>
                        <div className="glass rounded-[2rem] border-white/5 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">Nome</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500">E-mail</th>
                                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-500 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-8 text-center text-slate-500 font-bold">Nenhum cadastro pendente no momento.</td>
                                        </tr>
                                    ) : pendingUsers.map(u => (
                                        <tr key={u.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold">{u.nome}</td>
                                            <td className="px-6 py-4 text-slate-400">{u.email}</td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedPendingUser(u); setApproveBancadaId(''); setApproveRole('user'); setShowApproveModal(true); }}
                                                    className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-all"
                                                    title="Aprovar"
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Rejeitar e excluir cadastro?')) {
                                                            await api.post(`/admin/reject-user/${u.id}`);
                                                            fetchData();
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all"
                                                    title="Rejeitar"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'db' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-white">Setores & IA</h2>
                            {selectedSistema && (
                                <button
                                    onClick={() => { setSelectedSistema(null); setDdlContent(''); setOrientacoesIa(''); }}
                                    className="text-slate-500 hover:text-white flex items-center gap-2 text-sm font-bold transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Voltar para lista
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Lista de Sistemas */}
                            <div className={`glass p-6 rounded-[2rem] border-white/5 space-y-4 ${selectedSistema ? 'hidden lg:block' : 'col-span-1 lg:col-span-3'}`}>
                                <label className="text-xs font-black uppercase text-slate-500 block mb-4">Sistemas Cadastrados</label>
                                <div className={`grid gap-3 ${selectedSistema ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                                    {sistemas.map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                setSelectedSistema(s);
                                                setDdlContent(''); // Limpa para evitar crash de 50MB no browser
                                                setOrientacoesIa(s.orientacoes_ia || '');
                                            }}
                                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${selectedSistema?.id === s.id ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 hover:border-blue-500/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${s.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-500'}`}>
                                                    <Database className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-sm">{s.nome} {s.has_ddl ? '(Esquema Salvo)' : ''}</span>
                                            </div>
                                            {s.status === 'ready' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Editor de Treinamento */}
                            {selectedSistema ? (
                                <div className="lg:col-span-2 space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <form onSubmit={handleUploadDDL} className="glass p-8 rounded-[2.5rem] border-white/10 shadow-2xl space-y-6">
                                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <Sparkles className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white">Treinar IA: {selectedSistema.nome}</h3>
                                                <p className="text-xs text-slate-500">Configure como a IA deve se comportar neste setor.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Arquivo do Banco (.FDB)</label>
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            accept=".fdb"
                                                            onChange={handleFDBUpload}
                                                            className="hidden"
                                                            id="fdb-upload"
                                                        />
                                                        <label
                                                            htmlFor="fdb-upload"
                                                            className={`w-full flex items-center justify-between p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all ${uploadingFdb ? 'opacity-50 pointer-events-none' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {uploadingFdb ? (
                                                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                                ) : (
                                                                    <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                                )}
                                                                <div className="text-left">
                                                                    <p className="text-xs font-bold">{selectedSistema.fdb_file_path ? 'Banco já enviado' : 'Subir banco .FDB'}</p>
                                                                    <p className="text-[10px] text-slate-500">{selectedSistema.fdb_file_path ? 'Clique para substituir' : 'Apenas arquivos vazios'}</p>
                                                                </div>
                                                            </div>
                                                            {selectedSistema.fdb_file_path && <Check className="w-4 h-4 text-emerald-500" />}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Status do Treinamento</label>
                                                    <div className="h-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                                                        <div className={`w-3 h-3 rounded-full animate-pulse ${selectedSistema.status === 'ready' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
                                                        <span className="text-xs font-black uppercase">
                                                            {selectedSistema.status === 'ready' ? 'IA Pronta para Chat' : 'Aguardando DDL (Texto)'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Conteúdo do DDL (Schema SQL)</label>
                                                    <span className="text-[10px] text-blue-400 font-black px-2 py-0.5 bg-blue-500/10 rounded uppercase">Obrigatório</span>
                                                </div>
                                                <textarea
                                                    required={!selectedSistema.has_ddl}
                                                    value={ddlContent}
                                                    onChange={e => setDdlContent(e.target.value)}
                                                    placeholder={selectedSistema.has_ddl ? "O esquema já está salvo no banco. Cole um novo aqui APENAS se quiser substituir o atual." : "Cole aqui o script SQL de criação das tabelas (CREATE TABLE...)"}
                                                    className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all text-white font-mono text-xs custom-scrollbar"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Orientações Específicas para IA</label>
                                                <textarea
                                                    value={orientacoesIa}
                                                    onChange={e => setOrientacoesIa(e.target.value)}
                                                    placeholder="Ex: Sempre utilize a tabela EST001 para buscar o saldo de produtos. Ignore tabelas de teste."
                                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-500 transition-all text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                type="submit"
                                                disabled={savingDDL}
                                                className="flex-1 p-4 rounded-2xl font-black bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all text-white flex items-center justify-center gap-2 group disabled:opacity-50"
                                            >
                                                {savingDDL ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Zap className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform" />
                                                        Salvar Treinamento e Ativar IA
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>

                                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                            <Cpu className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="text-xs text-amber-200/60 leading-relaxed">
                                            <p className="font-bold text-amber-500 mb-1 uppercase tracking-widest">Dica Profissional</p>
                                            O DDL ajuda a IA a entender os joins e tipos de campos. As orientações servem para dar contexto de negócio que não está no banco.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center gap-6 min-h-[500px]">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                                        <UploadCloud className="w-20 h-20 text-slate-700 relative z-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white">Pronto para Treinar?</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mx-auto">Selecione um dos sistemas ao lado para carregar o esquema do banco de dados e as regras da IA.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'cortex' && (
                    <AICortex />
                )}
            </main>

            {/* Modal Novo Usuário */}
            <AnimatePresence>
                {showUserModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass max-w-lg w-full p-8 rounded-[2.5rem] border-white/10 shadow-2xl space-y-6"
                        >
                            <h3 className="text-2xl font-black">Adicionar Colaborador</h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                                    <input
                                        type="text" required value={newUser.nome}
                                        onChange={e => setNewUser({ ...newUser, nome: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                                        <input
                                            type="email" required value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                                        <input
                                            type="password" required value={newUser.senha}
                                            onChange={e => setNewUser({ ...newUser, senha: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Bancada</label>
                                        <select
                                            required value={newUser.bancadaId}
                                            onChange={e => setNewUser({ ...newUser, bancadaId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none text-white cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-400">Selecione...</option>
                                            {bancadas.map(b => (
                                                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                                                    {b.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Perfil</label>
                                        <select
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none text-white cursor-pointer"
                                        >
                                            <option value="user" className="bg-slate-900 text-white">Usuário</option>
                                            <option value="admin" className="bg-slate-900 text-white">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowUserModal(false)}
                                        className="flex-1 p-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-all text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-4 rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all text-white"
                                    >
                                        Criar Conta
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Editar Usuário */}
            <AnimatePresence>
                {showEditModal && editingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass max-w-lg w-full p-8 rounded-[2.5rem] border-white/10 shadow-2xl space-y-6"
                        >
                            <h3 className="text-2xl font-black text-white">Editar Colaborador</h3>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                                    <input
                                        type="text" required value={editingUser.nome}
                                        onChange={e => setEditingUser({ ...editingUser, nome: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                                        <input
                                            type="email" required value={editingUser.email}
                                            onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Perfil</label>
                                        <select
                                            value={editingUser.role || ''}
                                            onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none text-white cursor-pointer"
                                        >
                                            <option value="user" className="bg-slate-900 text-white">Usuário</option>
                                            <option value="admin" className="bg-slate-900 text-white">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Bancada</label>
                                    <select
                                        required value={editingUser.bancada_id || ''}
                                        onChange={e => setEditingUser({ ...editingUser, bancada_id: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none text-white cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-900 text-slate-400">Selecione...</option>
                                        {bancadas.map(b => (
                                            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                                                {b.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 p-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-all text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-4 rounded-2xl font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all text-white"
                                    >
                                        Salvar Alterações
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

                 {/* Modal Aprovar Usuário */}
                 <AnimatePresence>
                 {showApproveModal && selectedPendingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass max-w-lg w-full p-8 rounded-[2.5rem] border-white/10 shadow-2xl space-y-6"
                        >
                            <h3 className="text-2xl font-black text-white">Aprovar Cadastro</h3>
                            <p className="text-sm text-slate-400">Atribua uma bancada (setor) para o novo usuário <strong>{selectedPendingUser.nome}</strong>.</p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    await api.post(`/admin/approve-user/${selectedPendingUser.id}`, { bancadaId: approveBancadaId, role: approveRole });
                                    setShowApproveModal(false);
                                    setSelectedPendingUser(null);
                                    fetchData();
                                } catch(err) {
                                    alert("Erro ao aprovar.");
                                }
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Bancada (Setor)</label>
                                    <select
                                        required value={approveBancadaId}
                                        onChange={e => setApproveBancadaId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none text-white cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-900 text-slate-400">Selecione uma bancada...</option>
                                        {bancadas.map(b => (
                                            <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                                                {b.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Perfil (Nível de Acesso)</label>
                                    <select
                                        value={approveRole}
                                        onChange={e => setApproveRole(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none text-white cursor-pointer"
                                    >
                                        <option value="user" className="bg-slate-900 text-white">Usuário Comum</option>
                                        <option value="admin" className="bg-slate-900 text-white">Administrador (Acesso Total)</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowApproveModal(false)}
                                        className="flex-1 p-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-all text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-4 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all text-white flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Aprovar e Liberar
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
                </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
