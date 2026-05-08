// Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, userService } from '../services/api';
import useAuthStore from '../context/authStore';
import { useSocket } from '../context/SocketContext';

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuthStore();
  const { joinConversation, leaveConversation, onMessage, emitTyping } = useSocket();
  const qc = useQueryClient();
  const [activeConversation, setActiveConversation] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations().then(r => r.data.data.conversations),
    refetchInterval: 10000,
  });

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => userService.getTrainers().then(r => r.data.data),
    enabled: user?.role === 'member',
  });

  const sendMessage = useMutation({
    mutationFn: ({ convId, content }) => chatService.sendMessage(convId, { content }),
    onSuccess: (res) => {
      setMessages(p => [...p, res.data.data.message]);
      setMessage('');
    },
  });

  useEffect(() => {
    if (activeConversation) {
      chatService.getMessages(activeConversation._id).then(r => setMessages(r.data.data.messages));
      joinConversation(activeConversation._id);
      return () => leaveConversation(activeConversation._id);
    }
  }, [activeConversation?._id]);

  useEffect(() => {
    const off = onMessage?.((data) => {
      if (data.conversationId === activeConversation?._id) {
        setMessages(p => [...p, data.message]);
      }
      qc.invalidateQueries(['conversations']);
    });
    return off;
  }, [activeConversation?._id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openConversation = async (participantId) => {
    const res = await chatService.getOrCreateConversation(participantId);
    setActiveConversation(res.data.data.conversation);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !activeConversation) return;
    sendMessage.mutate({ convId: activeConversation._id, content: message.trim() });
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    emitTyping(activeConversation?._id, true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(activeConversation?._id, false), 1500);
  };

  const getOtherParticipant = (conv) => conv.participants?.find(p => p._id !== user?._id);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--header-h) - 48px)', gap: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)' }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Messages 💬</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {/* Existing conversations */}
          {conversations.map(conv => {
            const other = getOtherParticipant(conv);
            return (
              <button key={conv._id} onClick={() => setActiveConversation(conv)}
                style={{ width: '100%', background: activeConversation?._id === conv._id ? 'var(--bg-hover)' : 'transparent', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, transition: 'var(--transition)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, overflow: 'hidden' }}>
                  {other?.avatar?.url ? <img src={other.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : other?.name?.[0]}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{other?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage?.content || 'No messages yet'}</div>
                </div>
                {conv.unreadCount > 0 && <span style={{ background: 'var(--brand)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{conv.unreadCount}</span>}
              </button>
            );
          })}

          {/* Start chat with trainer */}
          {user?.role === 'member' && trainers.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>Trainers</div>
              {trainers.slice(0, 5).map(t => (
                <button key={t._id} onClick={() => openConversation(t._id)}
                  style={{ width: '100%', background: 'transparent', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), #4cc9f080)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{t.name?.[0]}</div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConversation ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            {(() => {
              const other = getOtherParticipant(activeConversation); return (<>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--brand),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden' }}>
                  {other?.avatar?.url ? <img src={other.avatar.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : other?.name?.[0]}
                </div>
                <div><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{other?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{other?.role}</div></div>
              </>);
            })()}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, i) => {
              const isMe = (msg.sender?._id || msg.sender) === user?._id;
              return (
                <div key={msg._id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '70%', background: isMe ? 'var(--brand)' : 'var(--bg-elevated)', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px' }}>
                    <p style={{ color: isMe ? '#fff' : 'var(--text-primary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.isDeleted ? <em style={{ opacity: 0.6 }}>Message deleted</em> : msg.content}</p>
                    <div style={{ fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
            <input className="input" value={message} onChange={handleTyping} placeholder="Type a message..." style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={!message.trim() || sendMessage.isPending}>Send →</button>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '3.5rem' }}>💬</div>
          <h3 style={{ color: 'var(--text-primary)' }}>Select a conversation</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Choose a conversation or start chatting with a trainer.</p>
        </div>
      )}
    </div>
  );
}
