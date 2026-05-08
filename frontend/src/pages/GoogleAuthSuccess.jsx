import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import { authService } from '../services/api';

/**
 * This page is the frontend landing point after Google OAuth.
 * Backend redirects to: /auth/google/success?token=ACCESS_TOKEN&provider=google
 *
 * We:
 *  1. Read the token from URL params
 *  2. Store it in auth store + localStorage
 *  3. Fetch the full user profile
 *  4. Redirect to /dashboard
 *  5. Clean the token out of the URL (security)
 */
export default function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setToken, setUser } = useAuthStore();
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            const token = searchParams.get('token');
            const provider = searchParams.get('provider');
            const error = searchParams.get('error');

            // ── Check for error from backend ────────────────────────────────────
            if (error) {
                const messages = {
                    google_failed: 'Google sign-in failed. Please try again.',
                    access_denied: 'You cancelled the Google sign-in.',
                    server_error: 'A server error occurred. Please try again.',
                };
                setErrorMsg(messages[error] || 'Sign-in failed. Please try again.');
                setStatus('error');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            // ── Validate token exists ────────────────────────────────────────────
            if (!token || provider !== 'google') {
                setErrorMsg('Invalid OAuth response. Please try again.');
                setStatus('error');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            try {
                // Store access token
                setToken(token);
                localStorage.setItem('accessToken', token);

                // Fetch full user profile using the new token
                const { data } = await authService.getMe();
                const user = data.data.user;

                setUser(user);
                setStatus('success');

                // Small delay so user sees the success animation
                setTimeout(() => {
                    // Clean token from URL before navigating (security best practice)
                    navigate('/dashboard', { replace: true });
                }, 1200);

            } catch (err) {
                setErrorMsg('Failed to load your profile. Please try logging in again.');
                setStatus('error');
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        };

        handleOAuthSuccess();
    }, []);

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg-base)',
            flexDirection: 'column', gap: 24, padding: 24,
        }}>
            {status === 'loading' && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: '4px solid var(--bg-hover)', borderTopColor: 'var(--brand)',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 24px',
                    }} />
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Signing you in...</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Connecting your Google account to GymPro</p>
                </motion.div>
            )}

            {status === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    style={{ textAlign: 'center' }}>
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                        style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'rgba(87,204,153,0.15)',
                            border: '3px solid var(--accent-green)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', margin: '0 auto 20px',
                        }}
                    >✓</motion.div>
                    <h2 style={{ color: 'var(--accent-green)', marginBottom: 8 }}>Welcome to GymPro!</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Redirecting to your dashboard...</p>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>😕</div>
                    <h2 style={{ color: 'var(--brand)', marginBottom: 8 }}>Sign-in Failed</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{errorMsg}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Redirecting to login...</p>
                </motion.div>
            )}
        </div>
    );
}
