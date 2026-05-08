import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { bookingService } from '../services/api';
import useAuthStore from '../context/authStore';

const TYPE_COLOR = { yoga: '#b5179e', cardio: '#4cc9f0', strength: '#e63946', hiit: '#ffd60a', pilates: '#57cc99', boxing: '#ff6b35' };
const TYPE_ICON = { yoga: '🧘', cardio: '🏃', strength: '🏋️', hiit: '⚡', pilates: '🤸', boxing: '🥊' };
const STATUS_INFO = {
  confirmed: { color: '#57cc99', icon: '✅', label: 'Confirmed' },
  pending: { color: '#ffd60a', icon: '⏳', label: 'Pending' },
  cancelled: { color: '#e63946', icon: '❌', label: 'Cancelled' },
  completed: { color: '#4cc9f0', icon: '🏆', label: 'Completed' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
const isUpcoming = (d) => d && new Date(d) > new Date();

function ClassCard({ cls, onBook, booking }) {
  const color = TYPE_COLOR[cls.type] || '#e63946';
  const icon = TYPE_ICON[cls.type] || '📅';
  const spots = cls.capacity - (cls.enrolledCount || 0);
  const full = spots <= 0;
  const past = !isUpcoming(cls.startTime);
  const booked = !!booking;

  return (
    <motion.div
      whileHover={!full && !past && !booked ? { scale: 1.015, borderColor: color } : {}}
      style={{
        background: 'var(--bg-surface)', border: `1px solid ${booked ? '#57cc99' : full || past ? 'var(--border)' : `${color}30`}`,
        borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        opacity: past ? 0.65 : 1, transition: 'all 0.2s',
      }}>
      <div style={{ height: 4, background: past ? '#333' : `linear-gradient(90deg,${color},${color}70)` }} />
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 100, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700 }}>
            {icon} {cls.type ? cls.type.charAt(0).toUpperCase() + cls.type.slice(1) : 'Class'}
          </span>
          {booked && <span style={{ fontSize: '0.68rem', background: 'rgba(87,204,153,0.15)', color: '#57cc99', border: '1px solid rgba(87,204,153,0.3)', borderRadius: 100, padding: '2px 10px', fontWeight: 700 }}>✅ Booked</span>}
          {!booked && full && <span style={{ fontSize: '0.68rem', background: 'rgba(230,57,70,0.12)', color: 'var(--brand)', border: '1px solid rgba(230,57,70,0.25)', borderRadius: 100, padding: '2px 10px', fontWeight: 700 }}>FULL</span>}
          {!booked && !full && spots <= 3 && <span style={{ fontSize: '0.68rem', background: 'rgba(255,214,10,0.1)', color: '#ffd60a', border: '1px solid rgba(255,214,10,0.25)', borderRadius: 100, padding: '2px 10px', fontWeight: 700 }}>Last {spots}!</span>}
        </div>

        <h4 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.97rem', lineHeight: 1.25 }}>{cls.title}</h4>

        {cls.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {cls.description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            ['📅', fmtDate(cls.startTime)],
            ['🕐', `${fmtTime(cls.startTime)} – ${fmtTime(cls.endTime)}`],
            ['📍', cls.location || 'Main Hall'],
            ['👤', cls.trainer?.name || 'GymPro Trainer'],
          ].map(([ico, val]) => (
            <div key={ico} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ flexShrink: 0 }}>{ico}</span><span>{val}</span>
            </div>
          ))}
        </div>

        {/* Capacity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>{cls.enrolledCount || 0} enrolled</span>
            <span>{spots} left / {cls.capacity}</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 100, width: `${Math.min(100, ((cls.enrolledCount || 0) / cls.capacity) * 100)}%`, background: full ? '#e63946' : spots <= 3 ? '#ffd60a' : color, transition: 'width 0.4s' }} />
          </div>
        </div>

        {!past && (
          <button
            onClick={() => !full && !booked && onBook(cls._id)}
            disabled={full || booked}
            style={{
              width: '100%', padding: '10px', borderRadius: 10, border: 'none',
              cursor: full || booked ? 'not-allowed' : 'pointer',
              background: booked ? 'rgba(87,204,153,0.15)' : full ? 'var(--bg-hover)' : `linear-gradient(135deg,${color},${color}cc)`,
              color: booked ? '#57cc99' : full ? 'var(--text-muted)' : '#fff',
              fontWeight: 700, fontSize: '0.85rem', marginTop: 'auto', transition: 'all 0.2s',
            }}>
            {booked ? '✅ Already Booked' : full ? 'Class Full' : '📅 Book This Class'}
          </button>
        )}
        {past && <div style={{ textAlign: 'center', padding: '7px', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-overlay)', borderRadius: 8 }}>Class ended</div>}
      </div>
    </motion.div>
  );
}

function BookingRow({ booking, onCancel }) {
  const si = STATUS_INFO[booking.status] || STATUS_INFO.pending;
  const cls = booking.gymClass || {};
  const color = TYPE_COLOR[cls.type] || '#e63946';
  const canCancel = booking.status !== 'cancelled' && isUpcoming(cls.startTime);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--bg-surface)', border: `1px solid ${color}20`, borderLeft: `3px solid ${color}`, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{TYPE_ICON[cls.type] || '📅'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>{cls.title || 'Class'}</h4>
          <span style={{ background: `${si.color}18`, color: si.color, border: `1px solid ${si.color}28`, borderRadius: 100, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700 }}>
            {si.icon} {si.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>📅 {fmtDate(cls.startTime)}</span>
          <span>🕐 {fmtTime(cls.startTime)}</span>
          <span>📍 {cls.location || 'Main Hall'}</span>
        </div>
        {canCancel && (
          <button onClick={() => onCancel(booking._id)}
            style={{ marginTop: 8, background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.22)', color: 'var(--brand)', borderRadius: 8, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancel Booking
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Booking() {
  useAuthStore(); // keeps auth context active
  const qc = useQueryClient();
  const [tab, setTab] = useState('classes');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: classData = {}, isLoading: loadingClasses } = useQuery({
    queryKey: ['gym-classes', typeFilter],
    queryFn: async () => {
      const params = { limit: 60 };
      if (typeFilter) params.type = typeFilter;
      const r = await bookingService.getClasses(params);
      return r.data || {};
    },
  });

  const { data: myData = {}, isLoading: loadingMy } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const r = await bookingService.getMyBookings();
      return r.data || {};
    },
    enabled: tab === 'my',
  });

  const bookMutation = useMutation({
    mutationFn: (classId) => bookingService.createBooking({ gymClass: classId }),
    onSuccess: () => {
      toast.success('🎉 Class booked! Check My Bookings.');
      qc.invalidateQueries(['gym-classes']);
      qc.invalidateQueries(['my-bookings']);
      setTab('my');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Booking failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => bookingService.cancelBooking(id, { reason: 'User cancelled' }),
    onSuccess: () => { toast.success('Booking cancelled.'); qc.invalidateQueries(['my-bookings']); },
    onError: () => toast.error('Cancel failed'),
  });

  const allClasses = classData?.data || [];
  const myBookings = myData?.data || [];
  const bookedIds = new Set(myBookings.filter(b => b.status !== 'cancelled').map(b => b.gymClass?._id || b.gymClass));

  // Group upcoming classes by day
  const grouped = {};
  allClasses.filter(c => !c.isCancelled && isUpcoming(c.startTime)).forEach(cls => {
    const day = fmtDate(cls.startTime);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(cls);
  });
  const days = Object.entries(grouped);

  const upcoming = myBookings.filter(b => b.status !== 'cancelled' && isUpcoming(b.gymClass?.startTime));
  const history = myBookings.filter(b => b.status === 'cancelled' || !isUpcoming(b.gymClass?.startTime));

  const TYPES = ['', 'yoga', 'cardio', 'strength', 'hiit', 'pilates', 'boxing'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>

      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,3vw,2.4rem)' }}>
          CLASS BOOKING 📅
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Book gym classes and trainer sessions. Mon–Sat.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 5, width: 'fit-content' }}>
        {[['classes', '🏋️ Available Classes'], ['my', '📋 My Bookings']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === key ? 'var(--brand)' : 'transparent',
            color: tab === key ? '#fff' : 'var(--text-muted)',
            fontWeight: tab === key ? 700 : 500, fontSize: '0.86rem', transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* ── Classes tab ──────────────────────────────────────── */}
      {tab === 'classes' && (
        <>
          {/* Type pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPES.map(t => {
              const c = TYPE_COLOR[t] || '#e63946';
              return (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: '6px 16px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700,
                  border: '1px solid', cursor: 'pointer', transition: 'all 0.18s',
                  background: typeFilter === t ? (t ? `${c}20` : 'var(--brand)') : 'var(--bg-overlay)',
                  borderColor: typeFilter === t ? (t ? c : 'var(--brand)') : 'var(--border)',
                  color: typeFilter === t ? (t ? c : '#fff') : 'var(--text-secondary)',
                }}>
                  {t ? `${TYPE_ICON[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}` : '🗂️ All Types'}
                </button>
              );
            })}
          </div>

          {/* No classes */}
          {!loadingClasses && days.length === 0 && (
            <div style={{ background: 'rgba(255,214,10,0.07)', border: '1px solid rgba(255,214,10,0.25)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-yellow)', marginBottom: 8 }}>⚠️ No upcoming classes found</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', marginBottom: 12 }}>
                Classes may be expired or seed data hasn't been run yet.
              </p>
              <code style={{ background: 'var(--bg-overlay)', padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', color: 'var(--accent-green)' }}>
                cd backend && npm run seed
              </code>
            </div>
          )}

          {/* Loading skeletons */}
          {loadingClasses && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 300, background: 'var(--bg-surface)', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          )}

          {/* Grouped by day */}
          {!loadingClasses && days.map(([day, dayCls]) => (
            <div key={day}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>{day}</h3>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dayCls.length} class{dayCls.length > 1 ? 'es' : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                {dayCls.map(cls => (
                  <ClassCard key={cls._id} cls={cls}
                    booking={bookedIds.has(cls._id) ? true : null}
                    onBook={(id) => bookMutation.mutate(id)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── My Bookings tab ──────────────────────────────────── */}
      {tab === 'my' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loadingMy ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 38, height: 38, border: '3px solid var(--bg-hover)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : myBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No bookings yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 18 }}>Book a class and it will appear here.</p>
              <button className="btn btn-primary" onClick={() => setTab('classes')}>Browse Classes →</button>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📅 Upcoming</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {upcoming.map(b => <BookingRow key={b._id} booking={b} onCancel={(id) => cancelMutation.mutate(id)} />)}
                  </div>
                </div>
              )}
              {history.length > 0 && (
                <div style={{ opacity: 0.75 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📋 History</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.slice(0, 10).map(b => <BookingRow key={b._id} booking={b} onCancel={(id) => cancelMutation.mutate(id)} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}