import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../context/authStore';
import api from '../../services/api';

/* ── Call Grok AI via backend ────────────────────────────── */
async function callAI(message, history) {
    const res = await api.post('/ai/chat', {
        message,
        chatHistory: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    });
    const d = res.data?.data;
    if (!d?.reply) throw new Error('Empty response from server');
    return { reply: d.reply, poweredBy: d.poweredBy || 'grok' };
}

const QUICK = [
    '🏋️ Best chest exercises?',
    '🥗 High protein meal ideas',
    '🔥 How to lose belly fat?',
    '💪 Build muscle fast',
    '😴 Recovery after workout',
    '💊 Best supplements?',
];

/* ── Typing dots ─────────────────────────────────────────── */
function Dots() {
    return (
        <div style={{ display: 'flex', gap: 5, padding: '2px 0' }}>
            {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.65)', animation: `aidot 1.2s ${d}s ease-in-out infinite` }} />
            ))}
        </div>
    );
}

/* ── Message bubble ──────────────────────────────────────── */
function Bubble({ msg }) {
    const ai = msg.role === 'assistant';
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', justifyContent: ai ? 'flex-start' : 'flex-end', marginBottom: 10, gap: 8, alignItems: 'flex-end' }}
        >
            {ai && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                    🤖
                </div>
            )}
            <div style={{
                maxWidth: '82%', padding: '10px 14px', wordBreak: 'break-word',
                borderRadius: ai ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                background: ai
                    ? 'rgba(255,255,255,0.09)'
                    : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                border: ai ? '1px solid rgba(255,255,255,0.1)' : 'none',
                color: '#fff', fontSize: '0.85rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
            }}>
                {msg.content}
            </div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════ */
