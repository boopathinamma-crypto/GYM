import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { authService } from '../services/api';

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');

      if (!token || provider !== 'google') {
        setStatus('invalid token');
        return;
      }

      try {
        // IMPORTANT: matches your axios interceptor
        sessionStorage.setItem('accessToken', token);

        if (setToken) {
          setToken(token);
        }

        setStatus('fetching profile');

        const { data } = await authService.getMe();

        if (setUser) {
          setUser(data.data.user);
        }

        setStatus('success');

        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    handleOAuthSuccess();
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#111',
        color: 'white',
        fontSize: '32px'
      }}
    >
      {status}
    </div>
  );
}
