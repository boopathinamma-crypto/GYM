import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, { password: form.password });
      setDone(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired reset link');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Set New Password</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>Choose a strong password for your account.</p>

      {!done ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 chars, A-z, 0-9" />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input type="password" className="input" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat password" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
          <p style={{ color: 'var(--accent-green)' }}>Password reset! Redirecting to login...</p>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <Link to="/login" style={{ color: 'var(--brand)' }}>← Back to Login</Link>
      </p>
    </div>
  );
}