export default function AIAssistant() {
    const { user, isAuthenticated } = useAuthStore();
    const firstName = user?.name?.split(' ')[0] || 'there';

    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [pulse, setPulse] = useState(true);
    const [msgs, setMsgs] = useState([{
        role: 'assistant',
        content: `Hey ${firstName}! 🤖 I'm your GymPro AI Coach powered by **Grok**.\n\nAsk me anything about workouts, nutrition, fat loss, or muscle building!`,
    }]);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => { const t = setTimeout(() => setPulse(false), 6000); return () => clearTimeout(t); }, []);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);

    const send = useCallback(async (text) => {
        const msg = (text ?? input).trim();
        if (!msg || busy) return;
        setInput('');

        const history = [...msgs, { role: 'user', content: msg }];
        setMsgs(history);
        setBusy(true);

        try {
            const { reply, poweredBy } = await callAI(msg, history);
            setMsgs(p => [...p, { role: 'assistant', content: reply }]);
        } catch (err) {
            const code = err?.response?.status;
            const srv = err?.response?.data?.message;
            let friendly = '';
            if (code === 401 || code === 403) {
                friendly = '🔐 Session expired. Please log out and log in again.';
            } else if (code === 404) {
                friendly = '⚠️ AI route not found.\n\nMake sure:\n1. You replaced aiRoutes.js\n2. Restarted backend (npm run dev)';
            } else if (code === 500) {
                friendly = `🔴 Server error: ${srv || err.message}`;
            } else if (!code) {
                friendly = '📡 Cannot reach backend. Is it running on port 5000?';
            } else {
                friendly = `Error ${code}: ${srv || err.message}`;
            }
            setMsgs(p => [...p, { role: 'assistant', content: friendly }]);
        } finally {
            setBusy(false);
        }
    }, [input, busy, msgs]);

    const clear = () => setMsgs([{ role: 'assistant', content: `Chat cleared! How can I help you today? 💪` }]);

    if (!isAuthenticated) return null;

    return (
        <>
            <style>{`
        @keyframes aidot{0%,80%,100%{transform:scale(.55);opacity:.35}40%{transform:scale(1);opacity:1}}
        @keyframes aipulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.65)}60%{box-shadow:0 0 0 16px rgba(124,58,237,0)}}
        .ai-list::-webkit-scrollbar{width:3px}
        .ai-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}
        .ai-ta::placeholder{color:rgba(255,255,255,.3)}
        .ai-ta:focus{border-color:rgba(124,58,237,.6)!important;outline:none}
        .ai-qk:hover{background:rgba(124,58,237,.25)!important;border-color:rgba(124,58,237,.5)!important;color:#fff!important}
      `}</style>

            {/* ── Chat Panel ──────────────────────────────────────── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 24 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                        style={{
                            position: 'fixed', bottom: 92, right: 24,
                            width: 364, height: 560,
                            background: 'linear-gradient(160deg,#0d0d1a,#111128)',
                            border: '1px solid rgba(124,58,237,.3)',
                            borderRadius: 22, display: 'flex', flexDirection: 'column',
                            zIndex: 9998, overflow: 'hidden',
                            boxShadow: '0 28px 90px rgba(0,0,0,.75), 0 0 0 1px rgba(124,58,237,.12)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>
                                    🤖
                                </div>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.92rem', lineHeight: 1 }}>
                                        GymPro AI Coach
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#57cc99' }} />
                                        <span style={{ color: 'rgba(255,255,255,.85)', fontSize: '0.68rem', fontWeight: 600 }}>
                                            Powered by Grok · xAI
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={clear} title="Clear chat"
                                    style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                    🗑
                                </button>
                                <button onClick={() => setOpen(false)}
                                    style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="ai-list" style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 6px' }}>
                            {msgs.map((m, i) => <Bubble key={i} msg={m} />)}
                            {busy && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>🤖</div>
                                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '16px 16px 16px 4px' }}>
                                        <Dots />
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick prompts */}
                        {msgs.length <= 1 && (
                            <div style={{ padding: '4px 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {QUICK.map(q => (
                                    <button key={q} className="ai-qk" onClick={() => send(q)}
                                        style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 100, padding: '5px 10px', color: 'rgba(255,255,255,.75)', fontSize: '0.68rem', cursor: 'pointer', transition: 'all .18s', whiteSpace: 'nowrap' }}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                            <textarea
                                ref={inputRef}
                                className="ai-ta"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                placeholder="Ask about workouts, nutrition, recovery…"
                                rows={1}
                                style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '10px 14px', color: '#fff', fontSize: '0.85rem', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100, transition: 'border-color .2s' }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                                onClick={() => send()}
                                disabled={!input.trim() || busy}
                                style={{
                                    width: 42, height: 42, borderRadius: '50%', border: 'none',
                                    background: input.trim() && !busy ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,.08)',
                                    color: '#fff', cursor: input.trim() && !busy ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', flexShrink: 0, transition: 'all .2s',
                                    boxShadow: input.trim() && !busy ? '0 4px 16px rgba(124,58,237,.45)' : 'none',
                                }}
                            >
                                {busy
                                    ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                                    : '➤'
                                }
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Tooltip ──────────────────────────────────────────── */}
            <AnimatePresence>
                {!open && pulse && (
                    <motion.div
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                        style={{ position: 'fixed', bottom: 38, right: 96, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', borderRadius: 12, padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, zIndex: 9997, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(124,58,237,.5)' }}
                    >
                        🤖 Ask Grok AI Coach!
                        <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid #4f46e5' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB ──────────────────────────────────────────────── */}
            <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                onClick={() => { setOpen(p => !p); setPulse(false); }}
                style={{
                    position: 'fixed', bottom: 24, right: 24,
                    width: 58, height: 58, borderRadius: '50%', border: 'none',
                    background: open ? 'linear-gradient(135deg,#444,#666)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    color: '#fff', cursor: 'pointer', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: open ? '1.6rem' : '1.45rem',
                    boxShadow: open ? '0 8px 30px rgba(0,0,0,.4)' : '0 8px 30px rgba(124,58,237,.6)',
                    animation: pulse && !open ? 'aipulse 2s ease-in-out infinite' : 'none',
                    transition: 'background .3s, box-shadow .3s',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.span key={open ? 'x' : 'b'}
                        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.18 }}
                    >
                        {open ? '×' : '🤖'}
                    </motion.span>
                </AnimatePresence>
            </motion.button>
        </>
    );
}