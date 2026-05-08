import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/api';
import useAuthStore from '../../context/authStore';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onMenuToggle }) {
  const { user } = useAuthStore();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const { data: notifsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => userService.getNotifications().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: () => userService.markNotificationsRead(),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const notifications = notifsData || [];
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifIcon = (type) => ({
    workout_reminder: '🏋️',
    membership_expiry: '⚠️',
    achievement: '🏆',
    class_cancelled: '❌',
    session_confirmed: '✅',
  }[type] || '🔔');

  return (
    <header
      style={{
        height: 'var(--header-h)',
        width: '100%',                      // ← fills full content area width
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxSizing: 'border-box',            // ← prevents padding from causing overflow
        flexShrink: 0,
      }}
    >
      {/* Left — hamburger + connection status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onMenuToggle}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-secondary)', fontSize: '1.4rem',
            padding: 4, display: 'flex', cursor: 'pointer',
          }}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isConnected ? 'var(--accent-green)' : 'var(--text-muted)',
            boxShadow: isConnected ? '0 0 6px var(--accent-green)' : 'none',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Right — streak + notifications + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Streak badge */}
        {user?.streaks?.current > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,107,53,0.1)',
            border: '1px solid rgba(255,107,53,0.3)',
            borderRadius: 100, padding: '4px 12px', fontSize: '0.8rem',
          }}>
            <span>🔥</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {user.streaks.current} day streak
            </span>
          </div>
        )}

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs && unread > 0) markRead.mutate();
            }}
            style={{
              position: 'relative',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', cursor: 'pointer',
            }}
          >
            🔔
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--brand)', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 340,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden', zIndex: 100,
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 600 }}>Notifications</span>
                  {unread > 0 && <span className="badge badge-red">{unread} new</span>}
                </div>

                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔕</div>
                      No notifications yet
                    </div>
                  ) : notifications.slice(0, 10).map((n, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: n.read ? 'transparent' : 'rgba(230,57,70,0.05)',
                        display: 'flex', gap: 12,
                      }}
                    >
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{notifIcon(n.type)}</span>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem',
            border: 'none', cursor: 'pointer', overflow: 'hidden',
          }}
        >
          {user?.avatar?.url
            ? <img src={user.avatar.url} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user?.name?.[0]?.toUpperCase()
          }
        </button>
      </div>
    </header>
  );
}
