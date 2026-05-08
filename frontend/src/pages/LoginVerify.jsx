import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { authService } from '../services/api';

export default function LoginVerify() {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyLoginOTP, isLoading } = useAuthStore();

    const { userId, email, devOTP, emailSent } = location.state || {};

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(0);
    const [resending, setResending] = useState(false);
    const inputs = useRef([]);
    const timerRef = useRef(null);

    // Auto-fill devOTP in development
    useEffect(() => {
        if (devOTP && !emailSent) {
            setOtp(String(devOTP).split(''));
            toast(`🛠️ Dev OTP auto-filled: ${devOTP}`, { duration: 5000, icon: '🔑' });
        }
    }, [devOTP]);

    // Redirect if no userId (navigated directly)
    useEffect(() => {
        if (!userId) navigate('/login', { replace: true });
    }, [userId]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timerRef.current);
    }, [countdown]);

    if (!userId) return null;

    /* ── handlers ─────────────────────────────────────────────── */
    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text.length === 6) { setOtp(text.split('')); inputs.current[5]?.focus(); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { toast.error('Enter all 6 digits'); return; }

        const result = await verifyLoginOTP({ userId, otp: code });
        if (result.success) {
            toast.success(`Welcome back, ${result.user?.name?.split(' ')[0]}! 💪`);
            navigate('/dashboard', { replace: true });
        } else {
            toast.error(result.error || 'Invalid OTP');
            setOtp(['', '', '', '', '', '']);
            inputs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;
        setResending(true);
        try {
            const res = await authService.resendOTP({ email });
            const d = res.data;
            if (d.devOTP) {
                setOtp(String(d.devOTP).split(''));
                toast(`🛠️ New dev OTP: ${d.devOTP}`, { duration: 6000 });
            } else {
                toast.success('New OTP sent to your email!');
            }
            setCountdown(60);
        } catch {
            toast.error('Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    const filled = otp.filter(Boolean).length;

    return (
        <div style={{ textAlign: 'center' }}>
            {/* Icon */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                style={{ fontSize: '3.2rem', marginBottom: 14 }}>
                🔐
            </motion.div>

            <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Verify Your Login</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.88rem' }}>
                {emailSent !== false
                    ? <>We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></>
                    : <>Email not configured — use the dev OTP below</>}
            </p>

            {/* Dev OTP banner */}
            {devOTP && !emailSent && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(255,214,10,0.07)', border: '1px solid rgba(255,214,10,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 22, textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span>🛠️</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-yellow)', fontSize: '0.82rem' }}>Dev Mode — Email Not Configured</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your OTP:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-yellow)', letterSpacing: '0.15em' }}>{devOTP}</span>
                        <button onClick={() => { navigator.clipboard.writeText(String(devOTP)); toast.success('Copied!'); }}
                            style={{ background: 'rgba(255,214,10,0.12)', border: '1px solid rgba(255,214,10,0.3)', borderRadius: 6, padding: '3px 10px', color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.74rem' }}>
                            Copy
                        </button>
                    </div>
                </motion.div>
            )}

            {/* OTP Inputs */}
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                        <motion.input key={i}
                            ref={el => inputs.current[i] = el}
                            value={digit}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            maxLength={1} inputMode="numeric"
                            whileFocus={{ scale: 1.08 }}
                            style={{
                                width: 50, height: 56, textAlign: 'center',
                                fontSize: '1.5rem', fontWeight: 800,
                                background: 'var(--bg-overlay)',
                                color: 'var(--text-primary)',
                                border: `2px solid ${digit ? 'var(--brand)' : 'var(--border)'}`,
                                borderRadius: 12, outline: 'none', transition: 'border-color 0.2s',
                            }}
                        />
                    ))}
                </div>

                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i < filled ? 'var(--brand)' : 'var(--bg-hover)', transition: 'background 0.2s' }} />
                    ))}
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full"
                    disabled={isLoading || filled < 6}
                    style={{ opacity: filled < 6 ? 0.6 : 1 }}>
                    {isLoading
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                            Verifying...
                        </span>
                        : '🔓 Verify & Login'
                    }
                </button>
            </form>

            {/* Resend */}
            <p style={{ marginTop: 18, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Didn't receive it?{' '}
                <button onClick={handleResend} disabled={resending || countdown > 0}
                    style={{ background: 'none', border: 'none', color: countdown > 0 ? 'var(--text-muted)' : 'var(--brand)', fontWeight: 600, cursor: countdown > 0 ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}>
                    {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
            </p>

            {/* Back to login */}
            <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <button onClick={() => navigate('/login')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                    ← Back to Login
                </button>
            </p>
        </div>
    );
}