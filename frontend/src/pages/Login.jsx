import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, Mail, User, Loader2, CheckCircle2 } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            if (isLogin) {
                const response = await api.post('/login', { email, senha });
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                const response = await api.post('/register', { nome, email, senha });
                setSuccess(response.data.message || 'Cadastro enviado com sucesso! Aguarde aprovação.');
                setIsLogin(true); // volta pro login
                setSenha('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
            <div className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/5">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black gradient-text mb-2">SISSQL</h1>
                    <p className="text-slate-400">
                        {isLogin ? 'Entre para acessar seu Assistente de IA' : 'Solicite sua conta no sistema'}
                    </p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-6 text-sm text-center font-medium">{error}</div>}
                {success && <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg mb-6 text-sm text-center font-medium flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Seu nome"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="exemplo@email.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Solicitar Cadastro')}
                    </button>
                    
                    <div className="text-center mt-6">
                        <button 
                            type="button" 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setSuccess('');
                            }} 
                            className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            {isLogin ? "Não possui conta? Cadastre-se" : "Já possui conta? Faça login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
