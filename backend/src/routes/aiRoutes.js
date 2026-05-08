/**
 * aiRoutes.js  —  Grok AI (xAI) powered fitness chat
 * Mount: app.use('/api/ai', require('./routes/aiRoutes'))
 * Env:   GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxx
 *        Get key: https://console.x.ai
 */

const express = require('express');
const https = require('https');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

/* ══════════════════════════════════════════════════════════════
   GROK API CALLER
   Grok uses an OpenAI-compatible REST API — no extra npm needed.
   Endpoint: POST https://api.x.ai/v1/chat/completions
══════════════════════════════════════════════════════════════ */
function callGrok(messages) {
    return new Promise((resolve, reject) => {
        const key = (process.env.GROK_API_KEY || '').trim();

        if (!key) {
            return reject(new Error('GROK_API_KEY not set'));
        }

        const body = JSON.stringify({
            model: 'grok-3-latest',          // latest Grok-3 model
            messages,
            max_tokens: 400,
            temperature: 0.7,
            stream: false,
        });

        const options = {
            hostname: 'api.x.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) return reject(new Error(json.error.message || 'Grok API error'));
                    const text = json.choices?.[0]?.message?.content?.trim();
                    if (!text) return reject(new Error('Empty response from Grok'));
                    resolve(text);
                } catch (e) {
                    reject(new Error('Failed to parse Grok response: ' + e.message));
                }
            });
        });

        req.on('error', reject);
        // Timeout after 20 seconds
        req.setTimeout(20000, () => { req.destroy(new Error('Grok request timeout')); });
        req.write(body);
        req.end();
    });
}

/* ══════════════════════════════════════════════════════════════
   SMART FALLBACK — works when Grok key is not set
══════════════════════════════════════════════════════════════ */
function smartFallback(msg) {
    const m = (msg || '').toLowerCase();

    if (m.includes('chest') || m.includes('bench') || m.includes('pec'))
        return '💪 Best Chest Exercises:\n\n• Barbell Bench Press — 4×6-10 reps\n• Incline Dumbbell Press — 3×8-12 reps\n• Cable Crossover — 3×12-15 reps\n• Push-Ups — 3×to failure\n• Dips — 3×8-12 reps\n\n💡 Tip: Control the negative, squeeze at the top for best muscle activation!';

    if (m.includes('back') || m.includes('lat') || m.includes('pull'))
        return '🔙 Best Back Exercises:\n\n• Deadlift — 4×4-6 reps (king of all)\n• Pull-Ups — 4×max reps\n• Barbell Row — 4×6-10 reps\n• Lat Pulldown — 3×10-12 reps\n• Seated Cable Row — 3×10-12 reps\n\n💡 Drive elbows toward hips, not just pull with hands!';

    if (m.includes('leg') || m.includes('squat') || m.includes('quad') || m.includes('glute'))
        return '🦵 Leg Day Workout:\n\n• Barbell Squat — 4×6-10 reps\n• Romanian Deadlift — 3×10-12 reps\n• Leg Press — 4×12-15 reps\n• Walking Lunges — 3×12 each leg\n• Leg Curl — 3×12-15 reps\n\n💡 Break parallel on squats for full glute activation!';

    if (m.includes('shoulder') || m.includes('delt') || m.includes('overhead'))
        return '🎯 Shoulder Workout:\n\n• Overhead Press — 4×6-10 reps\n• Lateral Raise — 4×12-15 reps\n• Face Pull — 3×15-20 reps\n• Arnold Press — 3×10-12 reps\n\n💡 Never skip rear delts — they fix posture and prevent injuries!';

    if (m.includes('bicep') || m.includes('tricep') || m.includes('arm') || m.includes('curl'))
        return '💪 Arm Workout:\n\n• Barbell Curl — 4×8-12 reps\n• Hammer Curl — 3×10-12 reps\n• Incline Dumbbell Curl — 3×10-12 reps\n• Triceps Pushdown — 4×10-15 reps\n• Skull Crushers — 3×8-12 reps\n\n💡 Triceps are 2/3 of your arm — train them as hard as biceps!';

    if (m.includes('protein') || m.includes('diet') || m.includes('eat') || m.includes('meal') || m.includes('nutrition') || m.includes('food'))
        return '🥗 Nutrition Guide:\n\n• Protein: 1.6–2.2g per kg bodyweight daily\n• Calories to maintain: bodyweight(kg) × 33\n• Water: 35ml per kg daily\n\n🍳 Best protein sources:\n• Chicken breast, eggs, fish\n• Greek yogurt, paneer, dal\n• Whey protein post-workout\n\n💡 Eat within 30–45 min after training!';

    if (m.includes('fat') || m.includes('weight loss') || m.includes('lose') || m.includes('slim') || m.includes('calorie') || m.includes('cardio'))
        return '🔥 Fat Loss Strategy:\n\n• 300–500 kcal daily deficit\n• 3–4 strength sessions per week\n• 2 cardio sessions (HIIT or walking)\n• Sleep 7–9 hours nightly\n• Track food with MyFitnessPal\n\n📊 Formula: Eat less + Lift weights + Cardio + Sleep = Fat loss\n\n💡 Lifting while cutting preserves muscle!';

    if (m.includes('muscle') || m.includes('bulk') || m.includes('gain') || m.includes('mass'))
        return '💪 Muscle Building:\n\n• Eat 300–500 kcal surplus\n• 2g protein per kg bodyweight\n• Train each muscle 2× per week\n• Progressive overload every week\n• Sleep 8 hours minimum\n\n🏋️ Best compound lifts:\n• Squat, Deadlift, Bench, Row, Press\n\n💡 3–6 months of consistency beats any shortcut!';

    if (m.includes('recover') || m.includes('sore') || m.includes('rest') || m.includes('sleep'))
        return '😴 Recovery Tips:\n\n• Sleep 7–9 hours every night\n• Active recovery — light walk or yoga\n• Foam roll sore muscles 5–10 min\n• Drink 3L+ water daily\n• Eat enough protein to repair muscle\n\n🧘 Best tools:\n• Cold shower after training\n• Epsom salt bath for soreness\n• 10 min stretching post-workout';

    if (m.includes('beginner') || m.includes('start') || m.includes('new'))
        return '🚀 Beginner Guide:\n\n• Start 3 days/week full-body\n• Master form before adding weight\n• Focus on compound movements:\n  → Squat, Deadlift, Push-Up, Row\n• Add reps or weight every week\n• Track every workout\n\n💡 First 3 months: consistency beats everything!';

    if (m.includes('warm') || m.includes('stretch') || m.includes('cool'))
        return '🌡️ Warm-Up (10 min):\n• 2 min jumping jacks\n• 2 min arm circles\n• 2 min high knees\n• 2 min bodyweight squats\n• 2 min light push-ups\n\n❄️ Cool-Down (5 min):\n• Hamstring stretch 45 sec\n• Child\'s pose 60 sec\n• Shoulder stretch 30 sec';

    if (m.includes('supplement') || m.includes('creatine') || m.includes('whey') || m.includes('protein powder'))
        return '💊 Supplements Guide:\n\n✅ Worth it:\n• Whey Protein — 25g post-workout\n• Creatine Monohydrate — 3–5g daily\n• Vitamin D3 — especially in winter\n• Omega-3 — reduces inflammation\n\n❌ Skip:\n• Most fat burners\n• Testosterone boosters\n• "Proprietary blend" products\n\n💡 Food first. Supplements are 10% of results.';

    if (m.includes('hiit') || m.includes('interval') || m.includes('tabata'))
        return '⚡ HIIT Workout:\n\n• 20 sec work / 10 sec rest × 8 rounds\n• Burpees → Jump Squats → High Knees → Mountain Climbers\n• Burns 25% more calories than steady cardio\n• Afterburn effect lasts 24 hours\n\n💡 Only do HIIT 2–3× per week — it needs recovery!';

    if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('help'))
        return `👋 Hey! I'm your GymPro AI Coach powered by Grok!\n\nI can help you with:\n• 🏋️ Workout plans & exercises\n• 🥗 Nutrition & meal ideas\n• 🔥 Fat loss strategies\n• 💪 Muscle building tips\n• 😴 Recovery advice\n• 💊 Supplement guidance\n\nJust ask! Try:\n"Best chest exercises?"\n"How to lose belly fat?"\n"High protein meal ideas"`;

    return `🤖 GymPro AI Coach (Grok) here!\n\nI can answer:\n• 🏋️ Workouts — chest, back, legs, shoulders, arms\n• 🥗 Nutrition — protein, calories, meal plans\n• 🔥 Fat loss — cardio, HIIT, calorie deficit\n• 💪 Muscle gain — bulking, progressive overload\n• 😴 Recovery — sleep, stretching, rest\n• 💊 Supplements — what works, what doesn't\n\nWhat's your fitness question?`;
}

