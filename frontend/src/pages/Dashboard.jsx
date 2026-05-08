import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { motion } from 'framer-motion';
import { progressService, workoutService, membershipService, analyticsService } from '../services/api';
import useAuthStore from '../context/authStore';
import { SkeletonCard, EmptyState } from '../components/common/PageLoader';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
);

/* ─── Chart theme ─────────────────────────────────────────────── */
const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9898b8', font: { family: 'DM Sans', size: 12 } } },
    tooltip: {
      backgroundColor: '#1f1f2a',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      titleColor: '#f0f0f8',
      bodyColor: '#9898b8',
      padding: 12,
    },
  },
  scales: {
    x: { ticks: { color: '#9898b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#9898b8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

/* ─── Helpers ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay, ease: [0.4, 0, 0.2, 1] },
});

const BMI_COLOR = (v) => v < 18.5 ? '#4cc9f0' : v < 25 ? '#57cc99' : v < 30 ? '#ffd60a' : '#e63946';
const BMI_LABEL = (v) => v < 18.5 ? 'Underweight' : v < 25 ? 'Healthy' : v < 30 ? 'Overweight' : 'Obese';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CAT_COLORS = {
  strength: '#e63946', cardio: '#4cc9f0', hiit: '#ff6b35', yoga: '#b5179e',
  weight_loss: '#ffd60a', muscle_gain: '#57cc99', flexibility: '#7209b7', endurance: '#3a86ff',
};

/* ─── Stat Card ───────────────────────────────────────────────── */
function Stat({ icon, label, value, sub, accent = '#e63946' }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accent, borderRadius: '16px 16px 0 0',
      }} />
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${accent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', marginBottom: 12,
      }}>{icon}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ─── Chart Card wrapper ──────────────────────────────────────── */
function ChartCard({ title, height = 220, action, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{title}</h3>
        {action}
      </div>
      <div style={{ height, flex: 1 }}>{children}</div>
    </div>
  );
}

/* ─── Panel ───────────────────────────────────────────────────── */
function Panel({ title, action, children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 24, ...style,
    }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {title && <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');

  /* ── Data fetching ─────────────────────────────────────────── */
  const { data: summary, isLoading: loadSum } = useQuery({
    queryKey: ['progress-summary', period],
    queryFn: () => progressService.getSummary({ period }).then(r => r.data.data),
  });

  const { data: membership } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => membershipService.getMyMembership().then(r => r.data.data.membership),
  });

  const { data: workoutsData } = useQuery({
    queryKey: ['popular-workouts'],
    queryFn: () => workoutService.getWorkouts({ limit: 8, sortBy: 'popular' }).then(r => r.data.data),
  });

  const { data: weeklyPlan } = useQuery({
    queryKey: ['weekly-plan'],
    queryFn: () => workoutService.getWeeklyPlan().then(r => r.data.data),
  });

  const { data: workoutAnalytics } = useQuery({
    queryKey: ['workout-analytics'],
    queryFn: () => analyticsService.getWorkoutAnalytics().then(r => r.data.data),
  });

  /* ── Chart datasets ────────────────────────────────────────── */
  const calChart = {
    labels: (summary?.chartData?.calories || []).map(d => d.date?.slice(5)),
    datasets: [{
      label: 'Calories',
      data: (summary?.chartData?.calories || []).map(d => d.value),
      fill: true,
      borderColor: '#e63946',
      backgroundColor: 'rgba(230,57,70,0.1)',
      tension: 0.45,
      pointRadius: 3,
      pointBackgroundColor: '#e63946',
    }],
  };

  const wgtChart = {
    labels: (summary?.chartData?.weight || []).map(d => d.date?.slice(5)),
    datasets: [{
      label: 'Weight (kg)',
      data: (summary?.chartData?.weight || []).map(d => d.value),
      fill: true,
      borderColor: '#4cc9f0',
      backgroundColor: 'rgba(76,201,240,0.08)',
      tension: 0.45,
      pointRadius: 3,
      pointBackgroundColor: '#4cc9f0',
    }],
  };

  const doughData = workoutAnalytics?.categoryStats ? {
    labels: workoutAnalytics.categoryStats.map(c => c._id),
    datasets: [{
      data: workoutAnalytics.categoryStats.map(c => c.count),
      backgroundColor: [
        '#e63946', '#4cc9f0', '#ff6b35', '#57cc99',
        '#ffd60a', '#b5179e', '#3a86ff', '#06d6a0',
      ],
      borderWidth: 0,
    }],
  } : null;

  /* ── Derived ───────────────────────────────────────────────── */
  const bmi = user?.profile?.bmi;
  const bmiC = bmi ? BMI_COLOR(bmi) : '#9898b8';
  const todayIdx = new Date().getDay();
  const daysLeft = membership
    ? Math.max(0, Math.ceil((new Date(membership.endDate) - new Date()) / 86400000))
    : 0;
  const memPct = membership
    ? Math.min(100, Math.round((daysLeft / (membership.plan?.duration || 30)) * 100))
    : 0;

  /* ── Layout ──────────────────────────────────────────────────
     The whole page uses CSS Grid rows. Each row is defined below.
     Width = 100% of the main content area (no maxWidth restriction).
  ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

      {/* ╔═══════════════════════════════════════════════╗
          ║  ROW 0 – HEADER BAR                          ║
          ╚═══════════════════════════════════════════════╝ */}
      <motion.div {...fadeUp(0)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 2.8vw, 2.8rem)',
            color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: 4,
          }}>
            WELCOME BACK,{' '}
            <span style={{ color: 'var(--brand)' }}>
              {user?.name?.split(' ')[0]?.toUpperCase()}
            </span> 💪
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {user?.streaks?.current > 0
              ? `🔥 ${user.streaks.current}-day streak — keep the momentum!`
              : "Ready to smash today's workout?"
            }
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['week', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '7px 18px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
              border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
              background: period === p ? 'var(--brand)' : 'var(--bg-overlay)',
              borderColor: period === p ? 'var(--brand)' : 'var(--border)',
              color: period === p ? '#fff' : 'var(--text-secondary)',
            }}>
              {p === 'week' ? '7D' : p === 'month' ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Alerts */}
      {!membership && (
        <motion.div {...fadeUp(0.04)} style={{
          background: 'linear-gradient(135deg,rgba(230,57,70,0.12),rgba(255,107,53,0.07))',
          border: '1px solid rgba(230,57,70,0.3)',
          borderRadius: 14, padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            🏆 <strong style={{ color: 'var(--text-primary)' }}>Unlock Premium</strong> — AI workouts, trainer sessions & more
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/membership')}>View Plans →</button>
        </motion.div>
      )}

      {/* ╔═══════════════════════════════════════════════╗
          ║  ROW 1 – STAT CARDS  (5 equal columns)       ║
          ╚═══════════════════════════════════════════════╝ */}
      <motion.div {...fadeUp(0.08)} style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
      }}>
        {loadSum ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={148} />)
        ) : (
          <>
            <Stat icon="🏃" label="Workouts" value={summary?.totalWorkouts ?? 0} sub="This period" accent="#e63946" />
            <Stat icon="🔥" label="Calories Burned" value={(summary?.totalCalories ?? 0).toLocaleString()} sub="kcal" accent="#ff6b35" />
            <Stat icon="⏱️" label="Active Minutes" value={(summary?.totalDuration ?? 0).toLocaleString()} sub="Total time" accent="#4cc9f0" />
            <Stat icon="⭐" label="Avg Rating" value={summary?.avgRating ? summary.avgRating.toFixed(1) : '—'} sub="Workout score" accent="#ffd60a" />
            <Stat icon="🔥" label="Current Streak" value={`${user?.streaks?.current ?? 0}d`} sub={`Best: ${user?.streaks?.longest ?? 0}d`} accent="#57cc99" />
          </>
        )}
      </motion.div>

      {/* ╔═══════════════════════════════════════════════╗
          ║  ROW 2 – CHARTS  (3 columns: 5fr 5fr 4fr)   ║
          ╚═══════════════════════════════════════════════╝ */}
      <motion.div {...fadeUp(0.12)} style={{
        display: 'grid',
        gridTemplateColumns: '5fr 5fr 4fr',
        gap: 20,
      }}>
        {/* Calories chart */}
        <ChartCard
          title="🔥 Calories Burned"
          height={230}
          action={<span className="badge badge-red">{period}</span>}
        >
          {calChart.labels.length > 0 ? (
            <Line
              data={calChart}
              options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }}
            />
          ) : (
            <EmptyState icon="📊" title="No data yet" description="Log workouts to see chart" />
          )}
        </ChartCard>

        {/* Weight chart */}
        <ChartCard
          title="⚖️ Weight (kg)"
          height={230}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/progress')}>
              + Log
            </button>
          }
        >
          {wgtChart.labels.length > 0 ? (
            <Line
              data={wgtChart}
              options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: false } } }}
            />
          ) : (
            <EmptyState icon="⚖️" title="No weight logs" description="Track measurements to see trend" />
          )}
        </ChartCard>

        {/* Doughnut */}
        <ChartCard title="🏋️ Workout Mix" height={230}>
          {doughData ? (
            <Doughnut
              data={doughData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                  legend: { position: 'right', labels: { color: '#9898b8', font: { size: 11 }, boxWidth: 12, padding: 8 } },
                },
              }}
            />
          ) : (
            <EmptyState icon="🍩" title="No data" description="" />
          )}
        </ChartCard>
      </motion.div>

      {/* ╔═══════════════════════════════════════════════╗
          ║  ROW 3 – BMI | MEMBERSHIP+ACTIONS | WEEK    ║
          ╚═══════════════════════════════════════════════╝ */}
      <motion.div {...fadeUp(0.16)} style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 320px',
        gap: 20,
      }}>
        {/* ── BMI ── */}
        <Panel title="📏 Body Stats">
          {bmi ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* ring */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 120, height: 120, borderRadius: '50%', margin: '0 auto',
                  border: `10px solid ${bmiC}25`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: bmiC, lineHeight: 1 }}>{bmi}</span>
                  <span style={{ fontSize: '0.7rem', color: bmiC, fontWeight: 700, marginTop: 2 }}>{BMI_LABEL(bmi)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['Height', user?.profile?.height, 'cm'], ['Weight', user?.profile?.weight, 'kg']].map(([l, v, u]) => (
                  <div key={l} style={{
                    flex: 1, background: 'var(--bg-overlay)', borderRadius: 12,
                    padding: '12px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {v}<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 2 }}>{u}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => navigate('/profile')}>
                Update Profile
              </button>
            </div>
          ) : (
            <EmptyState icon="📏" title="No stats yet" description="Add height & weight in profile"
              action={<button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile')}>Go to Profile</button>}
            />
          )}
        </Panel>

        {/* ── MEMBERSHIP + QUICK ACTIONS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Membership banner */}
          {membership?.status === 'active' ? (
            <div style={{
              background: 'linear-gradient(135deg,rgba(87,204,153,0.1),rgba(76,201,240,0.07))',
              border: '1px solid rgba(87,204,153,0.25)',
              borderRadius: 16, padding: '18px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '1rem' }}>
                    ✅ {membership.plan?.name || 'Premium Plan'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Expires {new Date(membership.endDate).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--accent-green)', lineHeight: 1 }}>
                  {daysLeft}<span style={{ fontSize: '0.8rem' }}>d</span>
                </span>
              </div>
              <div style={{ background: 'var(--bg-overlay)', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${memPct}%`, background: 'var(--accent-green)', borderRadius: 100, transition: 'width 0.6s' }} />
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)',
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No active membership</span>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/membership')}>Subscribe →</button>
            </div>
          )}

          {/* Quick Actions */}
          <Panel title="⚡ Quick Actions" style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { icon: '🏋️', label: 'Workouts', path: '/workouts', color: '#e63946', desc: 'Browse library' },
                { icon: '📋', label: 'Workout Plan', path: '/workout-plan', color: '#ff6b35', desc: '6-Day program' },
                { icon: '📅', label: 'Book Class', path: '/booking', color: '#4cc9f0', desc: 'Reserve a spot' },
                { icon: '📊', label: 'Log Progress', path: '/progress', color: '#57cc99', desc: 'Track metrics' },
                { icon: '🤖', label: 'AI Coach', path: '/ai', color: '#b5179e', desc: 'Smart recs' },
                { icon: '🥇', label: 'Leaderboard', path: '/leaderboard', color: '#ffd60a', desc: 'View rankings' },
              ].map(({ icon, label, path, color, desc }) => (
                <motion.button
                  key={path}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(path)}
                  style={{
                    background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '14px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-secondary)',
                    fontSize: '0.78rem', fontWeight: 600,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = color + '12'; e.currentTarget.style.boxShadow = '0 4px 16px ' + color + '20'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>{desc}</span>
                </motion.button>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── WEEKLY PLAN ── */}
        <Panel
          title="📅 This Week"
          action={
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {weeklyPlan?.plan?.filter(d => d.logs?.length > 0).length ?? 0}/7 done
            </span>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DAYS.map((day, i) => {
              const d = weeklyPlan?.plan?.[i];
              const isToday = i === todayIdx;
              const done = (d?.logs?.length ?? 0) > 0;
              return (
                <div key={day} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  background: isToday ? 'rgba(230,57,70,0.08)' : done ? 'rgba(87,204,153,0.04)' : 'transparent',
                  border: `1px solid ${isToday ? 'rgba(230,57,70,0.28)' : 'transparent'}`,
                }}>
                  <span style={{
                    width: 32, fontSize: '0.78rem', fontWeight: isToday ? 800 : 500,
                    color: isToday ? 'var(--brand)' : 'var(--text-muted)',
                  }}>{day}</span>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: done ? 'var(--accent-green)' : 'var(--bg-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.66rem', color: done ? '#fff' : 'transparent', fontWeight: 800,
                  }}>✓</div>
                  <span style={{
                    flex: 1, fontSize: '0.82rem',
                    color: done ? 'var(--text-primary)' : isToday ? 'var(--text-secondary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {done
                      ? d.logs[0]?.workout?.title || 'Workout done ✓'
                      : isToday ? 'Start a workout!' : '—'}
                  </span>
                  {isToday && !done && (
                    <button
                      style={{
                        background: 'var(--brand)', color: '#fff', border: 'none',
                        borderRadius: 6, padding: '4px 10px', fontSize: '0.7rem',
                        fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                      }}
                      onClick={() => navigate('/workouts')}
                    >Go</button>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </motion.div>

      {/* ╔═══════════════════════════════════════════════╗
          ║  ROW 4 – ACHIEVEMENTS | POPULAR WORKOUTS     ║
          ╚═══════════════════════════════════════════════╝ */}
      <motion.div {...fadeUp(0.2)} style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 20,
      }}>
        {/* Achievements */}
        <Panel title="🏅 Achievements">
          {user?.achievements?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {user.achievements.map((a, i) => (
                <div key={i} data-tooltip={a.title} style={{
                  background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 14px', textAlign: 'center',
                  minWidth: 72, flex: '1 1 72px',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 4 }}>{a.badge}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: 8 }}>🏅</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Complete workouts to earn badges!</p>
            </div>
          )}
          {/* Points footer */}
          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Leaderboard Points</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--accent-yellow)', lineHeight: 1 }}>
                {(user?.leaderboardPoints ?? 0).toLocaleString()}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leaderboard')}>
              View Board →
            </button>
          </div>
        </Panel>

        {/* Popular Workouts */}
        <Panel
          title="🔥 Popular Workouts"
          action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/workouts')}>View All →</button>}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {(workoutsData || []).map((w) => {
              const c = CAT_COLORS[w.category] || '#e63946';
              return (
                <motion.div
                  key={w._id}
                  whileHover={{ scale: 1.025 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/workouts/${w._id}`)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid var(--border)`,
                    borderLeft: `3px solid ${c}`,
                    borderRadius: 12, padding: '14px 14px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = c}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {w.category?.replace('_', ' ')}
                    </span>
                    {w.isPremium && <span style={{ fontSize: '0.65rem', color: '#ffd60a' }}>⭐ Pro</span>}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 8, lineHeight: 1.3 }}>
                    {w.title}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>⏱ {w.estimatedDuration}m</span>
                    <span>🔥 {w.caloriesBurn || '?'}</span>
                    <span>★ {w.averageRating > 0 ? w.averageRating.toFixed(1) : 'New'}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>
      </motion.div>

      {/* spacer */}
      <div style={{ height: 4 }} />
    </div>
  );
}
