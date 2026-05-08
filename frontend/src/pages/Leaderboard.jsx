// Leaderboard.jsx
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userService } from '../services/api';
import useAuthStore from '../context/authStore';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => userService.getLeaderboard({ limit: 50 }).then(r => r.data.data),
  });

  const rankColors = ['#ffd60a', '#c0c0c0', '#cd7f32'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700, margin: '0 auto' }}>
      <div>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Leaderboard 🏆</h1>
        <p style={{ color: 'var(--text-muted)' }}>Top performers this week. Points earned by completing workouts, streaks, and PRs.</p>
      </div>

      {/* Top 3 podium */}
      {!isLoading && leaderboard.length >= 3 && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', justifyContent: 'center', padding: '20px 0' }}>
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            const heights = [120, 160, 100];
            const ranks = [2, 1, 3];
            return (
              <motion.div key={entry._id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{rankEmojis[ranks[i] - 1]}</div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${rankColors[ranks[i] - 1]}, ${rankColors[ranks[i] - 1]}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', margin: '0 auto 8px', overflow: 'hidden' }}>
                  {entry.avatar?.url ? <img src={entry.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : entry.name?.[0]}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{entry.name}</div>
                <div style={{ fontSize: '0.8rem', color: rankColors[ranks[i] - 1], fontWeight: 700 }}>{entry.points} pts</div>
                <div style={{ height: heights[i], background: `${rankColors[ranks[i] - 1]}20`, border: `1px solid ${rankColors[ranks[i] - 1]}40`, borderRadius: '8px 8px 0 0', marginTop: 8 }} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
        )) : leaderboard.map((entry, i) => {
          const isMe = entry._id === user?._id;
          return (
            <motion.div key={entry._id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
                background: isMe ? 'rgba(230,57,70,0.08)' : 'var(--bg-surface)',
                border: `1px solid ${isMe ? 'var(--border-brand)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
              }}>
              <div style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: '1rem', color: i < 3 ? rankColors[i] : 'var(--text-muted)', flexShrink: 0 }}>
                {i < 3 ? rankEmojis[i] : `#${entry.rank}`}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                {entry.avatar?.url ? <img src={entry.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : entry.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {entry.name} {isMe && <span className="badge badge-red" style={{ fontSize: '0.7rem', marginLeft: 6 }}>You</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>🔥 {entry.currentStreak} day streak</span>
                  <span>🏅 {entry.badgeCount} badges</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: i < 3 ? rankColors[i] : 'var(--text-primary)' }}>
                {entry.points.toLocaleString()}
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginLeft: 2 }}>pts</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
