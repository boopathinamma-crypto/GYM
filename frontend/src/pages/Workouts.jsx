import { useState } from "react";

const workouts = [
  {
    id: 1,
    name: "Full Body Strength Blast",
    tag: "strength",
    level: "intermediate",
    duration: 45,
    exercises: 6,
    popularity: 98,
    description: "A comprehensive strength workout targeting all major muscle groups with compound lifts.",
    muscleGroups: ["chest", "back", "legs", "shoulders"],
    calories: 320,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Upper Body Power",
    tag: "strength",
    level: "advanced",
    duration: 50,
    exercises: 7,
    popularity: 92,
    description: "Intense upper body session focused on building raw pushing and pulling strength.",
    muscleGroups: ["chest", "back", "shoulders", "arms"],
    calories: 280,
    rating: 4.7,
  },
  {
    id: 3,
    name: "Lower Body Builder",
    tag: "strength",
    level: "beginner",
    duration: 40,
    exercises: 5,
    popularity: 85,
    description: "Foundational lower body movements for building strong legs and glutes.",
    muscleGroups: ["quads", "hamstrings", "glutes", "calves"],
    calories: 300,
    rating: 4.6,
  },
  {
    id: 4,
    name: "HIIT Cardio Shred",
    tag: "hiit",
    level: "intermediate",
    duration: 30,
    exercises: 8,
    popularity: 97,
    description: "High-intensity intervals designed to torch calories and boost cardiovascular fitness.",
    muscleGroups: ["full_body"],
    calories: 450,
    rating: 4.9,
  },
  {
    id: 5,
    name: "Tabata Inferno",
    tag: "hiit",
    level: "advanced",
    duration: 25,
    exercises: 6,
    popularity: 89,
    description: "20 seconds on, 10 seconds off — the classic Tabata protocol for maximum fat burn.",
    muscleGroups: ["full_body", "core"],
    calories: 400,
    rating: 4.7,
  },
  {
    id: 6,
    name: "Morning Cardio Flow",
    tag: "cardio",
    level: "beginner",
    duration: 35,
    exercises: 5,
    popularity: 80,
    description: "A low-impact cardio session perfect for starting your day with energy.",
    muscleGroups: ["full_body"],
    calories: 220,
    rating: 4.5,
  },
  {
    id: 7,
    name: "Endurance Run Circuit",
    tag: "cardio",
    level: "intermediate",
    duration: 60,
    exercises: 4,
    popularity: 75,
    description: "Combine running intervals with bodyweight moves for sustained cardio endurance.",
    muscleGroups: ["legs", "core"],
    calories: 380,
    rating: 4.4,
  },
  {
    id: 8,
    name: "Sun Salutation Flow",
    tag: "yoga",
    level: "beginner",
    duration: 40,
    exercises: 10,
    popularity: 88,
    description: "A calming sequence of yoga poses to improve flexibility, balance, and mindfulness.",
    muscleGroups: ["full_body", "core"],
    calories: 140,
    rating: 4.8,
  },
  {
    id: 9,
    name: "Power Yoga Sculpt",
    tag: "yoga",
    level: "intermediate",
    duration: 50,
    exercises: 12,
    popularity: 82,
    description: "Dynamic yoga flows that build strength while improving mobility and mental clarity.",
    muscleGroups: ["core", "legs", "shoulders"],
    calories: 200,
    rating: 4.6,
  },
  {
    id: 10,
    name: "Fat Burn Accelerator",
    tag: "weight loss",
    level: "intermediate",
    duration: 45,
    exercises: 8,
    popularity: 95,
    description: "A calorie-scorching mix of cardio and resistance training designed for rapid fat loss.",
    muscleGroups: ["full_body"],
    calories: 500,
    rating: 4.9,
  },
  {
    id: 11,
    name: "Lean & Toned",
    tag: "weight loss",
    level: "beginner",
    duration: 35,
    exercises: 6,
    popularity: 87,
    description: "Beginner-friendly circuit to shed fat and reveal lean muscle definition.",
    muscleGroups: ["core", "legs", "arms"],
    calories: 350,
    rating: 4.5,
  },
  {
    id: 12,
    name: "Muscle Mass Builder",
    tag: "muscle gain",
    level: "advanced",
    duration: 60,
    exercises: 8,
    popularity: 96,
    description: "Progressive overload-focused hypertrophy program for serious mass gains.",
    muscleGroups: ["chest", "back", "legs", "arms"],
    calories: 340,
    rating: 4.9,
  },
  {
    id: 13,
    name: "Bulk Up Basics",
    tag: "muscle gain",
    level: "beginner",
    duration: 45,
    exercises: 6,
    popularity: 83,
    description: "Foundational muscle-building workout using progressive overload principles.",
    muscleGroups: ["chest", "back", "shoulders"],
    calories: 290,
    rating: 4.6,
  },
  {
    id: 14,
    name: "Full Body Stretch & Recover",
    tag: "flexibility",
    level: "beginner",
    duration: 30,
    exercises: 10,
    popularity: 79,
    description: "A restorative stretching routine to improve range of motion and reduce soreness.",
    muscleGroups: ["full_body"],
    calories: 90,
    rating: 4.7,
  },
  {
    id: 15,
    name: "Mobility Mastery",
    tag: "flexibility",
    level: "intermediate",
    duration: 40,
    exercises: 12,
    popularity: 74,
    description: "Deep mobility drills for joints, hips, and spine to move better every day.",
    muscleGroups: ["hips", "spine", "shoulders"],
    calories: 110,
    rating: 4.5,
  },
  {
    id: 16,
    name: "Marathon Prep",
    tag: "endurance",
    level: "advanced",
    duration: 75,
    exercises: 5,
    popularity: 86,
    description: "Long-duration aerobic training to build the stamina needed for distance running.",
    muscleGroups: ["legs", "core"],
    calories: 600,
    rating: 4.8,
  },
  {
    id: 17,
    name: "Endurance Foundation",
    tag: "endurance",
    level: "beginner",
    duration: 45,
    exercises: 5,
    popularity: 76,
    description: "Build your aerobic base with steady-state cardio and breathing techniques.",
    muscleGroups: ["full_body"],
    calories: 310,
    rating: 4.4,
  },
];

