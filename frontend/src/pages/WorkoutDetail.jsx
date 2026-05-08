import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { workoutService, progressService, userService } from '../services/api';
import useAuthStore from '../context/authStore';
import { useSocket } from '../context/SocketContext';
import { DifficultyBadge, CategoryBadge, Modal } from '../components/common/PageLoader';

/* ─── tiny helpers ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: [0.4, 0, 0.2, 1] },
});

const CAT_COLORS = {
  strength: '#e63946', cardio: '#4cc9f0', hiit: '#ff6b35',
  yoga: '#b5179e', weight_loss: '#ffd60a', muscle_gain: '#57cc99',
  flexibility: '#7209b7', endurance: '#3a86ff',
};

/* ─── Workout Timer ─────────────────────────────────────────── */
function WorkoutTimer({ running }) {
  const [secs, setSecs] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '2.8rem',
      fontWeight: 700,
      color: running ? 'var(--brand)' : 'var(--text-muted)',
      letterSpacing: '0.06em',
      textAlign: 'center',
      lineHeight: 1,
    }}>
      {h}:{m}:{s}
    </div>
  );
}

/* ─── Exercise Row ──────────────────────────────────────────── */
function ExerciseRow({ ex, index, isWorking, onDone, isDone }) {
  return (
    <motion.div
      {...fadeUp(index * 0.05)}
      style={{
        background: isDone ? 'rgba(87,204,153,0.06)' : 'var(--bg-surface)',
        border: `1px solid ${isDone ? 'rgba(87,204,153,0.3)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        transition: 'all 0.25s',
      }}
    >
      {/* Index / Done bubble */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: isDone
          ? 'var(--accent-green)'
          : 'linear-gradient(135deg, var(--brand), var(--accent))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#fff', fontSize: '1rem',
        transition: 'background 0.25s',
      }}>
        {isDone ? '✓' : index + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          color: isDone ? 'var(--accent-green)' : 'var(--text-primary)',
          marginBottom: 6, fontSize: '0.95rem',
          textDecoration: isDone ? 'line-through' : 'none',
          transition: 'all 0.25s',
        }}>
          {ex.exercise?.name || 'Exercise'}
        </h4>

        {/* Metrics pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {[
            ex.sets && { icon: '📊', val: `${ex.sets} sets` },
            ex.reps && { icon: '🔁', val: `${ex.reps} reps` },
            ex.duration && { icon: '⏱', val: `${ex.duration}s` },
            ex.weight && { icon: '🏋️', val: `${ex.weight} kg` },
            ex.restInterval && { icon: '😴', val: `${ex.restInterval}s rest` },
          ].filter(Boolean).map(({ icon, val }) => (
            <span key={val} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--bg-overlay)', borderRadius: 100,
              padding: '3px 10px', fontSize: '0.78rem', color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>
              {icon} {val}
            </span>
          ))}
        </div>

        {ex.notes && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
            💡 {ex.notes}
          </p>
        )}

        {/* Muscle tags */}
        {ex.exercise?.muscleGroup?.primary?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ex.exercise.muscleGroup.primary.map(m => (
              <span key={m} className="tag" style={{ fontSize: '0.7rem' }}>{m}</span>
            ))}
          </div>
        )}
      </div>

      {/* Done button */}
      {isWorking && (
        <button
          onClick={onDone}
          style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 10,
            border: `1px solid ${isDone ? 'var(--accent-green)' : 'var(--border)'}`,
            background: isDone ? 'rgba(87,204,153,0.15)' : 'var(--bg-overlay)',
            color: isDone ? 'var(--accent-green)' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isDone ? '✓ Done' : 'Mark Done'}
        </button>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { emitWorkoutStart, emitWorkoutComplete } = useSocket();
  const qc = useQueryClient();

  const [activeSection, setActiveSection] = useState('main');
  const [isWorking, setIsWorking] = useState(false);
  const [doneSet, setDoneSet] = useState(new Set());
  const [showLogModal, setShowLogModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [logData, setLogData] = useState({ duration: '', caloriesBurned: '', rating: 4, mood: 'good', notes: '' });
  const [rating, setRating] = useState({ score: 5, review: '' });

  /* ── queries ───────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn: () => workoutService.getWorkout(id).then(r => r.data.data),
  });

  /* ── mutations ─────────────────────────────────────────────── */
  const saveWorkout = useMutation({
    mutationFn: () => userService.toggleSaveWorkout(id),
    onSuccess: (res) => {
      toast.success(res.data.data.saved ? 'Workout saved! ❤️' : 'Removed from saved');
      qc.invalidateQueries(['workout', id]);
    },
  });

  const logWorkout = useMutation({
    mutationFn: (payload) => progressService.logProgress(payload),
    onSuccess: () => {
      toast.success('Workout logged! Great work! 💪');
      setShowLogModal(false);
      setIsWorking(false);
      setDoneSet(new Set());
      emitWorkoutComplete({
        workoutId: id,
        duration: parseInt(logData.duration),
        calories: parseInt(logData.caloriesBurned),
      });
      qc.invalidateQueries(['progress-summary']);
    },
  });

  const rateWorkout = useMutation({
    mutationFn: (payload) => workoutService.rateWorkout(id, payload),
    onSuccess: () => {
      toast.success('Rating submitted! ⭐');
      setShowRateModal(false);
      qc.invalidateQueries(['workout', id]);
    },
  });

  /* ── derived ───────────────────────────────────────────────── */
  const workout = data?.workout;
  const isSaved = data?.isSaved;
  const sections = workout?.sections || [];
  const currentSection = sections.find(s => s.type === activeSection) || sections[0];
  const catColor = workout ? (CAT_COLORS[workout.category] || '#e63946') : '#e63946';
  const totalExercises = sections.reduce((acc, s) => acc + (s.exercises?.length || 0), 0);
  const doneCount = doneSet.size;
  const completionPct = totalExercises > 0 ? Math.round((doneCount / totalExercises) * 100) : 0;

  const sectionTabs = sections.map(s => ({
    key: s.type,
    label: s.type === 'warmup' ? '🌡️ Warm-up' : s.type === 'main' ? '💪 Main' : '❄️ Cool-down',
    count: s.exercises?.length || 0,
  }));

  /* ── handlers ──────────────────────────────────────────────── */
  const handleStart = () => {
    setIsWorking(true);
    setDoneSet(new Set());
    emitWorkoutStart({ workoutId: id, workoutTitle: workout.title });
    toast('Workout started! Give it your all! 💪', { icon: '🏋️' });
  };

  const handleLogSubmit = () => {
    logWorkout.mutate({
      type: 'workout_log',
      workout: id,
      date: new Date(),
      workoutLog: {
        duration: parseInt(logData.duration) || workout.estimatedDuration,
        caloriesBurned: parseInt(logData.caloriesBurned) || workout.caloriesBurn || 0,
        rating: logData.rating,
        mood: logData.mood,
        notes: logData.notes,
        completionPercentage: completionPct,
      },
    });
  };

  const toggleDone = (key) => {
    setDoneSet(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  /* ── loading ───────────────────────────────────────────────── */
  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        border: '3px solid var(--bg-hover)', borderTopColor: 'var(--brand)',
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );

  if (!workout) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>😕</div>
      <h3>Workout not found</h3>
      <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/workouts')}>← Go Back</button>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     FULL-SCREEN TWO-COLUMN LAYOUT
     Left  (sticky): workout info + controls
     Right (scroll): exercise sections
  ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Back bar ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate('/workouts')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.88rem', display: 'flex',
            alignItems: 'center', gap: 6, padding: 0,
          }}
        >
          ← Back to Workouts
        </button>
      </div>

      {/* ── Hero Banner (full width) ────────────────────────────── */}
      <motion.div
        {...fadeUp(0)}
        style={{
          width: '100%',
          background: `linear-gradient(135deg, ${catColor}18 0%, var(--bg-surface) 60%)`,
          border: `1px solid ${catColor}30`,
          borderRadius: 20,
          padding: '32px 36px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative bg blob */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: `radial-gradient(circle, ${catColor}25, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, position: 'relative' }}>
          {/* Left: title area */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <CategoryBadge category={workout.category} />
              <DifficultyBadge level={workout.difficulty} />
              {workout.isPremium && <span className="badge badge-yellow">⭐ Premium</span>}
            </div>
            <h1 style={{
              color: 'var(--text-primary)', marginBottom: 10,
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
              lineHeight: 1.1,
            }}>
              {workout.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: 560, marginBottom: 16 }}>
              {workout.description}
            </p>

            {/* creator */}
            {workout.createdBy && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--brand), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                }}>
                  {workout.createdBy.avatar?.url
                    ? <img src={workout.createdBy.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : workout.createdBy.name?.[0]}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Created by <strong style={{ color: 'var(--text-secondary)' }}>{workout.createdBy.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Right: stat blocks */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {[
              { icon: '⏱', label: 'Duration', value: `${workout.estimatedDuration} min` },
              { icon: '🔥', label: 'Est. Burn', value: `${workout.caloriesBurn || '?'} kcal` },
              { icon: '⭐', label: 'Rating', value: workout.averageRating > 0 ? `${workout.averageRating.toFixed(1)}/5` : 'New' },
              { icon: '👥', label: 'Completions', value: workout.completionCount || 0 },
              { icon: '💪', label: 'Exercises', value: totalExercises },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{
                background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)',
                borderRadius: 14, padding: '14px 20px', textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.07)', minWidth: 90,
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── TWO-COLUMN BODY ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ╔════════════════════════════════╗
            ║  LEFT COLUMN (sticky sidebar)  ║
            ╚════════════════════════════════╝ */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Timer card */}
          <motion.div {...fadeUp(0.06)} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 18, padding: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Workout Timer
            </div>
            <WorkoutTimer running={isWorking} />

            {/* Progress ring when working */}
            {isWorking && totalExercises > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Progress</span>
                  <span style={{ color: completionPct === 100 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                    {doneCount}/{totalExercises}
                  </span>
                </div>
                <div style={{ background: 'var(--bg-hover)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${completionPct}%`,
                    background: completionPct === 100 ? 'var(--accent-green)' : `linear-gradient(90deg, var(--brand), var(--accent))`,
                    borderRadius: 100,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {completionPct}% complete
                </div>
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!isWorking ? (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-primary btn-lg"
                  onClick={handleStart}
                  style={{ width: '100%', fontSize: '1rem', padding: '14px 0' }}
                >
                  🚀 Start Workout
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn btn-lg"
                  onClick={() => setShowLogModal(true)}
                  style={{ width: '100%', background: 'var(--accent-green)', color: '#fff', border: 'none', fontSize: '1rem', padding: '14px 0', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  ✅ Finish & Log
                </motion.button>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => saveWorkout.mutate()}
                  disabled={saveWorkout.isPending}
                >
                  {isSaved ? '❤️ Saved' : '🤍 Save'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowRateModal(true)}
                  style={{ padding: '10px 16px' }}
                >
                  ⭐ Rate
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tags */}
          {workout.tags?.length > 0 && (
            <motion.div {...fadeUp(0.1)} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tags</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {workout.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
              </div>
            </motion.div>
          )}

          {/* Target muscles */}
          {workout.targetMuscles?.length > 0 && (
            <motion.div {...fadeUp(0.12)} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Target Muscles</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {workout.targetMuscles.map(m => (
                  <span key={m} style={{
                    background: `${catColor}18`, color: catColor,
                    border: `1px solid ${catColor}30`,
                    borderRadius: 100, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600,
                  }}>{m}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Equipment */}
          {workout.equipment?.length > 0 && (
            <motion.div {...fadeUp(0.14)} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Equipment Needed</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {workout.equipment.map(e => (
                  <span key={e} className="tag">🏋️ {e}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Progressive overload */}
          {workout.progressiveOverload?.enabled && (
            <motion.div {...fadeUp(0.16)} style={{
              background: 'rgba(76,201,240,0.07)', border: '1px solid rgba(76,201,240,0.2)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 4, fontSize: '0.88rem' }}>
                📈 Progressive Overload Enabled
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                +{workout.progressiveOverload.incrementPercentage}% every {workout.progressiveOverload.incrementFrequency}
              </p>
            </motion.div>
          )}
        </div>

        {/* ╔════════════════════════════════╗
            ║  RIGHT COLUMN (exercises)      ║
            ╚════════════════════════════════╝ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Section Tabs */}
          {sectionTabs.length > 1 && (
            <motion.div {...fadeUp(0.08)} style={{
              display: 'flex', gap: 0,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 6, width: 'fit-content',
            }}>
              {sectionTabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  style={{
                    background: activeSection === key ? 'var(--brand)' : 'transparent',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    color: activeSection === key ? '#fff' : 'var(--text-muted)',
                    fontWeight: activeSection === key ? 700 : 500,
                    cursor: 'pointer', fontSize: '0.88rem',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {label}
                  <span style={{
                    background: activeSection === key ? 'rgba(255,255,255,0.25)' : 'var(--bg-hover)',
                    borderRadius: 100, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700,
                  }}>{count}</span>
                </button>
              ))}
            </motion.div>
          )}

          {/* Section header */}
          {currentSection && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                  {currentSection.type === 'warmup'
                    ? '🌡️ Warm-up Exercises'
                    : currentSection.type === 'cooldown'
                      ? '❄️ Cool-down Exercises'
                      : '💪 Main Exercises'}
                </h3>
                {isWorking && (
                  <span style={{
                    fontSize: '0.78rem', color: 'var(--text-muted)',
                    background: 'var(--bg-overlay)', borderRadius: 100, padding: '4px 12px',
                    border: '1px solid var(--border)',
                  }}>
                    {currentSection.exercises?.filter((_, i) => doneSet.has(`${activeSection}-${i}`)).length ?? 0}
                    /{currentSection.exercises?.length ?? 0} done
                  </span>
                )}
              </div>

              {/* Exercise list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentSection.exercises?.map((ex, i) => {
                  const key = `${activeSection}-${i}`;
                  return (
                    <ExerciseRow
                      key={i}
                      ex={ex}
                      index={i}
                      isWorking={isWorking}
                      isDone={doneSet.has(key)}
                      onDone={() => toggleDone(key)}
                    />
                  );
                })}
              </div>

              {/* All done banner */}
              {isWorking && currentSection.exercises?.every((_, i) => doneSet.has(`${activeSection}-${i}`)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginTop: 16,
                    background: 'rgba(87,204,153,0.1)',
                    border: '1px solid rgba(87,204,153,0.35)',
                    borderRadius: 14, padding: '16px 20px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🎉</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)', marginLeft: 10, fontSize: '0.95rem' }}>
                    Section complete! Move to the next one.
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── LOG MODAL ────────────────────────────────────────────── */}
      <Modal isOpen={showLogModal} onClose={() => setShowLogModal(false)} title="✅ Log Workout Completion" maxWidth={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Auto-fill hint */}
          <div style={{ background: 'rgba(76,201,240,0.08)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--accent-blue)' }}>
            ℹ️ {completionPct}% of exercises marked done · {totalExercises} exercises total
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Duration (minutes)</label>
              <input type="number" className="input" placeholder={workout.estimatedDuration}
                value={logData.duration} onChange={e => setLogData(p => ({ ...p, duration: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Calories Burned</label>
              <input type="number" className="input" placeholder={workout.caloriesBurn || 0}
                value={logData.caloriesBurned} onChange={e => setLogData(p => ({ ...p, caloriesBurned: e.target.value }))} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">How was your session?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['terrible', 'bad', 'okay', 'good', 'great'].map(mood => (
                <button key={mood} onClick={() => setLogData(p => ({ ...p, mood }))} style={{
                  flex: 1, padding: '9px 4px', borderRadius: 10,
                  border: `1px solid ${logData.mood === mood ? 'var(--brand)' : 'var(--border)'}`,
                  background: logData.mood === mood ? 'rgba(230,57,70,0.15)' : 'var(--bg-overlay)',
                  cursor: 'pointer', fontSize: '0.74rem',
                  color: logData.mood === mood ? 'var(--brand)' : 'var(--text-muted)',
                  fontWeight: logData.mood === mood ? 700 : 400, transition: 'all 0.18s',
                }}>{mood}</button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Your Rating</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setLogData(p => ({ ...p, rating: n }))} style={{
                  fontSize: '1.6rem', background: 'none', border: 'none',
                  cursor: 'pointer', opacity: n <= logData.rating ? 1 : 0.25,
                  transition: 'opacity 0.15s', transform: n <= logData.rating ? 'scale(1.1)' : 'scale(1)',
                }}>⭐</button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Notes (optional)</label>
            <textarea className="input" rows={3} placeholder="Personal records? How did you feel?"
              value={logData.notes} onChange={e => setLogData(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleLogSubmit} disabled={logWorkout.isPending}
            style={{ width: '100%' }}>
            {logWorkout.isPending ? 'Logging...' : '💾 Save Workout Log'}
          </button>
        </div>
      </Modal>

      {/* ── RATE MODAL ───────────────────────────────────────────── */}
      <Modal isOpen={showRateModal} onClose={() => setShowRateModal(false)} title="⭐ Rate this Workout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '8px 0' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(p => ({ ...p, score: n }))} style={{
                fontSize: '2.4rem', background: 'none', border: 'none', cursor: 'pointer',
                opacity: n <= rating.score ? 1 : 0.2,
                transform: n <= rating.score ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }}>⭐</button>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent!'][rating.score]}
          </p>
          <div className="input-group">
            <label className="input-label">Write a Review (optional)</label>
            <textarea className="input" rows={3} placeholder="Share what you liked or disliked..."
              value={rating.review} onChange={e => setRating(p => ({ ...p, review: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={() => rateWorkout.mutate(rating)}
            disabled={rateWorkout.isPending} style={{ width: '100%' }}>
            {rateWorkout.isPending ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
