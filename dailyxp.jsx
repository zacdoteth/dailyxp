import { useState, useEffect, useCallback, useRef } from "react";
import { Moon, Sun, PenLine, Brain, StretchHorizontal, Footprints, Beef, Flame, Dumbbell, Star, Trophy, ChevronDown, ChevronUp, X, Plus, Sparkles, Zap, Target, TrendingUp, Check } from "lucide-react";

// ═══════════════════════════════════════════════════
// DAILYXP — LIFE IS MORE FUN AS A VIDEO GAME
// Lucide icons · Anadol aurora · Glass depth · Gold XP
// ═══════════════════════════════════════════════════

const STORAGE_KEY = "dailyxp-v3";

const P = {
  void: "#050509",
  surface: "rgba(255,255,255,0.025)",
  surfaceActive: "rgba(245,180,60,0.04)",
  border: "rgba(255,255,255,0.055)",
  borderActive: "rgba(245,166,35,0.25)",
  gold: "#E8A838",
  goldBright: "#FFC857",
  emerald: "#3DD68C",
  rose: "#E8587A",
  indigo: "#7B61FF",
  cyan: "#38BDF8",
  text1: "#EDE9E0",
  text2: "#706B80",
  text3: "#3E3A4C",
  text4: "#252230",
};

// Icon registry — maps quest id to Lucide component
const ICON_MAP = {
  sleep: Moon,
  wake: Sun,
  journal: PenLine,
  meditate: Brain,
  stretch: StretchHorizontal,
  steps: Footprints,
  protein: Beef,
  calories: Flame,
  workout: Dumbbell,
};
const FALLBACK_ICON = Star;

const QuestIcon = ({ questId, size = 16, color }) => {
  const Icon = ICON_MAP[questId] || FALLBACK_ICON;
  return <Icon size={size} color={color || P.text2} strokeWidth={1.5} />;
};

const DEFAULT_QUESTS = [
  { id: "sleep", label: "Sleep on time", points: 1, cat: "rest" },
  { id: "wake", label: "Wake on time", points: 1, cat: "rest" },
  { id: "journal", label: "Journal", points: 1, cat: "mind" },
  { id: "meditate", label: "Meditate", points: 1, cat: "mind" },
  { id: "stretch", label: "Stretch", points: 1, cat: "body" },
  { id: "steps", label: "10K steps", points: 1, cat: "body" },
  { id: "protein", label: "Hit protein", points: 1, cat: "fuel" },
  { id: "calories", label: "Hit calories", points: 1, cat: "fuel" },
  { id: "workout", label: "Workout", points: 2, cat: "body" },
];

const LEVELS = [
  { name: "NPC", min: 0, col: "#555" },
  { name: "ROOKIE", min: 50, col: "#3DD68C" },
  { name: "GRINDER", min: 150, col: "#38BDF8" },
  { name: "WARRIOR", min: 350, col: "#7B61FF" },
  { name: "ELITE", min: 600, col: "#E8587A" },
  { name: "LEGEND", min: 1000, col: "#E8A838" },
  { name: "MYTHIC", min: 1500, col: "#FFC857" },
  { name: "GOD MODE", min: 2500, col: "#fff" },
];

const getToday = () => new Date().toISOString().split("T")[0];
const getWeekId = (ds) => {
  const d = new Date(ds + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split("T")[0];
};
const getWeekDates = (wid) => {
  const out = [];
  const s = new Date(wid + "T12:00:00");
  for (let i = 0; i < 7; i++) {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    out.push(d.toISOString().split("T")[0]);
  }
  return out;
};
const dayName = (ds) => ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date(ds+"T12:00:00").getDay()];
const dayNum = (ds) => new Date(ds+"T12:00:00").getDate();
const getLevel = (xp) => { let l = LEVELS[0]; for (const v of LEVELS) if (xp >= v.min) l = v; return l; };
const getNextLevel = (xp) => { for (const v of LEVELS) if (xp < v.min) return v; return null; };

