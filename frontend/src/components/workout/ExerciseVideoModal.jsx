import { motion, AnimatePresence } from 'framer-motion';
import { EXERCISE_DB } from '../../data/exerciseData';

/**
 * ExerciseVideoModal
 * Shows a YouTube embed + exercise details when user clicks any exercise name.
 * Props:
 *   exercise  {string}  - name of the exercise
 *   onClose   {fn}      - close handler
 */
export default function ExerciseVideoModal({ exercise, onClose }) {
    if (!exercise) return null;

    const data = EXERCISE_DB[exercise] || {
        yt: null,
        muscle: 'Full Body',
        equipment: 'Various',
        tips: 'Focus on form and controlled movement.',
    };

    const ytUrl = data.yt
        ? `https://www.youtube.com/embed/${data.yt}?autoplay=1&mute=0&rel=0&modestbranding=1`
        : null;

    const muscleColor = {
        Chest: '#e63946', Back: '#4cc9f0', Biceps: '#57cc99',
        Triceps: '#ff6b35', Quads: '#ffd60a', Hamstrings: '#b5179e',
        Shoulders: '#3a86ff', Traps: '#06d6a0',
    };
    const accent = Object.entries(muscleColor).find(([k]) => data.muscle?.includes(k))?.[1] || '#e63946';

    return (
        <AnimatePresence>
            {exercise && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 9000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 20,
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.88, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.88, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-elevated)',
                            border: `1px solid ${accent}40`,
                            borderRadius: 20,
                            width: '100%',
                            maxWidth: 720,
                            overflow: 'hidden',
                            boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px ${accent}20`,
                        }}
                    >
                        {/* ── Header ──────────────────────────────────────────────── */}
                        <div style={{
                            background: `linear-gradient(135deg, ${accent}22, transparent)`,
                            borderBottom: `1px solid ${accent}25`,
                            padding: '18px 22px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <div>
                                <h2 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>
                                    {exercise}
                                </h2>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: `${accent}20`, color: accent,
                                        border: `1px solid ${accent}40`,
                                        borderRadius: 100, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700,
                                    }}>💪 {data.muscle}</span>
                                    <span style={{
                                        background: 'var(--bg-overlay)', color: 'var(--text-muted)',
                                        borderRadius: 100, padding: '3px 12px', fontSize: '0.75rem',
                                        border: '1px solid var(--border)',
                                    }}>🏋️ {data.equipment}</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >×</button>
                        </div>

                        {/* ── YouTube Video ────────────────────────────────────────── */}
                        <div style={{
                            position: 'relative', paddingBottom: '56.25%', /* 16:9 */
                            background: '#000',
                        }}>
                            {ytUrl ? (
                                <iframe
                                    src={ytUrl}
                                    title={`${exercise} tutorial`}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    style={{
                                        position: 'absolute', top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        border: 'none',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #111, #1a1a2e)',
                                    gap: 16,
                                }}>
                                    <div style={{ fontSize: '4rem' }}>🎬</div>
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
                                        Video not available.<br />Search on YouTube for "{exercise} exercise tutorial"
                                    </p>
                                    <a
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise + ' exercise tutorial')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            background: '#ff0000', color: '#fff', padding: '9px 20px',
                                            borderRadius: 8, fontWeight: 700, fontSize: '0.85rem',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        ▶ Search on YouTube
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* ── Tips ─────────────────────────────────────────────────── */}
                        <div style={{ padding: '16px 22px' }}>
                            <div style={{
                                background: `${accent}0f`,
                                border: `1px solid ${accent}25`,
                                borderRadius: 12, padding: '12px 16px',
                                display: 'flex', gap: 10, alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
                                <div>
                                    <span style={{ fontWeight: 700, color: accent, fontSize: '0.82rem', display: 'block', marginBottom: 3 }}>
                                        PRO TIP
                                    </span>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                                        {data.tips}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex', gap: 10, marginTop: 14,
                            }}>
                                <a
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise + ' exercise form tutorial')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        background: '#ff0000', color: '#fff', padding: '10px', borderRadius: 10,
                                        fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                                    }}
                                >
                                    ▶ More Videos
                                </a>
                                <button
                                    onClick={onClose}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: 10,
                                        background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                                        color: 'var(--text-muted)', cursor: 'pointer',
                                        fontWeight: 600, fontSize: '0.85rem',
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
