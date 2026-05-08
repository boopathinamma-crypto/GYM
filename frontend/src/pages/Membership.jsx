import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { membershipService } from '../services/api';
import { StatCard, SkeletonCard, Modal } from '../components/common/PageLoader';

export default function Membership() {
  const qc = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processingPlan, setProcessingPlan] = useState(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: () => membershipService.getPlans().then(r => r.data.data.plans),
  });

  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => membershipService.getMyMembership().then(r => r.data.data.membership),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => membershipService.getPaymentHistory().then(r => r.data.data.payments),
  });

  const cancelMutation = useMutation({
    mutationFn: () => membershipService.cancelMembership({ reason: cancelReason }),
    onSuccess: () => { toast.success('Membership cancelled.'); setShowCancelModal(false); qc.invalidateQueries(['my-membership']); },
  });

  const handleSubscribe = async (plan) => {
    setProcessingPlan(plan._id);
    try {
      const { data } = await membershipService.initiatePayment({ planId: plan._id, method: 'razorpay' });
      const { paymentData, keyId } = data.data;

      const razorpayKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey.includes('your_key')) {
        // Demo mode: simulate payment
        toast('Demo mode: Simulating payment...', { icon: '💳' });
        await new Promise(r => setTimeout(r, 1500));
        toast.success('Demo: Membership activated!');
        setProcessingPlan(null);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'GymPro',
        description: plan.name,
        order_id: paymentData.id,
        handler: async (response) => {
          try {
            await membershipService.verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              planId: plan._id,
              method: 'razorpay',
            });
            toast.success('🎉 Membership activated!');
            qc.invalidateQueries(['my-membership', 'payment-history']);
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: 'GymPro Member' },
        theme: { color: '#e63946' },
      };

      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Razorpay SDK not loaded. Please add Razorpay script to index.html.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setProcessingPlan(null);
    }
  };

  const daysRemaining = membership ? Math.max(0, Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const progressPct = membership ? Math.max(0, Math.min(100, (daysRemaining / (membership.plan?.duration || 30)) * 100)) : 0;

  const planColors = ['#4cc9f0', '#e63946', '#ffd60a'];
  const planEmojis = ['🥉', '🥈', '🥇'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Membership 🏆</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your subscription and billing.</p>
      </div>

      {/* Current Membership */}
      {!membershipLoading && membership && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, rgba(230,57,70,0.12), rgba(255,107,53,0.08))',
            border: '1px solid rgba(230,57,70,0.3)',
            borderRadius: 'var(--radius-lg)', padding: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: '2rem' }}>🏆</span>
                <div>
                  <h2 style={{ color: 'var(--text-primary)', marginBottom: 2 }}>{membership.plan?.name || 'Active Plan'}</h2>
                  <span className={`badge ${membership.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                    {membership.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  ['Start', new Date(membership.startDate).toLocaleDateString()],
                  ['Expires', new Date(membership.endDate).toLocaleDateString()],
                  ['Days Left', `${daysRemaining} days`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Membership progress</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{daysRemaining} days left</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {membership.status === 'active' && (
                <button className="btn btn-danger btn-sm" onClick={() => setShowCancelModal(true)}>Cancel</button>
              )}
            </div>
          </div>

          {/* Features */}
          {membership.plan?.features?.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {membership.plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-green)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Plans */}
      <div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
          {membership?.status === 'active' ? 'Upgrade Your Plan' : 'Choose a Plan'}
        </h3>

        {plansLoading ? (
          <div className="grid-3"><SkeletonCard height={320} /><SkeletonCard height={320} /><SkeletonCard height={320} /></div>
        ) : (
          <div className="grid-3">
            {plans.map((plan, i) => {
              const isCurrentPlan = membership?.plan?._id === plan._id && membership?.status === 'active';
              const color = planColors[i] || '#e63946';
              const isPopular = i === 1;
              return (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: isPopular ? 'linear-gradient(135deg, rgba(230,57,70,0.1), rgba(255,107,53,0.05))' : 'var(--bg-surface)',
                    border: `1px solid ${isPopular ? color : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)', padding: 24,
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {isPopular && (
                    <div style={{
                      position: 'absolute', top: 16, right: -28, background: 'var(--brand)',
                      color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '4px 40px',
                      transform: 'rotate(45deg)', transformOrigin: 'center',
                    }}>POPULAR</div>
                  )}

                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{planEmojis[i] || '🏆'}</div>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>₹{plan.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/{plan.type}</span>
                  </div>

                  <ul style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features?.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: 2 }}>✓</span> {f}
                      </li>
                    ))}
                    {plan.trainerAccess && <li style={{ display: 'flex', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}><span style={{ color: 'var(--accent-green)' }}>✓</span> Trainer Access</li>}
                    {plan.premiumContent && <li style={{ display: 'flex', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}><span style={{ color: 'var(--accent-green)' }}>✓</span> Premium Content</li>}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="btn w-full" style={{ background: 'rgba(87,204,153,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(87,204,153,0.3)', justifyContent: 'center' }}>
                      ✓ Current Plan
                    </div>
                  ) : (
                    <button
                      className="btn btn-lg w-full"
                      onClick={() => handleSubscribe(plan)}
                      disabled={processingPlan === plan._id}
                      style={{
                        background: isPopular ? 'var(--brand)' : 'transparent',
                        color: isPopular ? '#fff' : color,
                        border: `1px solid ${color}`,
                      }}
                    >
                      {processingPlan === plan._id ? 'Processing...' : 'Subscribe Now'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>💳 Payment History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payments.map((p, i) => (
              <div key={p._id} className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: p.status === 'completed' ? 'rgba(87,204,153,0.15)' : 'rgba(230,57,70,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {p.status === 'completed' ? '✅' : '❌'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>₹{p.amount}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()} · {p.method}</div>
                  </div>
                </div>
                <span className={`badge ${p.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Membership">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-muted)' }}>We're sorry to see you go. Your access will continue until the end of your billing period.</p>
          <div className="input-group">
            <label className="input-label">Reason for cancellation (optional)</label>
            <textarea className="input" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Help us improve..." />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCancelModal(false)}>Keep Membership</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Membership'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
