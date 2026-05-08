import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import GoogleButton from '../components/common/GoogleButton';

export default function Register() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'member' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email address is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must include uppercase, lowercase, and number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await registerUser({
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      password: form.password,
      role: form.role,
    });

    if (result.success) {
      const { userId, email, devOTP, emailSent } = result.data;

      if (emailSent) {
        toast.success('Account created! Check your email for the OTP.');
      } else if (devOTP) {
        toast(`🛠️ Dev mode: OTP is ${devOTP}`, { duration: 8000, icon: '📋' });
      } else {
        toast.success('Account created! Proceed to verify your email.');
      }

      // Pass devOTP and emailSent to VerifyEmail so it can display them
      navigate('/verify-email', {
        state: { userId, email, devOTP: devOTP || null, emailSent: emailSent !== false },
      });
    }
    // errors are shown by the Axios interceptor toast
  };

  const strength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthColors = ['', '#e63946', '#ff6b35', '#ffd60a', '#57cc99'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const s = strength();

  return (
    <div>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Create Account</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
        Join thousands of members transforming their fitness.
      </p>

      {/* ── Google Button ─────────────────────────────────────────────── */}
      <GoogleButton label="Sign up with Google" />

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        margin: '20px 0',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>or register with email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input name="name" className="input" placeholder="Arjun Mehta" value={form.name} onChange={handleChange} autoComplete="name" />
          {errors.name && <span className="input-error">{errors.name}</span>}
        </div>

        {/* Email */}
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
          {errors.email && <span className="input-error">{errors.email}</span>}
        </div>

        {/* Role */}
        <div className="input-group">
          <label className="input-label">I am a...</label>
          <select name="role" className="input" value={form.role} onChange={handleChange} style={{ background: 'var(--bg-overlay)' }}>
            <option value="member">Member — I want to train</option>
            <option value="trainer">Trainer — I want to coach</option>
          </select>
        </div>

        {/* Password */}
        <div className="input-group">
          <label className="input-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input name="password" type={showPass ? 'text' : 'password'} className="input" placeholder="Min 8 chars, A-Z, 0-9" value={form.password} onChange={handleChange} autoComplete="new-password" style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {/* Strength bar */}
          {form.password && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= s ? strengthColors[s] : 'var(--bg-hover)', transition: 'background 0.3s' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', color: strengthColors[s] }}>{strengthLabels[s]}</span>
            </div>
          )}
          {errors.password && <span className="input-error">{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <input name="confirmPassword" type="password" className="input" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
          {errors.confirmPassword && <span className="input-error">{errors.confirmPassword}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading} style={{ marginTop: 4 }}>
          {isLoading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Creating account...
            </span>
            : 'Create Account →'
          }
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
