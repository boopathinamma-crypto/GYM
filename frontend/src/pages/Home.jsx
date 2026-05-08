import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // ⛔ NO auto-redirect — user stays on home page and manually clicks

  const features = [
    { icon: '🤖', title: 'AI Coach', desc: 'Gemini AI creates personalized workout plans, diet plans and progress predictions.' },
    { icon: '🏋️', title: '500+ Exercises', desc: 'Full exercise library with animations, instructions and muscle targeting.' },
    { icon: '📊', title: 'Progress Tracking', desc: 'Track weight, calories, BMI and personal records with beautiful charts.' },
    { icon: '💬', title: 'Trainer Chat', desc: 'Real-time messaging with certified trainers for guidance and motivation.' },
    { icon: '📅', title: 'Class Booking', desc: 'Book Yoga, HIIT, Strength and Cardio classes with one click.' },
    { icon: '💎', title: 'Memberships', desc: 'Flexible monthly, quarterly and annual plans with premium features.' },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Members' },
    { value: '500+', label: 'Exercises' },
    { value: '50+', label: 'Expert Trainers' },
    { value: '99%', label: 'Satisfaction Rate' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px',
        background: 'rgba(13,13,20,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--brand)' }}>GYM</span>
          <span style={{ color: 'var(--text-primary)' }}>PRO</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Hi, {user?.name?.split(' ')[0]} 👋
              </span>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                className="btn btn-primary"
                style={{ padding: '10px 22px', fontWeight: 700 }}
              >
                Dashboard →
              </motion.button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 20px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                Sign In
              </button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
                className="btn btn-primary"
                style={{ padding: '9px 20px', fontWeight: 700 }}>
                Get Started
              </motion.button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 60px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(230,57,70,0.18) 0%, transparent 70%)',
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)',
            borderRadius: 100, padding: '6px 18px', marginBottom: 28,
            fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 700,
          }}>
            🚀 Production-Ready Fitness Platform
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(3.5rem, 10vw, 7rem)', lineHeight: 0.95,
            textTransform: 'uppercase', marginBottom: 24, letterSpacing: '-0.01em',
          }}>
            <span style={{ color: 'var(--text-primary)', display: 'block' }}>TRAIN</span>
            <span style={{ color: 'var(--brand)', display: 'block' }}>SMARTER.</span>
            <span style={{ color: 'var(--text-secondary)', display: 'block', opacity: 0.7 }}>WIN BIGGER.</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65 }}>
            AI-powered workout plans, real-time coaching, progress tracking, and more. Built for serious athletes.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/dashboard')}
                  style={{ padding: '15px 36px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                  Go to Dashboard →
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/workouts')}
                  style={{ padding: '15px 36px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  Browse Workouts
                </motion.button>
              </>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/register')}
                  style={{ padding: '15px 36px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                  Start Free Today →
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/login')}
                  style={{ padding: '15px 36px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  Sign In
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section style={{ padding: '60px 40px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          {stats.map(({ value, label }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--brand)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>{value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 12 }}>
            EVERYTHING YOU NEED
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
            A complete gym management platform built with the latest technology.
          </p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
          {features.map(({ icon, title, desc }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px 24px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(230,57,70,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 8, color: 'var(--text-primary)' }}>{title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', background: 'linear-gradient(135deg, rgba(230,57,70,0.12), rgba(255,107,53,0.08))', borderTop: '1px solid rgba(230,57,70,0.2)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 14 }}>
            READY TO TRANSFORM?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 30, fontSize: '1rem', maxWidth: 420, margin: '0 auto 30px' }}>
            Join thousands of members already achieving their fitness goals with GymPro.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/membership')}
                style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                💎 View Membership Plans
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/register')}
                style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                🚀 Start Your Journey
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/workouts')}
              style={{ padding: '14px 36px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
              Browse Workouts
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ padding: '28px 40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem' }}>
          <span style={{ color: 'var(--brand)' }}>GYM</span>
          <span style={{ color: 'var(--text-primary)' }}>PRO</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>© {new Date().getFullYear()} GymPro. Train Smarter. Win Bigger.</p>
        <div style={{ display: 'flex', gap: 20, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <button onClick={() => navigate('/membership')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>Membership</button>
          <button onClick={() => navigate('/workouts')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>Workouts</button>
          {!isAuthenticated && <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>Sign In</button>}
        </div>
      </footer>
    </div>
  );
}
