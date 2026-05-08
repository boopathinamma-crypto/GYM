import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', marginBottom: 24 }}>
          <span style={{ color: 'var(--brand)' }}>GYM</span>
          <span style={{ color: 'var(--text-primary)' }}>PRO</span>
        </div>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--bg-hover)',
          borderTopColor: 'var(--brand)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto',
        }} />
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, trend, color = 'var(--brand)', subtitle }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-sm)',
          background: `${color}20`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.3rem',
        }}>{icon}</div>
        {trend !== undefined && (
          <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: trend >= 0 ? 'var(--accent-green)' : 'var(--brand)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
      {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-disabled)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
export function SkeletonCard({ height = 120 }) {
  return <div className="skeleton" style={{ height, borderRadius: 'var(--radius-md)' }} />;
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ height: 16, width: '60%' }} />
            <div className="skeleton" style={{ height: 12, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{icon}</div>
      <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: action ? 24 : 0, maxWidth: 340, margin: '0 auto 24px' }}>{description}</p>
      {action}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, maxWidth = 500 }) {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: 28,
          width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
            >×</button>
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}

// ─── Difficulty Badge ──────────────────────────────────────────────────────────
export function DifficultyBadge({ level }) {
  const map = { beginner: 'green', intermediate: 'orange', advanced: 'red' };
  return <span className={`badge badge-${map[level] || 'blue'}`}>{level}</span>;
}

// ─── Category Badge ────────────────────────────────────────────────────────────
export function CategoryBadge({ category }) {
  const icons = {
    strength: '🏋️', cardio: '🏃', hiit: '⚡', yoga: '🧘',
    weight_loss: '🔥', muscle_gain: '💪', flexibility: '🤸', endurance: '🚴',
  };
  return (
    <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
      {icons[category] || '🏃'} {category?.replace('_', ' ')}
    </span>
  );
}
