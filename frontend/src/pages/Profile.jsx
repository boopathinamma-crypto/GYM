// Profile.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '../services/api';
import useAuthStore from '../context/authStore';

const FITNESS_GOALS = ['weight_loss','muscle_gain','endurance','flexibility','general_fitness'];
const FITNESS_LEVELS = ['beginner','intermediate','advanced'];
const ACTIVITY_LEVELS = ['sedentary','lightly_active','moderately_active','very_active','super_active'];
const GENDERS = ['male','female','other'];

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    profile: {
      age: user?.profile?.age || '',
      gender: user?.profile?.gender || 'male',
      height: user?.profile?.height || '',
      weight: user?.profile?.weight || '',
      fitnessGoal: user?.profile?.fitnessGoal || 'general_fitness',
      fitnessLevel: user?.profile?.fitnessLevel || 'beginner',
      activityLevel: user?.profile?.activityLevel || 'moderately_active',
      phone: user?.profile?.phone || '',
    },
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const updateProfile = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      toast.success('Profile updated!');
      setEditing(false);
      qc.invalidateQueries(['profile']);
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: (formData) => userService.uploadAvatar(formData),
    onSuccess: (res) => { updateUser({ avatar: res.data.data.avatar }); toast.success('Avatar updated!'); setAvatarFile(null); setAvatarPreview(null); },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = () => {
    if (!avatarFile) return;
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    uploadAvatar.mutate(fd);
  };

  const handleSave = () => {
    updateProfile.mutate(form);
  };

  const bmi = user?.profile?.bmi;
  const bmiColor = bmi < 18.5 ? '#4cc9f0' : bmi < 25 ? '#57cc99' : bmi < 30 ? '#ffd60a' : '#e63946';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--text-primary)' }}>My Profile 👤</h1>
        <button className={`btn ${editing ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* Avatar + name card */}
      <div className="card" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, overflow: 'hidden', border: '3px solid var(--border)' }}>
            {(avatarPreview || user?.avatar?.url)
              ? <img src={avatarPreview || user.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user?.name?.[0]?.toUpperCase()}
          </div>
          <label style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: 'var(--brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem' }}>
            📷 <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${user?.role === 'admin' ? 'red' : user?.role === 'trainer' ? 'blue' : 'green'}`}>{user?.role}</span>
            {user?.isEmailVerified && <span className="badge badge-green">✓ Verified</span>}
            {bmi && <span style={{ fontSize: '0.82rem', color: bmiColor, fontWeight: 600 }}>BMI: {bmi}</span>}
          </div>
        </div>
        {avatarPreview && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleAvatarUpload} disabled={uploadAvatar.isPending}>
              {uploadAvatar.isPending ? 'Uploading...' : 'Save Photo'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          ['🔥', 'Current Streak', `${user?.streaks?.current || 0} days`],
          ['⚡', 'Best Streak', `${user?.streaks?.longest || 0} days`],
          ['🏅', 'Badges', user?.achievements?.length || 0],
          ['⭐', 'Points', (user?.leaderboardPoints || 0).toLocaleString()],
        ].map(([icon, label, val]) => (
          <div key={label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{val}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Editable info */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>Personal Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} disabled={!editing} style={{ opacity: editing ? 1 : 0.7 }} />
            </div>
            <div className="input-group">
              <label className="input-label">Phone</label>
              <input className="input" value={form.profile.phone} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, phone: e.target.value } }))} disabled={!editing} placeholder="+91 9876543210" style={{ opacity: editing ? 1 : 0.7 }} />
            </div>
          </div>
          <div className="grid-3">
            <div className="input-group">
              <label className="input-label">Age</label>
              <input type="number" className="input" value={form.profile.age} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, age: e.target.value } }))} disabled={!editing} style={{ opacity: editing ? 1 : 0.7 }} />
            </div>
            <div className="input-group">
              <label className="input-label">Height (cm)</label>
              <input type="number" className="input" value={form.profile.height} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, height: e.target.value } }))} disabled={!editing} style={{ opacity: editing ? 1 : 0.7 }} />
            </div>
            <div className="input-group">
              <label className="input-label">Weight (kg)</label>
              <input type="number" className="input" value={form.profile.weight} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, weight: e.target.value } }))} disabled={!editing} style={{ opacity: editing ? 1 : 0.7 }} />
            </div>
          </div>
          <div className="grid-3">
            {[['gender', 'Gender', GENDERS], ['fitnessGoal', 'Fitness Goal', FITNESS_GOALS], ['fitnessLevel', 'Fitness Level', FITNESS_LEVELS]].map(([key, label, opts]) => (
              <div key={key} className="input-group">
                <label className="input-label">{label}</label>
                <select className="input" value={form.profile[key]} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, [key]: e.target.value } }))} disabled={!editing} style={{ background: 'var(--bg-overlay)', opacity: editing ? 1 : 0.7 }}>
                  {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="input-group">
            <label className="input-label">Activity Level</label>
            <select className="input" value={form.profile.activityLevel} onChange={e => setForm(p => ({ ...p, profile: { ...p.profile, activityLevel: e.target.value } }))} disabled={!editing} style={{ background: 'var(--bg-overlay)', opacity: editing ? 1 : 0.7 }}>
              {ACTIVITY_LEVELS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {editing && (
            <button className="btn btn-primary" onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : '💾 Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Achievements */}
      {user?.achievements?.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>🏅 Achievements</h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {user.achievements.map((a, i) => (
              <div key={i} style={{ textAlign: 'center', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', minWidth: 100 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>{a.badge}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(a.earnedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