/* ══════════════════════════════════════════════════════════════
   POST /api/ai/chat
══════════════════════════════════════════════════════════════ */
router.post('/chat', protect, async (req, res) => {
    const { message = '', chatHistory = [] } = req.body;

    if (!message.trim()) {
        return res.status(400).json({ status: 'fail', message: 'Message is required' });
    }

    try {
        const User = require('../models/User');
        const user = await User.findById(req.user._id).select('name profile');
        const name = user?.name?.split(' ')[0] || 'there';
        const goal = user?.profile?.fitnessGoal || 'general fitness';
        const level = user?.profile?.fitnessLevel || 'beginner';

        /* Build Grok messages array (OpenAI format) */
        const systemMessage = {
            role: 'system',
            content: `You are GymPro AI Coach, a professional fitness and nutrition assistant powered by Grok.
Member name: ${name} | Goal: ${goal} | Fitness level: ${level}
Rules:
- ONLY answer questions about fitness, workouts, nutrition, health, and wellness
- Keep replies under 200 words
- Use bullet points (•) for lists
- Be encouraging and motivating
- Address the member by their first name occasionally
- If asked about non-fitness topics, politely redirect to fitness`,
        };

        /* Include recent chat history */
        const historyMessages = chatHistory.slice(-8).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
        }));

        /* Current user message */
        const userMessage = { role: 'user', content: message.trim() };

        const messages = [systemMessage, ...historyMessages, userMessage];

        /* Try Grok first */
        let reply = null;
        let poweredBy = 'rule-based';

        try {
            reply = await callGrok(messages);
            poweredBy = 'grok';
            console.log(`[AI] Grok responded for ${name}: "${reply.slice(0, 60)}..."`);
        } catch (grokErr) {
            console.warn('[AI] Grok failed:', grokErr.message, '→ using smart fallback');
            reply = smartFallback(message);
            poweredBy = 'rule-based';
        }

        return res.json({
            status: 'success',
            data: { reply, poweredBy },
        });

    } catch (err) {
        console.error('[AI] Route error:', err.message);
        return res.json({
            status: 'success',
            data: {
                reply: smartFallback(message),
                poweredBy: 'rule-based',
            },
        });
    }
});

module.exports = router;