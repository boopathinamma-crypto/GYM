// Admin.jsx
import { useQuery } from '@tanstack/react-query';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import { analyticsService } from '../services/api';
import { StatCard, SkeletonCard } from '../components/common/PageLoader';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const co = { plugins: { legend: { labels: { color: '#9898b8' } } }, scales: { x: { ticks: { color: '#9898b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#9898b8' }, grid: { color: 'rgba(255,255,255,0.04)' } } } };

export default function Admin() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: () => analyticsService.getDashboardStats().then(r => r.data.data), refetchInterval: 60000 });
  const { data: revenue = [] } = useQuery({ queryKey: ['revenue-chart'], queryFn: () => analyticsService.getRevenueChart({ period: 'year' }).then(r => r.data.data) });
  const { data: workoutAnalytics } = useQuery({ queryKey: ['workout-analytics'], queryFn: () => analyticsService.getWorkoutAnalytics().then(r => r.data.data) });

  const revenueChart = { labels: revenue.map(d => d.month), datasets: [{ label: 'Revenue (₹)', data: revenue.map(d => d.revenue), backgroundColor: 'rgba(230,57,70,0.7)', borderRadius: 6 }] };
  const categoryChart = workoutAnalytics?.categoryStats ? {
    labels: workoutAnalytics.categoryStats.map(c => c._id),
    datasets: [{ data: workoutAnalytics.categoryStats.map(c => c.count), backgroundColor: ['#e63946','#4cc9f0','#ff6b35','#57cc99','#ffd60a','#b5179e','#3a86ff','#06d6a0'], borderWidth: 0 }],
  } : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Admin Dashboard 🛡️</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time platform analytics and management overview.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid-4">
        {isLoading ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} height={110} />) : stats && (
          <>
            <StatCard icon="👥" label="Total Users" value={stats.users.total.toLocaleString()} trend={stats.users.growth} color="var(--accent-blue)" />
            <StatCard icon="🏋️" label="Active Members" value={stats.users.members.toLocaleString()} color="var(--accent-green)" />
            <StatCard icon="👤" label="Trainers" value={stats.users.trainers} color="var(--accent-purple)" />
            <StatCard icon="📈" label="New This Month" value={stats.users.newThisMonth} color="var(--brand)" />
            <StatCard icon="🏆" label="Active Memberships" value={stats.memberships.active.toLocaleString()} color="var(--accent-yellow)" />
            <StatCard icon="⚠️" label="Expiring Soon" value={stats.memberships.expiringSoon} color="var(--accent)" subtitle="Next 7 days" />
            <StatCard icon="💰" label="Revenue This Month" value={`₹${(stats.revenue.thisMonth).toLocaleString()}`} trend={parseFloat(stats.revenue.growth)} color="var(--accent-green)" />
            <StatCard icon="🏃" label="Workouts Logged" value={stats.content.workoutCompletionsThisMonth.toLocaleString()} color="var(--brand)" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>💰 Monthly Revenue (₹)</h4>
          {revenue.length > 0 ? <Bar data={revenueChart} options={{ ...co, responsive: true }} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No revenue data</p>}
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>🏋️ Workout Categories</h4>
          {categoryChart ? <Doughnut data={categoryChart} options={{ ...co, scales: undefined, responsive: true }} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No data</p>}
        </div>
      </div>

      {/* Popular Workouts */}
      {workoutAnalytics?.popularWorkouts?.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>🔥 Most Popular Workouts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {workoutAnalytics.popularWorkouts.map((w, i) => (
              <div key={w._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: 'var(--bg-overlay)', borderRadius: 8 }}>
                <span style={{ fontWeight: 800, color: 'var(--text-muted)', width: 24, textAlign: 'center' }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{w.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{w.category} · ⭐ {w.averageRating.toFixed(1)}</div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand)' }}>{w.completionCount} completions</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
