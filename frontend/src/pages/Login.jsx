import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import GoogleButton from '../components/common/GoogleButton';

export default function Login() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  // Show error if Google OAuth failed
  const oauthError = searchParams.get('error');
  const oauthMessages = {
    google_failed: '❌ Google sign-in failed. Please try again.',
    access_denied: 'ℹ️ You cancelled the Google sign-in.',
    server_error: '❌ Server error during sign-in. Please try again.',
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await login(form);
    if (result.success) {
      // Admin logs in directly
      if (!result.requiresOTP) {
        toast.success(`Welcome back, ${result.user.name}! 💪`);
        navigate('/dashboard', { replace: true });
        return;
      }
      // Member / Trainer → go to OTP verification
      navigate('/login/verify', {
        state: {
          userId: result.userId,
          email: result.email,
          emailSent: result.emailSent,
          devOTP: result.devOTP || null,
        },
      });
    } else {
      if (result.error?.includes('verify your email')) {
        toast.error(result.error, { duration: 6000 });
      } else {
        toast.error(result.error || 'Login failed');
      }
    }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Sign In</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
        Welcome back! Sign in to continue your fitness journey.
      </p>

      {/* ── OAuth Error Banner ─────────────────────────────────────────── */}
      {oauthError && oauthMessages[oauthError] && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            fontSize: '0.85rem', color: 'var(--brand)',
          }}
        >
          {oauthMessages[oauthError]}
        </motion.div>
      )}

      {/* ── Google Button ────────────────────────────────────────────────── */}
      <GoogleButton label="Continue with Google" />

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        margin: '20px 0',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
          or sign in with email
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* ── Email Form ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            name="email" type="email" className="input"
            placeholder="you@example.com" value={form.email}
            onChange={handleChange} autoComplete="email"
          />
          {errors.email && <span className="input-error">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              name="password" type={showPass ? 'text' : 'password'} className="input"
              placeholder="••••••••" value={form.password}
              onChange={handleChange} autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button" onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1rem',
              }}
            >{showPass ? '🙈' : '👁️'}</button>
          </div>
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        <div style={{ textAlign: 'right', marginTop: -10 }}>
          <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--brand)' }}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading}>
          {isLoading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Signing in...
            </span>
            : 'Sign In'
          }
        </button>
      </form>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create one</Link>
      </p>

      {/* Demo credentials box */}
      <div style={{
        marginTop: 24, padding: 16,
        background: 'var(--bg-overlay)', borderRadius: 10,
        border: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
          🧪 Demo credentials:
        </p>
        {[['🛡️ Admin', 'admin@gympro.com', 'Admin@123'],
        ['👤 Trainer', 'trainer1@gympro.com', 'Trainer@123'],
        ['🏋️ Member', 'member1@gympro.com', 'Member@123']].map(([role, email, pass]) => (
          <button
            key={role}
            onClick={() => setForm({ email, password: pass })}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              fontSize: '0.78rem', color: 'var(--accent-blue)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 0',
            }}
          >
            {role}: {email} / {pass}
          </button>
        ))}
      </div>
    </div>
  );
}