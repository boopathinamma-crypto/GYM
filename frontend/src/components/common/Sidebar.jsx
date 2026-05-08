import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../context/authStore';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { path: '/workouts', icon: '🏋️', label: 'Workouts' },
  { path: '/workout-plan', icon: '📋', label: 'Workout Plan' },
  { path: '/exercises', icon: '💪', label: 'Exercises' },
  { path: '/progress', icon: '📈', label: 'Progress' },
  { path: '/membership', icon: '🏆', label: 'Membership' },
  { path: '/booking', icon: '📅', label: 'Book Class' },
  { path: '/chat', icon: '💬', label: 'Messages' },
  { path: '/ai', icon: '🤖', label: 'AI Center' },
  { path: '/leaderboard', icon: '🥇', label: 'Leaderboard' },
];

const ADMIN_ITEMS = [{ path: '/admin', icon: '🛡️', label: 'Admin Panel' }];
const TRAINER_ITEMS = [{ path: '/admin', icon: '👥', label: 'My Members' }];

/* ── Single nav link ─────────────────────────────────────────── */
function NavItem({ path, icon, label, onClose }) {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        borderRadius: 12,
        textDecoration: 'none',
        fontWeight: isActive ? 700 : 500,
        fontSize: '0.9rem',
        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
        background: isActive ? 'rgba(230,57,70,0.1)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
        transition: 'all 0.18s',
        marginBottom: 2,
      })}
    >
      <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>{icon}</span>
      {label}
    </NavLink>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleItems = user?.role === 'admin'
    ? ADMIN_ITEMS
    : user?.role === 'trainer'
      ? TRAINER_ITEMS
      : [];

  const allItems = [...NAV_ITEMS, ...roleItems];

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const COLORS = ['#e63946', '#4cc9f0', '#57cc99', '#ff6b35', '#b5179e', '#3a86ff'];
  const avatarColor = COLORS[(user?.name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <>
      {/* ── Dark overlay — click to close ──────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(2px)',
              zIndex: 40,
              cursor: 'pointer',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar panel ──────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          height: '100vh',
          width: 260,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* ── Top: Logo + close button ──────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900 }}>
            <span style={{ color: 'var(--brand)' }}>GYM</span>
            <span style={{ color: 'var(--text-primary)' }}>PRO</span>
          </div>
          {/* Close button (× ) */}
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--brand)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >×</button>
        </div>

        {/* ── User profile area ─────────────────────────────── */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 12, alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: user?.avatar?.url ? 'transparent' : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#fff',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {user?.avatar?.url
              ? <img src={user.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <span style={{
              display: 'inline-block', marginTop: 3,
              background: user?.role === 'admin'
                ? 'rgba(255,214,10,0.15)' : user?.role === 'trainer'
                  ? 'rgba(76,201,240,0.15)' : 'rgba(87,204,153,0.15)',
              color: user?.role === 'admin'
                ? '#ffd60a' : user?.role === 'trainer'
                  ? '#4cc9f0' : '#57cc99',
              borderRadius: 100, padding: '2px 10px',
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize',
            }}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {allItems.map(item => (
            <NavItem key={item.path} {...item} onClose={onClose} />
          ))}
        </nav>

        {/* ── Bottom: Logout ────────────────────────────────── */}
        <div style={{ padding: '12px 10px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px', borderRadius: 12,
              background: 'rgba(230,57,70,0.07)',
              border: '1px solid rgba(230,57,70,0.2)',
              color: 'var(--brand)', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.07)'; }}
          >
            <span style={{ fontSize: '1.1rem', width: 22, textAlign: 'center' }}>🚪</span>
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}