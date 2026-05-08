import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { authService } from '../services/api';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, isLoading } = useAuthStore();

  // These come from Register page via navigate('/verify-email', { state: { ... } })
  const { userId, email, devOTP, emailSent } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef([]);
  const timerRef = useRef(null);

  // Auto-fill devOTP in development mode
  useEffect(() => {
    if (devOTP && !emailSent) {
      const digits = String(devOTP).split('');
      setOtp(digits);
      toast(`📋 Dev OTP auto-filled: ${devOTP}`, { duration: 6000, icon: '🛠️' });
    }
  }, [devOTP]);

  // Redirect if no userId (user navigated directly without registering)
  useEffect(() => {
    if (!userId) navigate('/register', { replace: true });
  }, [userId]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  if (!userId) return null;

  /* ── Handlers ─────────────────────────────────────────────────────── */
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
    if (text.length === 6) {
      setOtp(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter all 6 digits');
      inputs.current[0]?.focus();
      return;
    }
    const result = await verifyEmail({ userId, otp: code });
    if (result.success) {
      toast.success('🎉 Email verified! Welcome to GymPro!');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.error || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setResending(true);
    try {
      const res = await authService.resendOTP({ email });
      const data = res.data;

      if (data.data?.devOTP) {
        // Dev mode: auto-fill the new OTP
        const digits = String(data.data.devOTP).split('');
        setOtp(digits);
        toast(`🛠️ New dev OTP: ${data.data.devOTP}`, { duration: 8000 });
      } else {
        toast.success('New OTP sent to your email!');
      }
      setCountdown(60); // 60s cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const filledCount = otp.filter(Boolean).length;

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ fontSize: '3.5rem', marginBottom: 16 }}
      >
        📧
      </motion.div>

      <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Verify Your Email</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.9rem' }}>
        {emailSent !== false
          ? <>We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></>
          : <>Email sending is <strong style={{ color: 'var(--accent-yellow)' }}>not configured</strong> — use the dev OTP below</>
        }
      </p>

      {/* ── Dev Mode Banner ─────────────────────────────────────────── */}
      {devOTP && !emailSent && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,214,10,0.08)',
            border: '1px solid rgba(255,214,10,0.35)',
            borderRadius: 12, padding: '14px 18px',
            marginBottom: 24, textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: '1.1rem' }}>🛠️</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-yellow)', fontSize: '0.85rem' }}>
              Development Mode — Email Not Configured
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Your OTP has been auto-filled below. To enable real email, configure
            <code style={{ background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 4, margin: '0 4px', fontSize: '0.78rem' }}>
              EMAIL_USER
            </code> and
            <code style={{ background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 4, margin: '0 4px', fontSize: '0.78rem' }}>
              EMAIL_PASS
            </code>
            in your <code style={{ background: 'var(--bg-overlay)', padding: '1px 6px', borderRadius: 4, fontSize: '0.78rem' }}>backend/.env</code>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your OTP:</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 800,
              color: 'var(--accent-yellow)', letterSpacing: '0.15em',
            }}>{devOTP}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(String(devOTP)); toast.success('Copied!'); }}
              style={{ background: 'rgba(255,214,10,0.15)', border: '1px solid rgba(255,214,10,0.3)', borderRadius: 6, padding: '3px 10px', color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Copy
            </button>
          </div>
        </motion.div>
      )}

      {/* ── OTP Input ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 8 }}>
        <div
          style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}
          onPaste={handlePaste}
        >
          {otp.map((digit, i) => (
            <motion.input
              key={i}
              ref={el => inputs.current[i] = el}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              autoComplete="one-time-code"
              whileFocus={{ scale: 1.08 }}
              style={{
                width: 52, height: 58, textAlign: 'center',
                fontSize: '1.6rem', fontWeight: 800,
                background: 'var(--bg-overlay)',
                color: 'var(--text-primary)',
                border: `2px solid ${digit ? 'var(--brand)' : 'var(--border)'}`,
                borderRadius: 12, outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i < filledCount ? 'var(--brand)' : 'var(--bg-hover)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={isLoading || filledCount < 6}
          style={{ opacity: filledCount < 6 ? 0.6 : 1 }}
        >
          {isLoading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Verifying...
            </span>
            : 'Verify Email →'
          }
        </button>
      </form>

      {/* Resend */}
      <p style={{ marginTop: 20, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
        Didn't receive the code?{' '}
        <button
          onClick={handleResend}
          disabled={resending || countdown > 0}
          style={{
            background: 'none', border: 'none',
            color: countdown > 0 ? 'var(--text-muted)' : 'var(--brand)',
            fontWeight: 600, cursor: countdown > 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.88rem',
          }}
        >
          {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
        </button>
      </p>

      {/* Back to register */}
      <p style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Wrong email?{' '}
        <button
          onClick={() => navigate('/register')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
        >
          Go back
        </button>
      </p>
    </div>
  );
}
