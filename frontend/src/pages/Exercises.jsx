import { useState } from "react";

const exercises = [
  {
    id: 1,
    name: "Treadmill Running",
    difficulty: "beginner",
    category: "cardio",
    description: "Cardio exercise on a treadmill.",
    muscles: ["quads", "calves"],
    equipment: "machine",
    instructions: [
      "Set treadmill to a comfortable pace.",
      "Step on and begin walking, then increase to a jog.",
      "Keep your back straight and arms relaxed.",
      "Maintain a steady breathing rhythm.",
      "Cool down by gradually reducing speed.",
    ],
    sets: 3,
    reps: "20 min",
    rest: "60 sec",
    tips: "Land mid-foot, not heel, for reduced impact.",
    videoUrl: null,
  },
  {
    id: 2,
    name: "Plank",
    difficulty: "beginner",
    category: "strength",
    description: "Core stability exercise.",
    muscles: ["abs", "obliques"],
    equipment: "none",
    instructions: [
      "Place forearms on the ground, elbows under shoulders.",
      "Extend legs straight back, resting on toes.",
      "Keep body in a straight line from head to heels.",
      "Engage core and hold position.",
      "Breathe steadily throughout.",
    ],
    sets: 3,
    reps: "30–60 sec",
    rest: "45 sec",
    tips: "Avoid letting hips sag or rise. Keep your neck neutral.",
    videoUrl: null,
  },
  {
    id: 3,
    name: "Burpee",
    difficulty: "intermediate",
    category: "plyometric",
    description: "Full-body HIIT exercise.",
    muscles: ["full_body"],
    equipment: "none",
    instructions: [
      "Stand with feet shoulder-width apart.",
      "Drop hands to floor and jump feet back into plank.",
      "Perform a push-up (optional).",
      "Jump feet back to hands.",
      "Explosively jump up with arms overhead.",
    ],
    sets: 4,
    reps: "10–15",
    rest: "60 sec",
    tips: "Keep your core tight during the plank phase.",
    videoUrl: null,
  },
  {
    id: 4,
    name: "Barbell Squat",
    difficulty: "intermediate",
    category: "strength",
    description: "The king of lower body exercises.",
    muscles: ["quads", "glutes"],
    equipment: "barbell",
    instructions: [
      "Position barbell across upper traps.",
      "Stand with feet slightly wider than shoulder-width.",
      "Brace core and descend by pushing hips back.",
      "Lower until thighs are parallel to the floor.",
      "Drive through heels to return to standing.",
    ],
    sets: 4,
    reps: "6–10",
    rest: "90 sec",
    tips: "Keep chest up and knees tracking over toes.",
    videoUrl: null,
  },
  {
    id: 5,
    name: "Dumbbell Curl",
    difficulty: "beginner",
    category: "strength",
    description: "Isolation exercise for biceps.",
    muscles: ["biceps"],
    equipment: "dumbbell",
    instructions: [
      "Stand upright holding a dumbbell in each hand.",
      "Keep elbows close to your torso.",
      "Curl the weights up while contracting the biceps.",
      "Pause at the top, squeeze, then lower slowly.",
      "Avoid swinging your body.",
    ],
    sets: 3,
    reps: "10–12",
    rest: "60 sec",
    tips: "Supinate wrist at the top for full bicep contraction.",
    videoUrl: null,
  },
  {
    id: 6,
    name: "Deadlift",
    difficulty: "advanced",
    category: "strength",
    description: "The ultimate full-body strength exercise.",
    muscles: ["back", "hamstrings", "glutes"],
    equipment: "barbell",
    instructions: [
      "Stand with feet hip-width apart, bar over mid-foot.",
      "Hinge at hips and grip bar just outside legs.",
      "Brace core, chest up, and push floor away.",
      "Keep bar close to body as you drive hips forward.",
      "Lower with control by hinging hips back first.",
    ],
    sets: 4,
    reps: "4–6",
    rest: "120 sec",
    tips: "Never round your lower back. Start light and progress safely.",
    videoUrl: null,
  },
  {
    id: 7,
    name: "Barbell Bench Press",
    difficulty: "intermediate",
    category: "strength",
    description: "A compound chest exercise using a barbell on a flat bench.",
    muscles: ["chest"],
    equipment: "barbell",
    instructions: [
      "Lie on flat bench with feet flat on floor.",
      "Grip bar slightly wider than shoulder-width.",
      "Unrack bar and lower it to mid-chest.",
      "Press explosively back to full extension.",
      "Keep shoulder blades retracted throughout.",
    ],
    sets: 4,
    reps: "8–10",
    rest: "90 sec",
    tips: "Keep wrists straight and drive feet into the floor for stability.",
    videoUrl: null,
  },
  {
    id: 8,
    name: "Pull-Up",
    difficulty: "intermediate",
    category: "strength",
    description: "Upper body compound movement targeting the back.",
    muscles: ["back", "lats"],
    equipment: "pull-up bar",
    instructions: [
      "Hang from bar with overhand grip, hands shoulder-width.",
      "Engage core and depress shoulder blades.",
      "Pull elbows down and back toward your hips.",
      "Drive chin above the bar.",
      "Lower with control until arms are fully extended.",
    ],
    sets: 3,
    reps: "6–10",
    rest: "90 sec",
    tips: "Avoid kipping unless training for CrossFit. Full range of motion matters.",
    videoUrl: null,
  },
  {
    id: 9,
    name: "Push-Up",
    difficulty: "beginner",
    category: "strength",
    description: "Classic bodyweight chest and tricep builder.",
    muscles: ["chest", "triceps", "shoulders"],
    equipment: "none",
    instructions: [
      "Start in high plank with hands slightly wider than shoulders.",
      "Lower body until chest nearly touches the floor.",
      "Keep elbows at 45° from torso.",
      "Press up powerfully to starting position.",
      "Keep core engaged throughout.",
    ],
    sets: 3,
    reps: "12–20",
    rest: "60 sec",
    tips: "Squeeze chest at the top. Beginners can use knees.",
    videoUrl: null,
  },
  {
    id: 10,
    name: "Lunges",
    difficulty: "beginner",
    category: "strength",
    description: "Unilateral leg exercise for balance and leg strength.",
    muscles: ["quads", "glutes", "hamstrings"],
    equipment: "none",
    instructions: [
      "Stand tall with feet together.",
      "Step one foot forward into a wide stance.",
      "Lower rear knee toward the floor.",
      "Front thigh should be parallel to the floor.",
      "Push back to starting position and alternate legs.",
    ],
    sets: 3,
    reps: "10 each leg",
    rest: "60 sec",
    tips: "Keep front knee behind your toes. Maintain upright torso.",
    videoUrl: null,
  },
  {
    id: 11,
    name: "Mountain Climber",
    difficulty: "intermediate",
    category: "cardio",
    description: "Dynamic core exercise with cardio benefits.",
    muscles: ["core", "hip flexors", "shoulders"],
    equipment: "none",
    instructions: [
      "Start in high plank position.",
      "Drive one knee toward chest rapidly.",
      "Return and immediately drive opposite knee.",
      "Alternate as fast as possible while maintaining form.",
      "Keep hips low and core tight.",
    ],
    sets: 3,
    reps: "30 sec",
    rest: "45 sec",
    tips: "Speed is secondary to keeping hips level.",
    videoUrl: null,
  },
  {
    id: 12,
    name: "Overhead Press",
    difficulty: "intermediate",
    category: "strength",
    description: "Vertical pressing movement for shoulder strength.",
    muscles: ["shoulders", "triceps", "upper back"],
    equipment: "barbell",
    instructions: [
      "Stand with barbell at shoulder height, grip just outside shoulders.",
      "Brace core and glutes.",
      "Press bar overhead to full lockout.",
      "Lower bar back to shoulder height with control.",
      "Avoid excessive lumbar extension.",
    ],
    sets: 4,
    reps: "6–10",
    rest: "90 sec",
    tips: "Push your head through at lockout. Keep ribs down.",
    videoUrl: null,
  },
];

