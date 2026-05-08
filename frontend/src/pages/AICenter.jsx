// AICenter.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { DifficultyBadge, CategoryBadge, SkeletonCard } from '../components/common/PageLoader';
import useAuthStore from '../context/authStore';

export default function AICenter() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('workout');

  const { data: workoutRec, isLoading: loadingWorkout, refetch: refetchWorkout } = useQuery({
    queryKey: ['ai-workout-rec'],
    queryFn: () => userService.getAIRecommendation().then(r => r.data.data),
    enabled: false,
  });

  const { data: dietPlan, isLoading: loadingDiet, refetch: refetchDiet } = useQuery({
    queryKey: ['ai-diet-plan'],
    queryFn: () => userService.getAIDietPlan().then(r => r.data.data),
    enabled: false,
  });

  const hasProfile = user?.profile?.height && user?.profile?.weight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>AI Fitness Center 🤖</h1>
        <p style={{ color: 'var(--text-muted)' }}>Personalized recommendations powered by your fitness data.</p>
      </div>

      {!hasProfile && (
        <div style={{ background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.3)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'var(--accent-yellow)', margin: 0 }}>⚠️ Complete your profile (height, weight, goals) for better AI recommendations.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profile')}>Update Profile →</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[['workout', '💪 Workout Recs'], ['diet', '🥗 Diet Plan'], ['prediction', '📊 Progress Prediction']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '9px 20px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600,
            border: '1px solid', cursor: 'pointer', transition: 'var(--transition)',
            background: activeTab === tab ? 'var(--brand)' : 'var(--bg-overlay)',
            borderColor: activeTab === tab ? 'var(--brand)' : 'var(--border)',
            color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      {/* Workout Recommendations */}
      {activeTab === 'workout' && (
        <div>
          {!workoutRec ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🤖</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Get AI-Powered Workout Suggestions</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Our AI analyzes your BMI, fitness goals, and workout history to find the perfect workouts for you.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => refetchWorkout()} disabled={loadingWorkout}>
                {loadingWorkout ? '🤖 Analyzing...' : '✨ Get Recommendations'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Reasoning */}
              {workoutRec.reasoning?.length > 0 && (
                <div style={{ background: 'rgba(76,201,240,0.08)', border: '1px solid rgba(76,201,240,0.2)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                  <h4 style={{ color: 'var(--accent-blue)', marginBottom: 12 }}>🧠 Why these workouts?</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {workoutRec.reasoning.map((r, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent-blue)', flexShrink: 0 }}>→</span>{r}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)' }}>Recommended Workouts</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => refetchWorkout()}>↻ Refresh</button>
              </div>

              <div className="grid-auto">
                {(workoutRec.recommendations || []).map((w, i) => (
                  <motion.div key={w._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="card" style={{ padding: 18, cursor: 'pointer' }}
                    onClick={() => navigate(`/workouts/${w._id}`)}
                    whileHover={{ borderColor: 'var(--brand)', transform: 'translateY(-2px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <CategoryBadge category={w.category} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', fontWeight: 700 }}>AI Score: {w.aiScore}</span>
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>{w.title}</h4>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      <span>⏱ {w.estimatedDuration}min</span>
                      <span>🔥 {w.caloriesBurn || '?'}kcal</span>
                    </div>
                    <DifficultyBadge level={w.difficulty} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diet Plan */}
      {activeTab === 'diet' && (
        <div>
          {!dietPlan ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🥗</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Generate Your Personal Diet Plan</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Calculates your TDEE and creates a macro-balanced meal plan based on your body stats and fitness goals.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => refetchDiet()} disabled={loadingDiet || !hasProfile}>
                {loadingDiet ? '🥗 Generating...' : '✨ Generate Diet Plan'}
              </button>
              {!hasProfile && <p style={{ color: 'var(--brand)', marginTop: 12, fontSize: '0.85rem' }}>Complete your profile first</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Calorie summary */}
              <div className="grid-4">
                {[
                  ['🔥', 'Daily Calories', dietPlan.targetCalories, 'var(--brand)'],
                  ['🥩', 'Protein', `${dietPlan.macros?.protein?.grams}g`, 'var(--accent-blue)'],
                  ['🍞', 'Carbs', `${dietPlan.macros?.carbohydrates?.grams}g`, 'var(--accent-yellow)'],
                  ['🥑', 'Fat', `${dietPlan.macros?.fat?.grams}g`, 'var(--accent-green)'],
                ].map(([icon, label, val, color]) => (
                  <div key={label} className="card" style={{ padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{val}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(87,204,153,0.08)', border: '1px solid rgba(87,204,153,0.2)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--accent-green)' }}>Strategy:</strong> {dietPlan.goalAdjustment} · 💧 Hydration: {dietPlan.hydration}
                </p>
              </div>

              {/* Meal plan */}
              <div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Daily Meal Plan</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(dietPlan.mealPlan || []).map((meal, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="card" style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{meal.meal}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-overlay)', padding: '2px 8px', borderRadius: 100 }}>{meal.time}</span>
                            <span className="badge badge-orange">{meal.calories} kcal</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {meal.examples?.map(ex => <span key={ex} className="tag">{ex}</span>)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          <span>🥩 P: {meal.macros?.protein}g</span>
                          <span>🍞 C: {meal.macros?.carbs}g</span>
                          <span>🥑 F: {meal.macros?.fat}g</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="grid-2">
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>💡 Diet Tips</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(dietPlan.tips || []).map((tip, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>→</span>{tip}</li>)}
                  </ul>
                </div>
                <div className="card" style={{ padding: 20 }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>💊 Supplement Stack</h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(dietPlan.supplements || []).map((s, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent-blue)', flexShrink: 0 }}>•</span>{s}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'prediction' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>📊</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Progress Prediction</h3>
          <p style={{ color: 'var(--text-muted)' }}>Log at least 3 body measurements to unlock AI progress prediction and see your weight trend forecast.</p>
          <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => navigate('/progress')}>Log Measurements →</button>
        </div>
      )}
    </div>
  );
}