const TAG_COLORS = {
  strength: { bg: "#1a2a1a", text: "#4ade80", border: "#2d4a2d" },
  hiit: { bg: "#2a1a1a", text: "#f87171", border: "#4a2a2a" },
  cardio: { bg: "#1a2230", text: "#60a5fa", border: "#1e3a5f" },
  yoga: { bg: "#251a2a", text: "#c084fc", border: "#3d2a4a" },
  "weight loss": { bg: "#2a2210", text: "#fbbf24", border: "#4a3a10" },
  "muscle gain": { bg: "#2a1a10", text: "#fb923c", border: "#4a2a10" },
  flexibility: { bg: "#10252a", text: "#2dd4bf", border: "#104a3a" },
  endurance: { bg: "#20201a", text: "#a3e635", border: "#3a3a10" },
};

const LEVEL_COLORS = {
  beginner: { text: "#4ade80" },
  intermediate: { text: "#fbbf24" },
  advanced: { text: "#f87171" },
};

const SORT_OPTIONS = ["Most Popular", "Highest Rated", "Shortest", "Longest", "Most Calories"];
const LEVEL_OPTIONS = ["All Levels", "Beginner", "Intermediate", "Advanced"];
const TAG_FILTERS = ["All", "strength", "cardio", "hiit", "yoga", "weight loss", "muscle gain", "flexibility", "endurance"];

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24" style={{ display: "inline", verticalAlign: "middle" }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function WorkoutCard({ workout }) {
  const tagStyle = TAG_COLORS[workout.tag] || TAG_COLORS["strength"];
  const levelStyle = LEVEL_COLORS[workout.level];

  return (
    <div style={{
      background: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "12px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      cursor: "pointer",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#58a6ff"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#30363d"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{
          fontSize: "11px",
          fontWeight: "700",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: levelStyle.text,
        }}>{workout.level}</span>
        <span style={{
          fontSize: "11px",
          padding: "3px 10px",
          borderRadius: "20px",
          background: tagStyle.bg,
          color: tagStyle.text,
          border: `1px solid ${tagStyle.border}`,
          textTransform: "capitalize",
          fontWeight: "600",
        }}>{workout.tag}</span>
      </div>

      <div>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#e6edf3", lineHeight: "1.3" }}>
          {workout.name}
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#8b949e", lineHeight: "1.5" }}>
          {workout.description}
        </p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {workout.muscleGroups.map(m => (
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

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid #21262d",
        paddingTop: "12px",
        marginTop: "4px",
      }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ fontSize: "12px", color: "#8b949e" }}>
            <span style={{ color: "#e6edf3", fontWeight: "600" }}>{workout.duration}</span> min
          </span>
          <span style={{ fontSize: "12px", color: "#8b949e" }}>
            <span style={{ color: "#e6edf3", fontWeight: "600" }}>{workout.exercises}</span> exercises
          </span>
          <span style={{ fontSize: "12px", color: "#8b949e" }}>
            <span style={{ color: "#e6edf3", fontWeight: "600" }}>{workout.calories}</span> kcal
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "#8b949e" }}>
          <StarIcon /> <span style={{ color: "#e6edf3", fontWeight: "600" }}>{workout.rating}</span>
        </span>
      </div>
    </div>
  );
}

