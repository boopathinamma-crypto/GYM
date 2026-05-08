// AuthLayout.jsx
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-base)',
      }}
    >
      {/* Left panel — branding */}
      <div
        className="auth-brand-panel hidden md:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, #0a0a0f 60%, #1a0a0f)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.3,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: 40,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '5rem',
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            <span style={{ color: 'var(--brand)' }}>GYM</span>
            <span style={{ color: 'var(--text-primary)' }}>PRO</span>
          </div>

          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: 320,
              margin: '0 auto',
            }}
          >
            Your complete fitness management platform. Train smarter, not harder.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              marginTop: 48,
            }}
          >
            {[
              ['10K+', 'Members'],
              ['500+', 'Workouts'],
              ['50+', 'Trainers'],
            ].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.5rem',
                    color: 'var(--brand)',
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
              }}
            >
              <span style={{ color: 'var(--brand)' }}>GYM</span>
              <span style={{ color: 'var(--text-primary)' }}>PRO</span>
            </div>
          </div>

          {/* Form content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;