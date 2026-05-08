// ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      toast.success('Reset link sent if that email exists');
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Reset Password</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
        {sent ? 'Check your email for the password reset link.' : "Enter your email and we'll send a reset link."}
      </p>

      {!sent ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📬</div>
          <p style={{ color: 'var(--text-muted)' }}>Reset link sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></p>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Remember it? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
