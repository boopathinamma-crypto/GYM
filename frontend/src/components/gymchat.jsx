import { useState, useRef, useEffect } from "react";

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are GymPro AI, an expert personal trainer and sports nutritionist...`;

export default function GymChat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    async function send(text) {
        if (!text.trim() || loading) return;
        const userMsg = { role: "user", parts: [{ text }] };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setInput("");
        setLoading(true);

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: newMsgs,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
                })
            }
        );
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        setMessages(m => [...m, { role: "model", parts: [{ text: reply }] }]);
        setLoading(false);
    }

    return (
        <div style={{ height: 600, display: "flex", flexDirection: "column", border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ background: "#185FA5", padding: "14px 16px", color: "#fff", borderRadius: "12px 12px 0 0" }}>
                GymPro AI Coach
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        background: m.role === "user" ? "#185FA5" : "#f1f1f1",
                        color: m.role === "user" ? "#fff" : "#000",
                        padding: "9px 13px", borderRadius: 12, maxWidth: "80%", fontSize: 13, lineHeight: 1.6
                    }}>
                        {m.parts[0].text}
                    </div>
                ))}
                {loading && <div style={{ color: "#888", fontSize: 13 }}>GymPro AI is typing...</div>}
                <div ref={bottomRef} />
            </div>
            <div style={{ padding: "10px 12px", borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send(input)}
                    placeholder="Ask about workouts, diet, recovery..."
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }} />
                <button onClick={() => send(input)}
                    style={{ padding: "9px 16px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                    Send
                </button>
            </div>
        </div>
    );
}