import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, accessToken, updateUser } = useAuthStore();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // ─── User presence ──────────────────────────────────────────────────────
    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // ─── Notifications ───────────────────────────────────────────────────────
    socket.on('notification:membership', ({ type, daysLeft, message }) => {
      if (type === 'expiring') {
        toast(`⚠️ ${message}`, { duration: 8000, icon: '🏋️' });
      }
    });

    socket.on('workout:assigned', ({ workoutTitle, assignedBy }) => {
      toast.success(`New workout assigned by ${assignedBy}: ${workoutTitle}`);
    });

    socket.on('booking:confirmed', ({ bookingId }) => {
      toast.success('Your session has been confirmed by your trainer!');
    });

    socket.on('session:request', ({ member }) => {
      toast(`📅 ${member.name} requested a training session`, { duration: 6000 });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken]);

  const joinConversation = (conversationId) => {
    socketRef.current?.emit('chat:join', conversationId);
  };

  const leaveConversation = (conversationId) => {
    socketRef.current?.emit('chat:leave', conversationId);
  };

  const emitTyping = (conversationId, isTyping) => {
    socketRef.current?.emit('chat:typing', { conversationId, isTyping });
  };

  const emitWorkoutStart = (data) => {
    socketRef.current?.emit('workout:start', data);
  };

  const emitWorkoutComplete = (data) => {
    socketRef.current?.emit('workout:complete', data);
  };

  const onMessage = (handler) => {
    socketRef.current?.on('message:new', handler);
    return () => socketRef.current?.off('message:new', handler);
  };

  const onTyping = (handler) => {
    socketRef.current?.on('chat:typing', handler);
    return () => socketRef.current?.off('chat:typing', handler);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      joinConversation,
      leaveConversation,
      emitTyping,
      emitWorkoutStart,
      emitWorkoutComplete,
      onMessage,
      onTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