export default function WorkoutLibrary() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [level, setLevel] = useState("All Levels");
  const [sort, setSort] = useState("Most Popular");

  const filtered = workouts
    .filter(w => {
      const matchTag = activeTag === "All" || w.tag === activeTag;
      const matchLevel = level === "All Levels" || w.level === level.toLowerCase();
      const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.tag.toLowerCase().includes(search.toLowerCase()) ||
        w.muscleGroups.some(m => m.toLowerCase().includes(search.toLowerCase()));
      return matchTag && matchLevel && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "Most Popular") return b.popularity - a.popularity;
      if (sort === "Highest Rated") return b.rating - a.rating;
      if (sort === "Shortest") return a.duration - b.duration;
      if (sort === "Longest") return b.duration - a.duration;
      if (sort === "Most Calories") return b.calories - a.calories;
      return 0;
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
        {/* Title Row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "36px", fontWeight: "800", color: "#e6edf3" }}>
              Workout Library 🏋️
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#8b949e" }}>
              {filtered.length} workouts available
            </p>
          </div>
          <button style={{
            padding: "10px 20px",
            background: "#e34c26",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "700",
            cursor: "pointer",
          }}>+ Create Workout</button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", margin: "24px 0 16px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workouts by name, tag, muscle group..."
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

        {/* Tag Filters + Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
          {TAG_FILTERS.map(tag => {
            const active = activeTag === tag;
            const tc = TAG_COLORS[tag];
            return (
              <button key={tag} onClick={() => setActiveTag(tag)} style={{
                padding: "7px 16px",
                borderRadius: "20px",
                border: active ? "none" : "1px solid #30363d",
                background: active ? (tc ? tc.text : "#e34c26") : "transparent",
                color: active ? "#0d1117" : "#8b949e",
                fontSize: "13px",
                fontWeight: active ? "700" : "500",
                cursor: "pointer",
                textTransform: "capitalize",
              }}>{tag}</button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
            <select value={level} onChange={e => setLevel(e.target.value)} style={{
              background: "#161b22", border: "1px solid #30363d", color: "#e6edf3",
              padding: "7px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
            }}>
              {LEVEL_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} style={{
              background: "#161b22", border: "1px solid #30363d", color: "#e6edf3",
              padding: "7px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
            }}>
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏋️</div>
            <h2 style={{ color: "#e6edf3", margin: "0 0 8px" }}>No workouts found</h2>
            <p style={{ color: "#8b949e", margin: 0 }}>Try changing your search or filters.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}>
            {filtered.map(w => <WorkoutCard key={w.id} workout={w} />)}
          </div>
        )}
      </div>
    </div>
  );
}
