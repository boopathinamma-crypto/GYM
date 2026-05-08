import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '8rem', lineHeight: 1, color: 'var(--brand)', marginBottom: 8 }}>404</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </motion.div>
    </div>
  );
}
