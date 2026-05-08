import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SIX_DAY_PLAN, WARM_UP_EXERCISES, COOL_DOWN_EXERCISES, EXERCISE_DB } from '../data/exerciseData';
import ExerciseVideoModal from '../components/workout/ExerciseVideoModal';

/* ─── helpers ────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.38, delay },
});

/* ─── ExerciseItem – clickable row ──────────────────────────── */
function ExerciseItem({ num, name, accent, onClick }) {
    const data = EXERCISE_DB[name];
    return (
        <motion.button
            whileHover={{ x: 6, backgroundColor: `${accent}12` }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onClick(name)}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10,
                background: 'transparent', border: '1px solid transparent',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${accent}30`}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
        >
            {/* Number bubble */}
            <span style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: `${accent}20`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 800,
            }}>{num}</span>

            {/* Name + muscle */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                    {name}
                </div>
                {data && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 1 }}>
                        {data.muscle} · {data.equipment}
                    </div>
                )}
            </div>

            {/* Play icon */}
            <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: `${accent}18`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', flexShrink: 0, fontWeight: 700,
            }}>▶</span>
        </motion.button>
    );
}

/* ─── WarmUpCoolDown Section ─────────────────────────────────── */
function WarmCoolSection({ type, exercises, onExerciseClick }) {
    const [open, setOpen] = useState(false);
    const isWarm = type === 'warmup';

    const config = isWarm ? {
        title: 'Warm-Up',
        subtitle: '5–10 minutes before workout',
        icon: '🌡️',
        color: '#ff6b35',
        bg: 'rgba(255,107,53,0.06)',
        border: 'rgba(255,107,53,0.25)',
        benefits: ['Increases blood flow 🩸', 'Reduces injury risk', 'Activates muscles', 'Improves flexibility'],
        timing: [
            '2 min — Jumping Jacks',
            '2 min — Arm Circles',
            '2 min — High Knees',
            '2 min — Bodyweight Squat + Push-Ups',
        ],
    } : {
        title: 'Cool-Down',
        subtitle: '5–10 minutes after workout',
        icon: '❄️',
        color: '#4cc9f0',
        bg: 'rgba(76,201,240,0.06)',
        border: 'rgba(76,201,240,0.25)',
        benefits: ['Reduces muscle soreness', 'Lowers heart rate ❤️', 'Relaxes muscles', 'Improves flexibility'],
        timing: [
            '2 min — Hamstring + Quad Stretch',
            '2 min — Child\'s Pose',
            '2 min — Forward Bend',
            '2 min — Shoulder + Neck Stretch',
        ],
    };

    return (
        <div style={{
            background: config.bg,
            border: `1px solid ${config.border}`,
            borderRadius: 16,
            overflow: 'hidden',
        }}>
            {/* Header – clickable to expand */}
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '18px 22px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    gap: 16,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: `${config.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', flexShrink: 0,
                    }}>{config.icon}</div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                            {config.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{config.subtitle}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {config.benefits.map(b => (
                            <span key={b} style={{
                                background: `${config.color}15`, color: config.color,
                                borderRadius: 100, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600,
                                border: `1px solid ${config.color}25`,
                            }}>{b}</span>
                        ))}
                    </div>
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ color: config.color, fontSize: '1.2rem', flexShrink: 0 }}
                    >▾</motion.span>
                </div>
            </button>

            {/* Expandable content */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            borderTop: `1px solid ${config.border}`,
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                        }}>
                            {/* Exercise list */}
                            <div style={{ padding: '16px 20px', borderRight: `1px solid ${config.border}` }}>
                                <div style={{ fontSize: '0.75rem', color: config.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                                    Exercises ({exercises.length})
                                </div>
                                {exercises.map((ex, i) => (
                                    <ExerciseItem key={ex} num={i + 1} name={ex} accent={config.color} onClick={onExerciseClick} />
                                ))}
                            </div>

                            {/* Timing guide */}
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ fontSize: '0.75rem', color: config.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                                    ⏱ Timing Guide
                                </div>
                                {config.timing.map((t, i) => (
                                    <div key={i} style={{
                                        display: 'flex', gap: 10, marginBottom: 10,
                                        padding: '8px 12px', borderRadius: 8,
                                        background: `${config.color}0a`,
                                        border: `1px solid ${config.color}15`,
                                    }}>
                                        <span style={{ color: config.color, fontWeight: 700, flexShrink: 0, fontSize: '0.82rem' }}>
                                            {i + 1}.
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{t}</span>
                                    </div>
                                ))}
                                <div style={{
                                    marginTop: 14, padding: '10px 14px', borderRadius: 10,
                                    background: `${config.color}10`,
                                    border: `1px solid ${config.color}25`,
                                    fontSize: '0.8rem', color: config.color, fontWeight: 600, textAlign: 'center',
                                }}>
                                    Total: 5–10 minutes
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Day Card ───────────────────────────────────────────────── */
function DayCard({ dayData, isActive, onClick }) {
    const todayIdx = new Date().getDay(); // 0=Sun
    const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const isToday = dayMap[dayData.day] === todayIdx;

    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{
                background: isActive
                    ? `linear-gradient(135deg, ${dayData.color}25, ${dayData.color}10)`
                    : 'var(--bg-surface)',
                border: `2px solid ${isActive ? dayData.color : isToday ? `${dayData.color}50` : 'var(--border)'}`,
                borderRadius: 16, padding: '16px',
                cursor: 'pointer', textAlign: 'center', width: '100%',
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            }}
        >
            {isToday && (
                <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: dayData.color, color: '#fff',
                    fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px',
                    borderRadius: 100, textTransform: 'uppercase',
                }}>TODAY</div>
            )}
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{dayData.icon}</div>
            <div style={{
                fontWeight: 800, fontSize: '0.9rem',
                color: isActive ? dayData.color : 'var(--text-primary)',
                marginBottom: 4,
            }}>{dayData.day}</div>
            <div style={{
                fontSize: '0.72rem', color: 'var(--text-muted)',
                lineHeight: 1.3,
            }}>{dayData.label}</div>
            <div style={{
                marginTop: 10, fontSize: '0.7rem',
                color: isActive ? dayData.color : 'var(--text-muted)',
                fontWeight: 600,
            }}>
                {dayData.groups.reduce((a, g) => a + g.exercises.length, 0)} exercises
            </div>
        </motion.button>
    );
}