const getStreak = (days) => {
  let streak = 0;
  let d = new Date();
  let ds = getToday();
  let dd = days[ds] || {};
  if (!Object.values(dd).some(v => v)) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    ds = d.toISOString().split("T")[0];
    dd = days[ds] || {};
    if (!Object.values(dd).some(v => v)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

const calcDayScore = (days, quests, dt) => {
  const d = days[dt] || {};
  return quests.reduce((s, q) => s + (d[q.id] ? q.points : 0), 0);
};
const calcWeekScore = (days, quests, weekId) => {
  let s = 0;
  getWeekDates(weekId).forEach(dt => {
    const d = days[dt] || {};
    quests.forEach(q => { if (d[q.id]) s += q.points; });
  });
  return s;
};

export default function DailyXP() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("today");
  const [floats, setFloats] = useState([]);
  const [showHS, setShowHS] = useState(false);
  const [hsVal, setHsVal] = useState(0);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [newQ, setNewQ] = useState({ label: "", points: 1 });
  const fid = useRef(0);
  const mnt = useRef(true);

  useEffect(() => { mnt.current = true; load(); return () => { mnt.current = false; }; }, []);

  const makeInit = () => ({
    quests: DEFAULT_QUESTS, days: {},
    weekHigh: 0, allTimeHigh: 0, totalXP: 0,
    hsCelebratedWeek: null,
  });

  const load = async () => {
    try {
      const r = await window.storage.get(STORAGE_KEY);
      if (r?.value) setData(JSON.parse(r.value));
      else { const i = makeInit(); setData(i); await window.storage.set(STORAGE_KEY, JSON.stringify(i)); }
    } catch { setData(makeInit()); }
    setLoading(false);
  };

  const save = async (nd) => {
    setData(nd);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(nd)); } catch {}
  };

  const maxDaily = data ? data.quests.reduce((s, q) => s + q.points, 0) : 10;

  const toggle = useCallback((qid, e) => {
    if (!data) return;
    const today = getToday();
    const dd = data.days[today] || {};
    const was = dd[qid] || false;
    const quest = data.quests.find(q => q.id === qid);
    const newDays = { ...data.days, [today]: { ...dd, [qid]: !was } };
    let totalXP = 0;
    Object.entries(newDays).forEach(([, d]) => { data.quests.forEach(q => { if (d[q.id]) totalXP += q.points; }); });
    const ws = calcWeekScore(newDays, data.quests, getWeekId(today));
    const ds = calcDayScore(newDays, data.quests, today);
    const thisWeek = getWeekId(today);
    const shouldCelebrate = !was && data.weekHigh > 0 && data.hsCelebratedWeek !== thisWeek && ws > data.weekHigh;
    if (shouldCelebrate) { setHsVal(ws); setShowHS(true); setTimeout(() => { if (mnt.current) setShowHS(false); }, 3500); }
    if (ds >= maxDaily && !was) { setPerfectFlash(true); setTimeout(() => setPerfectFlash(false), 2400); }
    if (!was && e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const id = fid.current++;
      setFloats(p => [...p, { id, x: rect.right - 50, y: rect.top + 8, pts: quest.points }]);
      setTimeout(() => { if (mnt.current) setFloats(p => p.filter(f => f.id !== id)); }, 900);
    }
    save({ ...data, days: newDays, totalXP, weekHigh: Math.max(data.weekHigh, ws), allTimeHigh: Math.max(data.allTimeHigh, ws), hsCelebratedWeek: shouldCelebrate ? thisWeek : data.hsCelebratedWeek });
  }, [data, maxDaily]);

  if (loading) return (
    <div style={{ background: P.void, height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Syne',sans-serif", color: P.gold, fontSize: 13, letterSpacing: 6, animation: "pulse 1.5s infinite" }}>LOADING...</div>
    </div>
  );
  if (!data) return null;

  const today = getToday();
  const dd = data.days[today] || {};
  const todayScore = calcDayScore(data.days, data.quests, today);
  const weekScore = calcWeekScore(data.days, data.quests, getWeekId(today));
  const maxWeek = maxDaily * 7;
  const level = getLevel(data.totalXP);
  const next = getNextLevel(data.totalXP);
  const lvlPct = next ? (data.totalXP - level.min) / (next.min - level.min) : 1;
  const streak = getStreak(data.days);
  const pct = maxDaily > 0 ? todayScore / maxDaily : 0;
  const ringCol = pct >= 1 ? P.emerald : pct >= 0.6 ? P.gold : P.rose;

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: P.void, overflowX: "hidden" }}>
      {/* Aurora */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", width: 400, height: 400, top: "-10%", left: "-5%", background: `radial-gradient(circle,${P.indigo} 0%,transparent 70%)`, animation: "od1 25s ease-in-out infinite", opacity: 0.12 + pct * 0.08 }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", width: 350, height: 350, top: "30%", right: "-10%", background: `radial-gradient(circle,${P.rose} 0%,transparent 70%)`, animation: "od2 30s ease-in-out infinite", opacity: 0.08 + pct * 0.06 }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", width: 300, height: 300, bottom: "5%", left: "20%", background: `radial-gradient(circle,${P.cyan} 0%,transparent 70%)`, animation: "od3 22s ease-in-out infinite", opacity: 0.07 + pct * 0.05 }} />
      </div>

      {/* Grain */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.25, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`, backgroundSize: 128 }} />

      {/* Float scores */}
      {floats.map(f => (
        <div key={f.id} style={{ position: "fixed", zIndex: 50, left: f.x, top: f.y, fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700, color: P.goldBright, textShadow: `0 0 16px ${P.gold}66`, animation: "floatUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards", pointerEvents: "none" }}>+{f.pts}</div>
      ))}

      {perfectFlash && <div style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none", background: `radial-gradient(circle at 50% 40%,${P.gold}22 0%,transparent 70%)`, animation: "perfectFlash 2.4s ease-out forwards" }} />}

      {/* Achievement Toast */}
      {showHS && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 60, animation: "toastIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards", width: "calc(100% - 32px)", maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(18,16,26,0.94)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${P.borderActive}`, borderRadius: 14, padding: "12px 16px", boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,168,56,0.06)` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(232,168,56,0.1)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={18} color={P.gold} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, color: P.text1 }}>New Weekly High Score</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, color: P.text2, marginTop: 1 }}>You beat your previous best</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: P.gold, flexShrink: 0 }}>{hsVal}</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 440, margin: "0 auto", padding: "env(safe-area-inset-top, 0px) 20px calc(env(safe-area-inset-bottom, 0px) + 48px)" }}>
        {/* Header */}
        <header style={{ textAlign: "center", paddingTop: 40, paddingBottom: 8 }}>
          <h1 style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: P.text1, letterSpacing: -1 }}>DAILY</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: P.gold, letterSpacing: -1 }}>XP</span>
          </h1>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 300, letterSpacing: 3, color: P.text3, marginTop: 8 }}>life is more fun as a video game</p>
        </header>

        {/* Level + Streak */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: level.col, display: "inline-block", boxShadow: `0 0 8px ${level.col}44` }} />
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 2, color: P.text1 }}>{level.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.text2 }}>{data.totalXP} xp</span>
          </div>
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(232,168,56,0.08)", borderRadius: 20, padding: "5px 12px 5px 8px", border: "1px solid rgba(232,168,56,0.12)" }}>
              <Zap size={13} color={P.gold} strokeWidth={2} fill={P.gold} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: P.gold }}>{streak}</span>
            </div>
          )}
        </div>

        {/* XP bar */}
        <div style={{ height: 3, background: P.text4, borderRadius: 2, overflow: "hidden", position: "relative", marginBottom: 4 }}>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 2, background: level.col, width: `${lvlPct * 100}%`, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </div>
        {next && <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 10, color: P.text3, textAlign: "right", marginBottom: 20 }}>{next.min - data.totalXP} xp to <span style={{ color: next.col, fontWeight: 700 }}>{next.name}</span></div>}

        {/* Nav */}
        <nav style={{ display: "flex", gap: 2, background: P.surface, borderRadius: 12, padding: 3, marginBottom: 28 }}>
          {["today","week","config"].map(k => (
            <button key={k} onClick={() => { if (k === "config") setEditQ(data.quests.map(q => ({...q}))); setView(k); }} style={{
              flex: 1, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500,
              color: view === k ? P.text1 : P.text2,
              background: view === k ? "rgba(255,255,255,0.06)" : "transparent",
              border: "none", borderRadius: 10, padding: "10px 0", cursor: "pointer",
              transition: "all 0.25s ease",
              boxShadow: view === k ? "0 1px 8px rgba(0,0,0,0.3)" : "none",
            }}>
              {k === "today" ? "Today" : k === "week" ? "Week" : "Config"}
            </button>
          ))}
        </nav>

        {/* ═══ TODAY ═══ */}
        {view === "today" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            {/* Ring */}
            <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: -24, borderRadius: "50%", background: ringCol, filter: "blur(40px)", opacity: 0.06 + pct * 0.14, transition: "opacity 0.8s ease" }} />
              <svg viewBox="0 0 120 120" width="140" height="140">
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={ringCol} />
                    <stop offset="100%" stopColor={pct >= 1 ? P.cyan : P.goldBright} />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke={P.text4} strokeWidth="4.5" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#rg)" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={`${pct * 327} 327`} transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.34,1.56,0.64,1)" }} />
              </svg>
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 42, fontWeight: 800, color: P.text1, lineHeight: 1 }}>{todayScore}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: P.text3, marginTop: 2 }}>of {maxDaily}</div>
              </div>
            </div>
            {pct >= 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                <Sparkles size={13} color={P.gold} strokeWidth={1.5} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: P.gold, animation: "glowPulse 2.5s ease-in-out infinite" }}>PERFECT DAY</span>
                <Sparkles size={13} color={P.gold} strokeWidth={1.5} />
              </div>
            )}
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: P.text3, textAlign: "center", letterSpacing: 1, marginBottom: 28 }}>{dayName(today)} · {today}</div>

            {/* Quests */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 28 }}>
              {data.quests.map((q, i) => {
                const done = dd[q.id] || false;
                return (
                  <button key={q.id} onClick={e => toggle(q.id, e)} style={{
                    position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: done ? P.surfaceActive : P.surface,
                    border: `1px solid ${done ? P.borderActive : P.border}`,
                    borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                    fontFamily: "'Outfit',sans-serif", color: P.text1, width: "100%", textAlign: "left",
                    overflow: "hidden", animation: "fadeUp 0.4s ease both",
                    animationDelay: `${i * 40}ms`, WebkitTapHighlightColor: "transparent",
                  }}>
                    {done && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2.5, background: `linear-gradient(180deg,${P.gold},${P.goldBright})`, borderRadius: "14px 0 0 14px" }} />}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        border: done ? `1.5px solid ${P.gold}` : `1.5px solid ${P.text3}`,
                        background: done ? P.gold : "transparent",
                        transition: "all 0.25s ease",
                        ...(done ? { animation: "checkBounce 0.35s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: `0 0 10px ${P.gold}33` } : {}),
                      }}>
                        {done && <Check size={13} color={P.void} strokeWidth={2.5} />}
                      </div>
                      <div style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: done ? 0.5 : 0.6 }}>
                        <QuestIcon questId={q.id} size={16} color={done ? P.gold : P.text2} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 400, color: done ? P.text2 : P.text1, transition: "color 0.25s ease" }}>{q.label}</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: done ? P.gold : P.text3, transition: "color 0.25s ease" }}>+{q.points}</div>
                  </button>
                );
              })}
            </div>

            {/* Week bar */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 500, color: P.text2 }}>This week</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: P.text1 }}>{weekScore}<span style={{ fontSize: 13, fontWeight: 400, color: P.text3 }}> / {maxWeek}</span></span>
              </div>
              <div style={{ height: 3, background: P.text4, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg,${P.indigo},${P.gold},${P.emerald})`, width: `${Math.min(100, (weekScore / maxWeek) * 100)}%`, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Trophy size={10} color={P.text3} strokeWidth={1.5} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: P.text3, letterSpacing: 1 }}>Best: {data.weekHigh}</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ WEEK ═══ */}
        {view === "week" && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: P.text1 }}>Weekly Scoreboard</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Trophy size={12} color={P.gold} strokeWidth={1.5} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: P.gold }}>{data.allTimeHigh}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 5, marginBottom: 20, alignItems: "flex-end" }}>
              {getWeekDates(getWeekId(today)).map(dt => {
                const sc = calcDayScore(data.days, data.quests, dt);
                const p = maxDaily > 0 ? sc / maxDaily : 0;
                const isT = dt === today;
                const isFut = dt > today;
                return (
                  <div key={dt} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: isFut ? 0.2 : 1 }}>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: 1, color: isT ? P.text1 : P.text3 }}>{dayName(dt)}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 500, color: isT ? P.gold : P.text2 }}>{dayNum(dt)}</div>
                    <div style={{ width: "100%", height: 100, background: P.surface, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "flex-end", border: `1px solid ${isT ? P.borderActive : P.border}` }}>
                      <div style={{
                        width: "100%", minHeight: 2, borderRadius: "0 0 7px 7px",
                        height: `${p * 100}%`,
                        background: p >= 1 ? `linear-gradient(0deg,${P.emerald},${P.cyan})` : p >= 0.6 ? `linear-gradient(0deg,${P.gold},${P.goldBright})` : p > 0 ? `linear-gradient(0deg,${P.rose},${P.indigo})` : "transparent",
                        boxShadow: p >= 1 ? `0 0 10px ${P.emerald}33` : "none",
                        transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                      }} />
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: p >= 1 ? P.emerald : P.text2 }}>{sc}</div>
                    {p >= 1 && <Sparkles size={11} color={P.gold} strokeWidth={1.5} />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, padding: "18px 0", marginBottom: 20, background: P.surface, borderRadius: 16, border: `1px solid ${P.border}` }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 44, fontWeight: 800, color: P.gold, lineHeight: 1, textShadow: `0 0 32px ${P.gold}18` }}>{weekScore}</div>
              <div style={{ width: 1, height: 28, background: P.text4, margin: "0 4px" }} />
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 300, color: P.text3 }}>{maxWeek}</div>
            </div>

            {/* Rates */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 16, padding: "18px 16px" }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: 2, color: P.text3, marginBottom: 14, textTransform: "uppercase" }}>Completion Rate</div>
              {data.quests.map(q => {
                const wd = getWeekDates(getWeekId(today)).filter(d => d <= today);
                const c = wd.filter(d => (data.days[d] || {})[q.id]).length;
                const r = wd.length > 0 ? c / wd.length : 0;
                const col = r >= 0.8 ? P.emerald : r >= 0.5 ? P.gold : P.rose;
                return (
                  <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
                      <QuestIcon questId={q.id} size={14} color={P.text2} />
                    </div>
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, color: P.text2, width: 85, flexShrink: 0 }}>{q.label}</span>
                    <div style={{ flex: 1, height: 3, background: P.text4, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: col, width: `${r * 100}%`, transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, width: 34, textAlign: "right", color: col }}>{Math.round(r * 100)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CONFIG ═══ */}
        {view === "config" && editQ && (
          <div style={{ animation: "fadeUp 0.35s ease both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: P.text1 }}>Configure</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: P.text2 }}>{editQ.reduce((s, q) => s + q.points, 0)} pts/day</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 20 }}>
              {editQ.map(q => (
                <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <QuestIcon questId={q.id} size={15} color={P.text2} />
                  </div>
                  <span style={{ flex: 1, fontFamily: "'Outfit',sans-serif", fontSize: 13, color: P.text1 }}>{q.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => setEditQ(editQ.map(x => x.id === q.id ? { ...x, points: Math.max(1, x.points - 1) } : x))} style={btnStyle}><ChevronDown size={14} /></button>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: P.gold, width: 18, textAlign: "center" }}>{q.points}</span>
                    <button onClick={() => setEditQ(editQ.map(x => x.id === q.id ? { ...x, points: Math.min(5, x.points + 1) } : x))} style={btnStyle}><ChevronUp size={14} /></button>
                  </div>
                  <button onClick={() => setEditQ(editQ.filter(x => x.id !== q.id))} style={{ ...btnStyle, borderColor: "rgba(232,88,122,0.15)", color: P.rose }}><X size={13} /></button>
                </div>
              ))}
            </div>

            {/* Add */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, padding: 14, background: P.surface, border: `1px dashed ${P.border}`, borderRadius: 14 }}>
              <input placeholder="New quest..." value={newQ.label} onChange={e => setNewQ({ ...newQ, label: e.target.value })} maxLength={24} style={inputStyle} />
              <select value={newQ.points} onChange={e => setNewQ({ ...newQ, points: Number(e.target.value) })} style={selectStyle}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}pt</option>)}
              </select>
              <button onClick={() => {
                if (!newQ.label.trim()) return;
                setEditQ([...editQ, { id: newQ.label.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now(), label: newQ.label, points: newQ.points, cat: "custom" }]);
                setNewQ({ label: "", points: 1 });
              }} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(232,168,56,0.08)", border: `1px solid rgba(232,168,56,0.2)`, borderRadius: 8, padding: "9px 14px", color: P.gold, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Add
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <button onClick={() => { save({ ...data, quests: editQ }); setEditQ(null); setView("today"); }} style={{ flex: 2, background: `linear-gradient(135deg,rgba(61,214,140,0.1),rgba(56,189,248,0.08))`, border: `1px solid rgba(61,214,140,0.2)`, borderRadius: 14, padding: 14, color: P.emerald, fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Save config</button>
              <button onClick={() => { setEditQ(null); setView("today"); }} style={{ flex: 1, background: "transparent", border: `1px solid ${P.border}`, borderRadius: 14, padding: 14, color: P.text3, fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>

            <button onClick={async () => {
              if (confirm("Reset ALL data? Cannot undo.")) {
                try { await window.storage.delete(STORAGE_KEY); } catch {}
                setData(makeInit()); setEditQ(null); setView("today");
              }
            }} style={{ width: "100%", background: "transparent", border: `1px solid rgba(232,88,122,0.1)`, borderRadius: 10, padding: 12, color: P.text3, fontFamily: "'Outfit',sans-serif", fontSize: 11, cursor: "pointer", letterSpacing: 1 }}>Reset all data</button>
          </div>
        )}

        <footer style={{ textAlign: "center", marginTop: 36, fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 300, letterSpacing: 2, color: P.text3, fontStyle: "italic" }}>i either do or i dont.</footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{overflow-x:hidden;-webkit-overflow-scrolling:touch}
        *::-webkit-scrollbar{display:none}
        *{-ms-overflow-style:none;scrollbar-width:none}
        html{-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}60%{opacity:1;transform:translateY(-36px) scale(1.1)}100%{opacity:0;transform:translateY(-56px) scale(0.9)}}
        @keyframes perfectFlash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
        @keyframes od1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-40px) scale(1.1)}66%{transform:translate(-20px,20px) scale(0.95)}}
        @keyframes od2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,30px) scale(1.15)}}
        @keyframes od3{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(20px,40px) scale(1.1)}80%{transform:translate(-30px,-20px) scale(0.9)}}
        @keyframes checkBounce{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes glowPulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes starPulse{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.2);opacity:1}}
        @keyframes toastIn{0%{opacity:0;transform:translateX(-50%) translateY(-20px) scale(0.95)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
      `}</style>
    </div>
  );
}

const btnStyle = {
  width: 28, height: 28, borderRadius: 8,
  border: `1px solid ${P.border}`,
  background: "transparent", color: P.text2,
  fontSize: 14, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const inputStyle = {
  flex: 1, minWidth: 100,
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${P.border}`,
  borderRadius: 8, padding: "9px 12px",
  color: P.text1, fontFamily: "'Outfit',sans-serif",
  fontSize: 13, outline: "none",
};
const selectStyle = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${P.border}`,
  borderRadius: 8, padding: "9px 8px",
  color: P.text1, fontFamily: "'Outfit',sans-serif",
  fontSize: 12, outline: "none",
};