const DIFF_COLORS = {
  beginner: { text: "#4ade80", bg: "#0d2218", border: "#14532d" },
  intermediate: { text: "#fbbf24", bg: "#271e0a", border: "#713f12" },
  advanced: { text: "#f87171", bg: "#27100a", border: "#7f1d1d" },
};

const CAT_COLORS = {
  strength: { bg: "#1a2a1a", text: "#4ade80", border: "#2d4a2d" },
  cardio: { bg: "#1a2230", text: "#60a5fa", border: "#1e3a5f" },
  plyometric: { bg: "#251a2a", text: "#c084fc", border: "#3d2a4a" },
};

const EQUIP_ICON = {
  machine: "⚙️",
  none: "🚫",
  barbell: "🏋️",
  dumbbell: "💪",
  "pull-up bar": "🔩",
};

const DIFFICULTY_OPTIONS = ["All Difficulty", "Beginner", "Intermediate", "Advanced"];
const EQUIPMENT_OPTIONS = ["All Equipment", "none", "barbell", "dumbbell", "machine", "pull-up bar"];

function ExerciseCard({ exercise, onClick }) {
  const diff = DIFF_COLORS[exercise.difficulty] || DIFF_COLORS.beginner;
  const cat = CAT_COLORS[exercise.category] || CAT_COLORS.strength;

  return (
    <div
      onClick={() => onClick(exercise)}
      style={{
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#4ade80"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#30363d"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: diff.text,
        }}>{exercise.difficulty}</span>
        <span style={{
          fontSize: "11px",
          padding: "3px 10px",
          borderRadius: "20px",
          background: cat.bg,
          color: cat.text,
          border: `1px solid ${cat.border}`,
          fontWeight: "600",
        }}>{exercise.category}</span>
      </div>

      <div>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#e6edf3" }}>
          {exercise.name}
        </h3>
        <p style={{ margin: "5px 0 0", fontSize: "13px", color: "#8b949e" }}>
          {exercise.description}
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {exercise.muscles.map(m => (
          <span key={m} style={{
            fontSize: "12px",
            padding: "3px 10px",
            borderRadius: "20px",
            background: "#0d1117",
            color: "#8b949e",
            border: "1px solid #30363d",
          }}>{m}</span>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "4px" }}>
        <span style={{ fontSize: "14px" }}>{EQUIP_ICON[exercise.equipment] || "🏋️"}</span>
        <span style={{ fontSize: "12px", color: "#8b949e" }}>{exercise.equipment}</span>
      </div>
    </div>
  );
}

function ExerciseModal({ exercise, onClose }) {
  const diff = DIFF_COLORS[exercise.difficulty] || DIFF_COLORS.beginner;
  const cat = CAT_COLORS[exercise.category] || CAT_COLORS.strength;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "24px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: diff.text }}>
                {exercise.difficulty}
              </span>
              <span style={{
                fontSize: "11px", padding: "2px 10px", borderRadius: "20px",
                background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, fontWeight: "600",
              }}>{exercise.category}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#e6edf3" }}>
              {exercise.name}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#8b949e", fontSize: "14px" }}>{exercise.description}</p>
          </div>
          <button onClick={onClose} style={{
            background: "#21262d", border: "1px solid #30363d", borderRadius: "8px",
            color: "#8b949e", fontSize: "18px", width: "36px", height: "36px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>×</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {[
            { label: "Sets", value: exercise.sets },
            { label: "Reps", value: exercise.reps },
            { label: "Rest", value: exercise.rest },
          ].map(s => (
            <div key={s.label} style={{
              background: "#0d1117", borderRadius: "10px", padding: "14px",
              textAlign: "center", border: "1px solid #21262d",
            }}>
              <div style={{ fontSize: "11px", color: "#8b949e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#e6edf3" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Muscles + Equipment */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.06em" }}>Muscles</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {exercise.muscles.map(m => (
                <span key={m} style={{
                  fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                  background: "#0d1117", color: "#8b949e", border: "1px solid #30363d",
                }}>{m}</span>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.06em" }}>Equipment</p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "18px" }}>{EQUIP_ICON[exercise.equipment] || "🏋️"}</span>
              <span style={{ fontSize: "14px", color: "#e6edf3", fontWeight: "600" }}>{exercise.equipment}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.06em" }}>How to do it</p>
          <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {exercise.instructions.map((step, i) => (
              <li key={i} style={{ fontSize: "14px", color: "#e6edf3", lineHeight: "1.6" }}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        <div style={{
          background: "#0d2218",
          border: "1px solid #14532d",
          borderRadius: "10px",
          padding: "14px 16px",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "700" }}>
            Pro Tip
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#86efac", lineHeight: "1.5" }}>{exercise.tips}</p>
        </div>
      </div>
    </div>
  );
}

export default function ExerciseLibrary() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All Difficulty");
  const [equipment, setEquipment] = useState("All Equipment");
  const [selected, setSelected] = useState(null);

  const filtered = exercises.filter(ex => {
    const matchDiff = difficulty === "All Difficulty" || ex.difficulty === difficulty.toLowerCase();
    const matchEquip = equipment === "All Equipment" || ex.equipment === equipment;
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscles.some(m => m.toLowerCase().includes(search.toLowerCase())) ||
      ex.category.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchEquip && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#e6edf3", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #21262d", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "22px", height: "16px", display: "flex", flexDirection: "column", gap: "3px", cursor: "pointer" }}>
            {[0, 1, 2].map(i => <div key={i} style={{ height: "2px", background: "#8b949e", borderRadius: "2px" }} />)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3fb950" }} />
            <span style={{ fontSize: "13px", color: "#3fb950", fontWeight: "600" }}>Live</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#21262d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </div>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e34c26", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "#fff" }}>B</div>
        </div>
      </div>

      <div style={{ padding: "40px 32px", maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "36px", fontWeight: "800", color: "#e6edf3" }}>
          Exercise Library 💪
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#8b949e" }}>
          {filtered.length} exercises with instructions and media
        </p>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "8px",
                color: "#e6edf3",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{
            background: "#161b22", border: "1px solid #30363d", color: "#e6edf3",
            padding: "12px 16px", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
          }}>
            {DIFFICULTY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={equipment} onChange={e => setEquipment(e.target.value)} style={{
            background: "#161b22", border: "1px solid #30363d", color: "#e6edf3",
            padding: "12px 16px", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
          }}>
            {EQUIPMENT_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💪</div>
            <h2 style={{ color: "#e6edf3", margin: "0 0 8px" }}>No exercises found</h2>
            <p style={{ color: "#8b949e", margin: 0 }}>Try changing your search or filters.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {filtered.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && <ExerciseModal exercise={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