/* ══════════════════════════════════════════════════════════════ */
export default function WorkoutPlan() {
    const navigate = useNavigate();
    const [activeDay, setActiveDay] = useState(0);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});

    const day = SIX_DAY_PLAN[activeDay];

    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const totalExercises = SIX_DAY_PLAN.reduce(
        (a, d) => a + d.groups.reduce((b, g) => b + g.exercises.length, 0), 0
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <motion.div {...fadeUp(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem' }}>
                            ← Dashboard
                        </button>
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
                        color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: 6,
                    }}>
                        🏋️ 6-DAY WORKOUT PLAN
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                        Click any exercise to watch the animation tutorial · {totalExercises} total exercises across 6 days
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => navigate('/workouts')}>
                        Browse Workouts →
                    </button>
                </div>
            </motion.div>

            {/* ── Warm-Up Section ─────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.04)}>
                <WarmCoolSection
                    type="warmup"
                    exercises={WARM_UP_EXERCISES}
                    onExerciseClick={setSelectedExercise}
                />
            </motion.div>

            {/* ── Day Selector Grid ────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.08)}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
                    Select Training Day
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                    {SIX_DAY_PLAN.map((d, i) => (
                        <DayCard
                            key={d.day}
                            dayData={d}
                            isActive={activeDay === i}
                            onClick={() => setActiveDay(i)}
                        />
                    ))}
                </div>
            </motion.div>

            {/* ── Active Day Detail ─────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeDay}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: `linear-gradient(135deg, ${day.color}12, var(--bg-surface))`,
                        border: `1px solid ${day.color}30`,
                        borderRadius: 20,
                        overflow: 'hidden',
                    }}
                >
                    {/* Day header banner */}
                    <div style={{
                        padding: '22px 28px',
                        borderBottom: `1px solid ${day.color}20`,
                        display: 'flex', alignItems: 'center', gap: 16,
                        background: `linear-gradient(135deg, ${day.color}18, transparent)`,
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: `${day.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', flexShrink: 0,
                        }}>{day.icon}</div>
                        <div>
                            <div style={{ fontSize: '0.78rem', color: day.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                                {day.day}
                            </div>
                            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                                {day.label}
                            </h2>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                                {day.groups.reduce((a, g) => a + g.exercises.length, 0)} exercises ·{' '}
                                {day.groups.length} muscle group{day.groups.length > 1 ? 's' : ''}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            {day.groups.map(g => (
                                <span key={g.name} style={{
                                    background: `${day.color}18`, color: day.color,
                                    border: `1px solid ${day.color}30`,
                                    borderRadius: 100, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700,
                                }}>{g.icon} {g.name}</span>
                            ))}
                        </div>
                    </div>

                    {/* Muscle Groups */}
                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {day.groups.map((group) => {
                            const key = `${day.day}-${group.name}`;
                            const isOpen = expandedGroups[key] !== false; // default open
                            return (
                                <div key={group.name} style={{
                                    background: 'var(--bg-elevated)',
                                    border: `1px solid ${day.color}20`,
                                    borderRadius: 16, overflow: 'hidden',
                                }}>
                                    {/* Group header */}
                                    <button
                                        onClick={() => toggleGroup(key)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between', padding: '16px 20px',
                                            background: 'transparent', border: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ fontSize: '1.4rem' }}>{group.icon}</span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
                                                    {group.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {group.exercises.length} exercises · Click any to watch tutorial
                                                </div>
                                            </div>
                                        </div>
                                        <motion.span
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ color: day.color, fontSize: '1.2rem' }}
                                        >▾</motion.span>
                                    </button>

                                    {/* Exercise grid */}
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                exit={{ height: 0 }}
                                                transition={{ duration: 0.25 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{
                                                    borderTop: `1px solid ${day.color}15`,
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                    gap: 4,
                                                    padding: '12px 16px',
                                                }}>
                                                    {group.exercises.map((ex, i) => (
                                                        <ExerciseItem
                                                            key={ex}
                                                            num={i + 1}
                                                            name={ex}
                                                            accent={day.color}
                                                            onClick={setSelectedExercise}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── Cool-Down Section ────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.12)}>
                <WarmCoolSection
                    type="cooldown"
                    exercises={COOL_DOWN_EXERCISES}
                    onExerciseClick={setSelectedExercise}
                />
            </motion.div>

            {/* ── Sunday Rest Day ──────────────────────────────────────────── */}
            <motion.div {...fadeUp(0.14)} style={{
                background: 'rgba(87,204,153,0.06)',
                border: '1px solid rgba(87,204,153,0.2)',
                borderRadius: 16, padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <div style={{ fontSize: '2.5rem' }}>😴</div>
                <div>
                    <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '1rem', marginBottom: 3 }}>
                        Sunday — Rest & Recovery
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        Rest is where muscles grow. Use Sunday for light walking, foam rolling, or yoga. Hydrate well and prioritize 7–9 hours of sleep.
                    </p>
                </div>
            </motion.div>

            {/* ── Exercise Video Modal ─────────────────────────────────────── */}
            {selectedExercise && (
                <ExerciseVideoModal
                    exercise={selectedExercise}
                    onClose={() => setSelectedExercise(null)}
                />
            )}
        </div>
    );
}
