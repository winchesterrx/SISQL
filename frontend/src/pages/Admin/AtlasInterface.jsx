import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Shield, Activity, ChevronLeft, Zap, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import NeuralSphere from './NeuralSphere';

const AtlasInterface = () => {
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const sourceRef = useRef(null);
    const streamRef = useRef(null);

    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [stats, setStats] = useState({ amplitude: 0, bass: 0, treble: 0 });
    const [activationPulse, setActivationPulse] = useState(0);

    const isThinkingRef = useRef(false);
    const statsRef = useRef({ amplitude: 0, bass: 0, treble: 0 });
    const pulseRef = useRef(0);
    const transitionProgressRef = useRef(0);
    const targetProgressRef = useRef(0);
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const autoRestartRef = useRef(false); // Flag para Conversa Contínua
    const isListeningRef = useRef(false);
    const chatHistoryRef = useRef([]);
    const [transcript, setTranscript] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [awakeningVal, setAwakeningVal] = useState(0);

    // Configurar Reconhecimento de Voz
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
                setStatusText('ATLAS_CAPTURING (HEARING...)');

                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                    handleSpeechEnd(currentTranscript);
                }, 1800);
            };

            recognition.onend = () => {
                if (isListeningRef.current) {
                    try { recognition.start(); } catch (e) { }
                }
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const handleSpeechEnd = async (text) => {
        if (!text || text.trim().length < 2) return;

        console.log("Processando fala:", text);
        setIsThinking(true);
        isThinkingRef.current = true;
        setStatusText('IA_REFLECTING (THINKING...)');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/atlas/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: text,
                    history: chatHistoryRef.current
                })
            });

            const data = await response.json();

            if (data.success && data.reply) {
                console.log("[ATLAS] Resposta da AI recebida com sucesso:");
                console.log(`%c[RESPOSTA] ${data.reply}`, 'color: #00ffff; font-weight: bold; font-size: 14px;');

                // Atualizar histórico
                const newHistory = [...chatHistoryRef.current,
                { role: 'user', content: text },
                { role: 'assistant', content: data.reply }
                ];
                setChatHistory(newHistory);
                chatHistoryRef.current = newHistory;

                // Voz ATLAS (TTS)
                speakAtlas(data.reply);
            } else {
                console.error("[ATLAS] Resposta inválida do backend:", data.error || "Erro desconhecido");
                setStatusText('SYS_ERROR (CHECK_LOGS)');
                setTimeout(() => setStatusText('CORE_STANDBY'), 3000);
            }
        } catch (err) {
            console.error("Erro na ATLAS AI:", err);
        } finally {
            setIsThinking(false);
            isThinkingRef.current = false;
            setTranscript('');
            // Se não estiver falando, volta para Standby
            if (pulseRef.current === 0) setStatusText('CORE_STANDBY');
        }
    };

    const [statusText, setStatusText] = useState('Core Standby');

    const playSfx = (type) => {
        try {
            const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'start') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            }
        } catch (e) { console.warn("Audio SFX err:", e); }
    };

    // Fallback nativo: apenas se a OpenAI falhar ou ficar sem créditos
    const fallbackSpeakAtlas = (text) => {
        return new Promise((resolve) => {
            const SpeechSynthesis = window.speechSynthesis;
            SpeechSynthesis.cancel();

            // Remove emojis e caracteres markdown para evitar sons bizarros
            const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/[*_~#]/g, '').trim();

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.05;
            utterance.pitch = 1.1;

            const voices = SpeechSynthesis.getVoices();
            let bestVoice = voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Francisca') || v.name.includes('Online')));
            if (!bestVoice) bestVoice = voices.find(v => v.lang.includes('pt-BR'));
            if (bestVoice) utterance.voice = bestVoice;

            utterance.onstart = () => {
                console.log("[ATLAS] Voz Local (Fallback de Segurança) ativada...");
                pulseRef.current = 1;
                setStatusText('ATLAS_RESONATING (SPEAKING)');
            };

            utterance.onend = () => {
                pulseRef.current = 0;
                setStatusText('NEURAL_IDLE (COOLDOWN)');
                setTimeout(() => {
                    if (!isListeningRef.current) setStatusText('CORE_STANDBY');

                    // Auto-retomar a escuta para criar um loop de conversa contínua
                    if (autoRestartRef.current) {
                        startAudio();
                    }
                }, 1000);
                resolve();
            };

            utterance.onerror = (e) => {
                pulseRef.current = 0;
                setTimeout(() => {
                    if (autoRestartRef.current) startAudio();
                }, 1000);
                resolve();
            }

            SpeechSynthesis.speak(utterance);
        });
    };

    const speakAtlas = async (text) => {
        try {
            setStatusText('ATLAS_RESONATING (GENERATING PREMIUM VOICE...)');
            const token = localStorage.getItem('token');

            // Tenta usar a API de Inteligência Artificial para voz Ultra-Realista (OpenAI Nova)
            const response = await fetch('http://localhost:3001/api/atlas/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                console.warn("[ATLAS TTS] Áudio premium indisponível. Acionando Fallback Local.");
                await fallbackSpeakAtlas(text);
                return;
            }

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);

            return new Promise((resolve) => {
                audio.onplay = () => {
                    console.log("[ATLAS] Voz Premium Orgânica iniciada.");
                    pulseRef.current = 1;
                    setStatusText('ATLAS_RESONATING (SPEAKING)');
                };

                audio.onended = () => {
                    pulseRef.current = 0;
                    setStatusText('NEURAL_IDLE (COOLDOWN)');
                    setTimeout(() => {
                        if (!isListeningRef.current) setStatusText('CORE_STANDBY');
                        if (autoRestartRef.current) {
                            startAudio(); // Looping conversation
                        }
                    }, 1000);
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };

                audio.onerror = async () => {
                    pulseRef.current = 0;
                    await fallbackSpeakAtlas(text);
                    resolve();
                };

                audio.play().catch(async (e) => {
                    pulseRef.current = 0;
                    await fallbackSpeakAtlas(text);
                    resolve();
                });
            });

        } catch (err) {
            console.error("[ATLAS TTS] Erro catastrófico na geração. Acionando Fallback.", err);
            await fallbackSpeakAtlas(text);
        }
    };

    const startAudio = async () => {
        try {
            autoRestartRef.current = true; // Habilita o loop contínuo ao clicar Iniciar
            isListeningRef.current = true;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();

            audioContextRef.current = audioContext;
            playSfx('start'); // Efeito Sonoro ao Iniciar Microfone

            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 512;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;
            streamRef.current = stream;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

            setIsListening(true);
            targetProgressRef.current = 1;

            if (recognitionRef.current) recognitionRef.current.start();
        } catch (err) {
            console.error("Erro no áudio:", err);
        }
    };

    const stopAudio = () => {
        autoRestartRef.current = false; // Desativa o loop contínuo ao clicar Parar
        isListeningRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        if (recognitionRef.current) recognitionRef.current.stop();

        targetProgressRef.current = 0;
        setIsListening(false);
        isThinkingRef.current = false;
        setIsThinking(false);
        setTranscript('');
        statsRef.current = { amplitude: 0, bass: 0, treble: 0 };
        setStats({ amplitude: 0, bass: 0, treble: 0 });
    };

    useEffect(() => {
        let animationFrame;
        let lastStateUpdate = 0;

        const animate = () => {
            const sRef = statsRef.current;

            const now = Date.now();
            // 1. Audio Data Mapping
            if (pulseRef.current > 0) {
                // ATLAS Speaking (TTS Pulse)
                const talkPulse = Math.sin(now * 0.015) * 0.3 + 0.5;
                sRef.amplitude = talkPulse;
            } else if (isListening && analyserRef.current) {
                // User Speaking (Mic Pulse)
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                let g = 0;
                for (let i = 0; i < dataArrayRef.current.length; i++) {
                    g += dataArrayRef.current[i] / 255;
                }
                g /= dataArrayRef.current.length;
                sRef.amplitude = g;
            } else if (isThinkingRef.current) {
                // Quando estiver pensando, a esfera fica processando rápido
                sRef.amplitude = Math.abs(Math.sin(now * 0.008)) * 0.6 + 0.2;
            } else {
                // Idle / Sleeping
                sRef.amplitude = 0;
            }

            // Throttle HUD state updates (15fps) para não travar o React
            if (now - lastStateUpdate > 66) {
                setStats({ ...sRef });
                lastStateUpdate = now;
            }

            const targetP = targetProgressRef.current;
            let currentP = transitionProgressRef.current;
            const wakeSpeed = 0.005;
            const sleepSpeed = 0.008;

            if (currentP < targetP) {
                currentP = Math.min(targetP, currentP + wakeSpeed);
                if (statusText === 'CORE_STANDBY') setStatusText('NEURAL_WAKEUP (INIT...)');
            } else if (currentP > targetP) {
                currentP = Math.max(targetP, currentP - sleepSpeed);
                if (statusText !== 'CORE_STANDBY' && !isThinking && !isListening) {
                    setStatusText('CORE_SLEEP (SHUTDOWN)');
                    if (currentP < 0.01) setStatusText('CORE_STANDBY');
                }
            }
            transitionProgressRef.current = currentP;
            setAwakeningVal(Math.max(0, Math.min(1, currentP)));

            animationFrame = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [isListening]);

    return (
        <div className="fixed inset-0 bg-[#000000] overflow-hidden select-none font-mono">
            {/* Header HUD */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-50 pointer-events-none">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <Link to="/admin" className="flex items-center gap-2 text-cyan-500/50 hover:text-cyan-400 transition-colors uppercase text-[10px] font-black tracking-[0.3em] mb-4">
                        <ChevronLeft size={14} /> Back to Nexus
                    </Link>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl font-black text-white tracking-[0.5em] uppercase"
                    >
                        ATLAS
                        <span className="text-cyan-500 text-xs align-top ml-2">CORE_V2</span>
                    </motion.h1>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_#00ffff] ${isListening ? 'animate-ping' : ''}`} />
                        <span className="text-[10px] text-cyan-500/80 font-black uppercase tracking-widest">
                            {statusText}
                        </span>
                    </div>

                    <AnimatePresence>
                        {transcript && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="mt-8 p-3 border-l-2 border-cyan-500/30 bg-cyan-500/5 max-w-sm backdrop-blur-md"
                            >
                                <p className="text-[10px] text-cyan-400 font-mono leading-relaxed">
                                    <span className="opacity-50 mr-2 text-[8px] tracking-[0.3em] font-black uppercase">Stream:</span>
                                    {transcript}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="text-right pointer-events-auto flex items-start gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="text-right border-r-2 border-cyan-500/20 pr-4">
                            <p className="text-[9px] text-slate-500 uppercase font-black">Sync Level</p>
                            <p className="text-xl text-cyan-400 font-black">{(stats.amplitude * 100).toFixed(0)}%</p>
                            <div className="w-16 h-1 bg-white/5 mt-1 ml-auto overflow-hidden">
                                <div className="h-full bg-cyan-500 transition-all duration-75" style={{ width: `${stats.amplitude * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-[10px] text-cyan-500/50 font-black uppercase tracking-widest mb-2">Spectral Analysis</div>
                        <div className="flex gap-4">
                            <div className="text-right">
                                <p className="text-[9px] text-slate-500 uppercase">Bass</p>
                                <p className="text-xs text-white font-black">{(stats.bass * 100).toFixed(1)}%</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-slate-500 uppercase">Highs</p>
                                <p className="text-xs text-white font-black">{(stats.treble * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                    <NeuralSphere
                        stats={stats}
                        isListening={isListening}
                        isThinking={isThinking}
                        awakening={awakeningVal}
                    />
                </Canvas>
            </div>

            {/* Visual Equalizer Bar (Bottom HUD) */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8 opacity-50 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-1 bg-cyan-500/40 rounded-full transition-all duration-75"
                        style={{ height: `${Math.random() * stats.amplitude * 100 + 10}%` }}
                    />
                ))}
            </div>

            {/* Controls */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-50">
                <button
                    onClick={() => {
                        if (isListening) stopAudio();
                        else startAudio();
                    }}
                    className={`group relative p-6 rounded-full border transition-all duration-700 ${isListening
                        ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_50px_rgba(0,255,255,0.4)]'
                        : 'bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 shadow-none'
                        }`}
                >
                    <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-cyan-500 group-hover:block hidden" />
                    {isListening ? (
                        <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
                    ) : (
                        <Cpu className="w-6 h-6 text-slate-500 group-hover:text-cyan-500 transition-colors" />
                    )}

                    {/* Ring Indicator */}
                    <svg className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] rotate-[-90deg]">
                        <circle
                            cx="50%" cy="50%" r="48%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="300"
                            strokeDashoffset={300 - (stats.amplitude * 300)}
                            className={`text-cyan-500 transition-all duration-75 ${isListening ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </svg>
                </button>
                <div className="flex flex-col items-center gap-1">
                    <p className={`text-[10px] font-black uppercase tracking-[0.6em] transition-colors duration-500 ${isListening ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {statusText}
                    </p>
                    <div className="flex gap-2">
                        <span className="w-8 h-0.5 bg-cyan-500/20 overflow-hidden">
                            <motion.div animate={{ x: isListening ? [0, 32] : 0 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-full bg-cyan-500" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Calibration Info (Side HUD) */}
            <div className="absolute bottom-12 left-12 text-[9px] text-cyan-500/30 flex flex-col gap-2 pointer-events-none">
                <p>REF_ID: 01091496</p>
                <p>MODEL: ATLAS_CORE_GEN_2</p>
                <p>SYNC: FFT_REALTIME_ENABLED</p>
            </div>

            {/* Corner Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-cyan-500/10 pointer-events-none m-8" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-cyan-500/10 pointer-events-none m-8" />
        </div>
    );
};

export default AtlasInterface;
