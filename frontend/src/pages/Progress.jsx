import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { progressService } from '../services/api';
import { StatCard, SkeletonCard, EmptyState, Modal } from '../components/common/PageLoader';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true,
  plugins: { legend: { labels: { color: '#9898b8' } } },
  scales: { x: { ticks: { color: '#9898b8' }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#9898b8' }, grid: { color: 'rgba(255,255,255,0.04)' } } },
};

const PERIODS = [{ val: 'week', label: '7 Days' }, { val: 'month', label: '30 Days' }, { val: 'quarter', label: '3 Months' }, { val: 'year', label: '1 Year' }];

export default function Progress() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState('month');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState('body_measurement');
  const [measurement, setMeasurement] = useState({ weight: '', bmi: '', bodyFat: '', chest: '', waist: '', hips: '', biceps: '' });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['progress-summary', period],
    queryFn: () => progressService.getSummary({ period }).then(r => r.data.data),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['progress-history', period],
    queryFn: () => progressService.getHistory({ period, limit: 20 }).then(r => r.data.data),
  });

  const { data: records } = useQuery({
    queryKey: ['personal-records'],
    queryFn: () => progressService.getPersonalRecords().then(r => r.data.data.records),
  });

  const logMeasurement = useMutation({
    mutationFn: (data) => progressService.logProgress(data),
    onSuccess: () => {
      toast.success('Measurements logged!');
      setShowLogModal(false);
      setMeasurement({ weight: '', bmi: '', bodyFat: '', chest: '', waist: '', hips: '', biceps: '' });
      qc.invalidateQueries(['progress-summary', 'progress-history']);
    },
  });

  const downloadReport = async () => {
    try {
      const response = await progressService.downloadReport({ period });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `progress-report-${period}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const caloriesChart = {
    labels: (summary?.chartData?.calories || []).map(d => d.date?.slice(5)),
    datasets: [{ label: 'Calories Burned', data: (summary?.chartData?.calories || []).map(d => d.value), fill: true, borderColor: '#e63946', backgroundColor: 'rgba(230,57,70,0.1)', tension: 0.4 }],
  };

  const weightChart = {
    labels: (summary?.chartData?.weight || []).map(d => d.date?.slice(5)),
    datasets: [{ label: 'Weight (kg)', data: (summary?.chartData?.weight || []).map(d => d.value), fill: false, borderColor: '#4cc9f0', tension: 0.4, pointRadius: 4 }],
  };

  const handleLogSubmit = () => {
    const cleaned = {};
    Object.entries(measurement).forEach(([k, v]) => { if (v !== '') cleaned[k] = parseFloat(v); });
    if (Object.keys(cleaned).length === 0) { toast.error('Enter at least one measurement'); return; }
    logMeasurement.mutate({ type: 'body_measurement', date: new Date(), bodyMeasurement: cleaned });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Progress Tracker 📈</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor your fitness journey over time.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={downloadReport}>⬇️ PDF Report</button>
          <button className="btn btn-primary" onClick={() => setShowLogModal(true)}>+ Log Measurements</button>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {PERIODS.map(p => (
          <button
            key={p.val}
            onClick={() => setPeriod(p.val)}
            style={{
              padding: '7px 16px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600,
              border: '1px solid', cursor: 'pointer', transition: 'var(--transition)',
              background: period === p.val ? 'var(--brand)' : 'var(--bg-overlay)',
              borderColor: period === p.val ? 'var(--brand)' : 'var(--border)',
              color: period === p.val ? '#fff' : 'var(--text-secondary)',
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid-4">
        {loadingSummary ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={110} />) : (
          <>
            <StatCard icon="🏃" label="Workouts" value={summary?.totalWorkouts || 0} color="var(--brand)" />
            <StatCard icon="🔥" label="Calories Burned" value={(summary?.totalCalories || 0).toLocaleString()} color="var(--accent)" />
            <StatCard icon="⏱️" label="Total Minutes" value={summary?.totalDuration || 0} color="var(--accent-blue)" />
            <StatCard icon="⭐" label="Avg Workout Rating" value={summary?.avgRating ? summary.avgRating.toFixed(1) : '—'} color="var(--accent-yellow)" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>🔥 Calories Burned</h4>
          {caloriesChart.labels.length > 0
            ? <Line data={caloriesChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
            : <EmptyState icon="📊" title="No data" description="Start logging workouts." />
          }
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>⚖️ Weight Trend (kg)</h4>
          {weightChart.labels.length > 0
            ? <Line data={weightChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} />
            : <EmptyState icon="⚖️" title="No weight data" description="Log body measurements to track weight." />
          }
        </div>
      </div>

      {/* Personal Records */}
      {records && records.length > 0 && (
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>🏆 Personal Records</h3>
          <div className="grid-3">
            {records.slice(0, 6).map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🏋️</div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 4 }}>
                  {r.personalRecord?.exercise?.name || 'Exercise'}
                </h4>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-yellow)', fontFamily: 'var(--font-display)' }}>
                  {r.personalRecord?.value} <span style={{ fontSize: '0.9rem' }}>{r.personalRecord?.unit || 'kg'}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {new Date(r.date).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Workout History */}
      <div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>📋 Workout History</h3>
        {loadingHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} height={72} />)}
          </div>
        ) : (history?.logs || []).filter(l => l.type === 'workout_log').length === 0 ? (
          <EmptyState icon="📋" title="No workout history" description="Complete workouts to see your history here." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(history?.logs || []).filter(l => l.type === 'workout_log').map((log, i) => (
              <motion.div key={log._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'rgba(230,57,70,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🏋️</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: 2 }}>
                    {log.workout?.title || 'Custom Workout'}
                  </h4>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>📅 {new Date(log.date).toLocaleDateString()}</span>
                    <span>⏱ {log.workoutLog?.duration || 0} min</span>
                    <span>🔥 {log.workoutLog?.caloriesBurned || 0} kcal</span>
                    {log.workoutLog?.mood && <span>😊 {log.workoutLog.mood}</span>}
                  </div>
                </div>
                {log.workoutLog?.rating && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: log.workoutLog.rating }).map((_, j) => <span key={j} style={{ fontSize: '0.85rem' }}>⭐</span>)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Log Measurements Modal */}
      <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="📏 Log Body Measurements" maxWidth={540}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid-2">
            {[['weight', 'Weight (kg)', '75'], ['bmi', 'BMI', '22.5'], ['bodyFat', 'Body Fat (%)', '18'], ['chest', 'Chest (cm)', '96'], ['waist', 'Waist (cm)', '80'], ['hips', 'Hips (cm)', '94'], ['biceps', 'Biceps (cm)', '35']].map(([key, label, placeholder]) => (
              <div key={key} className="input-group">
                <label className="input-label">{label}</label>
                <input type="number" step="0.1" className="input" placeholder={placeholder} value={measurement[key] || ''} onChange={e => setMeasurement(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleLogSubmit} disabled={logMeasurement.isPending}>
            {logMeasurement.isPending ? 'Saving...' : '💾 Save Measurements'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
