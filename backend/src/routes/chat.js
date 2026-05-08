const express = require('express');
const router = express.Router();

router.post('/gemini', async (req, res) => {
    const { messages } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: `You are GymPro AI, an expert fitness coach and nutritionist. You help gym members with:
- Personalised workout plans (beginner/intermediate/advanced)
- Diet and nutrition advice
- Exercise form and technique
- Recovery and rest strategies
- Supplement guidance
- Motivation and goal setting
Always give practical, safe, science-based advice. Ask follow-up questions to personalise advice. Keep responses concise but complete.` }]
                    },
                    contents: history,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                })
            }
        );
        const data = await response.json();
        if (data.error) return res.status(400).json({ error: data.error.message });
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
        res.json({ reply });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;