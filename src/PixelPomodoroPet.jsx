import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  Settings,
  Heart,
  X,
  Flame,
  Clock,
  Coins,
  Timer,
} from "lucide-react";

/* ───────── storage (localStorage with in-memory fallback for sandboxes) ───────── */
const KEY = "pixel-pomodoro-pet-v1";
const mem = {};
const store = {
  get() {
    try {
      const v = window.localStorage.getItem(KEY);
      if (v) return JSON.parse(v);
    } catch (e) {}
    try {
      return mem[KEY] ? JSON.parse(mem[KEY]) : null;
    } catch (e) {
      return null;
    }
  },
  set(v) {
    const s = JSON.stringify(v);
    mem[KEY] = s;
    try {
      window.localStorage.setItem(KEY, s);
    } catch (e) {}
  },
};
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const DEFAULT = {
  minutes: 0,
  sessions: 0,
  streak: 0,
  lastDay: null,
  xp: 0,
  coins: 0,
  pets: {},
  active: null,
  sound: true,
};

/* ───────── Web Audio (synthesized, no files) ───────── */
const audio = { ctx: null };
function tone(on, f, d = 0.1, type = "square", vol = 0.05, delay = 0) {
  if (!on) return;
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    audio.ctx = audio.ctx || new A();
    const c = audio.ctx;
    if (c.state === "suspended") c.resume();
    const o = c.createOscillator(),
      g = c.createGain(),
      t = c.currentTime + delay;
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + d + 0.03);
  } catch (e) {}
}
const sfx = {
  click: (on) => tone(on, 740, 0.06),
  chime: (on) =>
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(on, f, 0.24, "square", 0.05, i * 0.14),
    ),
  up: (on) =>
    [659, 880, 1175].forEach((f, i) =>
      tone(on, f, 0.14, "triangle", 0.07, i * 0.09),
    ),
};

/* ───────── pixel art: 12×12 grids, '.' = transparent ───────── */
const C = {
  o: "#3D262A",
  e: "#3D262A",
  w: "#FFFDF9",
  p: "#FFB6C1",
  g: "#7CCB92",
  y: "#F5C542",
  r: "#FF8FAB",
  c: "#3D262A",
};
const EGG = [
  "....oooo....",
  "...obbbbo...",
  "..obllbbbo..",
  "..oblbbbbo..",
  ".obbbbpbbbo.",
  ".obbbbbbbbo.",
  ".obpbbbbbbo.",
  ".obbbbbbbpo.",
  ".obbbbbbbbo.",
  "..obbbpbbo..",
  "..obbbbbbo..",
  "...oooooo...",
];
const EGG_PAL = { b: "#FFFDF9", l: "#FFFFFF", p: "#E2D4F0" };
const CRACKS = [
  [6, 2],
  [5, 3],
  [6, 4],
  [7, 5],
  [6, 6],
  [7, 7],
  [4, 6],
  [3, 5],
  [5, 8],
  [6, 9],
  [8, 8],
  [4, 9],
];
const CRACK_N = [0, 3, 8, 12];
const E = "............";
const ACC5 = ["...rr..rr...", "....rrrr...."];
const ACC10 = [
  "...y..y..y..",
  "...yyyyyyy..",
  E,
  E,
  E,
  E,
  "y..........y",
  E,
  E,
  E,
  "y..........y",
];
const PETS = [
  {
    id: "slime",
    name: "Pink Slime",
    pal: { b: "#FF9EB5", l: "#FFD6E0", p: "#FF6F91" },
    grid: [
      "............",
      "............",
      "....oooo....",
      "...obbbbo...",
      "..oblbbbbo..",
      "..obbbbbbo..",
      "..obebbebo..",
      ".obbbbbbbbo.",
      ".obpbbbbpbo.",
      ".obbbbbbbbo.",
      "..oooooooo..",
      "............",
    ],
  },
  {
    id: "bunny",
    name: "Pixel Bunny",
    pal: { b: "#FFFDF9", l: "#FFFFFF" },
    grid: [
      "..oo....oo..",
      ".obpo..obpo.",
      ".obpo..obpo.",
      "..obbbbbbo..",
      ".obbbbbbbbo.",
      ".obebbbbebo.",
      ".obbbbbbbbo.",
      ".obpbwwbpbo.",
      ".obbbbbbbbo.",
      "..obbbbbbo..",
      "...oooooo...",
      "............",
    ],
  },
  {
    id: "hamster",
    name: "Honey Hamster",
    pal: { b: "#F4C28B", l: "#FFF3DC", p: "#FF9EB5" },
    grid: [
      "............",
      "..oo....oo..",
      ".obpo..obpo.",
      "..obbbbbbo..",
      ".obbbbbbbbo.",
      ".obebbbbebo.",
      ".obbllllbbo.",
      ".obpllllpbo.",
      ".obbllllbbo.",
      "..obbbbbbo..",
      "..oooooooo..",
      "............",
    ],
  },
  {
    id: "ghost",
    name: "Strawberry Ghost",
    pal: { b: "#FF6B81", l: "#FF9AA8", p: "#FFC2CC" },
    grid: [
      "....g..g....",
      "....gggg....",
      "...oooooo...",
      "..obbbbbbo..",
      ".obbbbbbbbo.",
      ".obebbbbebo.",
      ".obebbbbebo.",
      ".obpbbbbpbo.",
      ".obbbwwbbbo.",
      ".obbbbbbbbo.",
      ".obobbobbobo",
      "..o..oo..o..",
    ],
  },
  {
    id: "cloud",
    name: "Cloud Kitten",
    pal: { b: "#DCE8FF", l: "#FFFFFF" },
    grid: [
      "............",
      ".oo......oo.",
      ".obo....obo.",
      ".obboooobbo.",
      ".obbbbbbbbo.",
      ".obebbbbebo.",
      "oobbpbbpbboo",
      "obbbbwwbbbbo",
      "obbbbbbbbbbo",
      ".oobbbbbboo.",
      "..oooooooo..",
      "............",
    ],
  },
];

function rects(grid, pal, dy = 0) {
  const out = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      const s = x;
      while (row[x] === ch) x++;
      out.push(
        <rect
          key={`${y}-${s}`}
          x={s}
          y={y + dy}
          width={x - s}
          height={1}
          fill={pal[ch] || "#000"}
        />,
      );
    }
  });
  return out;
}
const svgProps = (size) => ({
  viewBox: "0 0 12 14",
  width: size,
  height: (size * 14) / 12,
  shapeRendering: "crispEdges",
  className: "pp-pix",
  style: { imageRendering: "pixelated" },
});

function Sprite({ pet, lvl = 1, size = 96, blink, dim }) {
  const p = { ...C, ...pet.pal };
  if (blink) p.e = p.b;
  return (
    <svg
      {...svgProps(size)}
      style={{
        imageRendering: "pixelated",
        filter: dim ? "brightness(0)" : "none",
        opacity: dim ? 0.18 : 1,
      }}
      aria-hidden="true"
    >
      {rects(pet.grid, p, 2)}
      {lvl >= 5 && rects(ACC5, p)}
      {lvl >= 10 && rects(ACC10, p)}
    </svg>
  );
}
function Egg({ stage = 0, size = 140 }) {
  return (
    <svg {...svgProps(size)} aria-hidden="true">
      {rects(EGG, { ...C, ...EGG_PAL }, 2)}
      {CRACKS.slice(0, CRACK_N[stage]).map(([x, y]) => (
        <rect
          key={x + "-" + y}
          x={x}
          y={y + 2}
          width={1}
          height={1}
          fill="#3D262A"
        />
      ))}
    </svg>
  );
}

const CSS = `
.pp-root{min-height:100vh;color:#4A2E35;font-family:ui-rounded,'Nunito','Segoe UI',system-ui,sans-serif;background-color:#FFF0F5;background-image:radial-gradient(#FDE2E4 2px,transparent 2px);background-size:22px 22px}
.pp-pixel{font-family:'Courier New',ui-monospace,monospace;font-weight:900;letter-spacing:.06em}
.pp-pix{image-rendering:crisp-edges;image-rendering:pixelated}
.pp-card{background:#FFFDF9;border:3px solid #3D262A;border-radius:18px;box-shadow:4px 4px 0 #3D262A}
.pp-btn{background:#FFB6C1;color:#3D262A;border:3px solid #3D262A;border-radius:12px;box-shadow:0 4px 0 #3D262A;padding:.5rem .95rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:.4rem;cursor:pointer;transition:transform .08s,box-shadow .08s}
.pp-btn:active:not(:disabled){transform:translateY(3px);box-shadow:0 1px 0 #3D262A}
.pp-btn:disabled{opacity:.45;cursor:not-allowed}
.pp-btn:focus-visible,.pp-in:focus-visible{outline:3px dashed #7A4FA3;outline-offset:2px}
.pp-btn.lav{background:#E2D4F0}.pp-btn.mint{background:#C9F0DD}.pp-btn.gold{background:#FFE9A8}.pp-btn.cream{background:#FFFDF9}.pp-btn.sm{padding:.3rem .65rem;font-size:.8rem;border-radius:10px}
.pp-chip{display:inline-flex;align-items:center;gap:.35rem;background:#FFFDF9;border:3px solid #3D262A;border-radius:999px;padding:.15rem .65rem;font-weight:800;font-size:.85rem}
.pp-lcd{background:#FDE2E4;border:3px solid #3D262A;border-radius:14px;box-shadow:inset 0 4px 0 rgba(255,255,255,.6)}
.pp-in{width:5rem;background:#FFFDF9;border:3px solid #3D262A;border-radius:10px;padding:.3rem .5rem;font-weight:800;text-align:center;color:#3D262A}
.pp-bar{display:flex;gap:3px}.pp-bar i{flex:1;height:14px;background:#FFFDF9;border:2px solid #3D262A}.pp-bar i.on{background:#FFB6C1}
@keyframes pp-wobble{0%,100%{transform:rotate(0)}3%{transform:rotate(-9deg)}6%{transform:rotate(9deg)}9%{transform:rotate(-6deg)}12%{transform:rotate(6deg)}15%{transform:rotate(0)}}
@keyframes pp-fast{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
@keyframes pp-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pp-pop{0%{transform:scale(.2)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes pp-fall{from{transform:translateY(-20px) rotate(0)}to{transform:translateY(105vh) rotate(600deg)}}
@keyframes pp-zzz{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(10px,-22px)}}
.pp-wobble{animation:pp-wobble 6s ease-in-out infinite;transform-origin:50% 90%}
.pp-wobble-q{animation:pp-wobble 3.5s ease-in-out infinite;transform-origin:50% 90%}
.pp-fast{animation:pp-fast .18s linear infinite;transform-origin:50% 90%}
.pp-bounce{animation:pp-bounce 1.1s steps(2,jump-none) infinite}
.pp-pop{animation:pp-pop .5s ease-out both}
@media (prefers-reduced-motion:reduce){.pp-wobble,.pp-wobble-q,.pp-fast,.pp-bounce,.pp-pop{animation:none}}
`;

const PRESETS = [
  ["focus", "Focus", 25],
  ["short", "Short break", 5],
  ["long", "Long break", 15],
  ["custom", "Custom", null],
];
const stageName = (l) =>
  l >= 10 ? "Royal form" : l >= 5 ? "Ribbon form" : "Baby form";
const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        l: Math.random() * 100,
        d: Math.random() * 0.7,
        t: 1.8 + Math.random() * 1.6,
        s: 6 + Math.floor(Math.random() * 6),
        c: ["#FFB6C1", "#E2D4F0", "#C9F0DD", "#F5C542", "#FF8FAB"][
          Math.floor(Math.random() * 5)
        ],
      })),
    [],
  );
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 60 }}
    >
      {bits.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: -12,
            left: `${b.l}%`,
            width: b.s,
            height: b.s,
            background: b.c,
            border: "2px solid #3D262A",
            animation: `pp-fall ${b.t}s linear ${b.d}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(61,38,42,.55)" }}
      onClick={onClose}
    >
      <div
        className="pp-card p-5 w-full"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="pp-pixel text-lg">{title}</h2>
          <button
            className="pp-btn cream sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PixelPomodoroPet() {
  const [G, setG] = useState(() => ({ ...DEFAULT, ...(store.get() || {}) }));
  const [tab, setTab] = useState("focus");
  const [mode, setMode] = useState("focus");
  const [customMin, setCustomMin] = useState(30);
  const [draft, setDraft] = useState("30");
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [hatch, setHatch] = useState(null);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [blink, setBlink] = useState(false);
  const endAt = useRef(0),
    away = useRef(false),
    done = useRef(false),
    fin = useRef(null),
    S = useRef({});

  const isFocus = mode === "focus" || mode === "custom";
  const total =
    (mode === "focus"
      ? 25
      : mode === "short"
        ? 5
        : mode === "long"
          ? 15
          : customMin) * 60;
  const pct = left / total;
  const stage = isFocus
    ? pct <= 0.25
      ? 3
      : pct <= 0.5
        ? 2
        : pct <= 0.75
          ? 1
          : 0
    : 0;
  S.current = { running, isFocus };
  const say = (msg, kind = "ok") => setToast({ msg, kind, id: Date.now() });
  const click = (fn) => () => {
    sfx.click(G.sound);
    fn && fn();
  };

  useEffect(() => {
    store.set(G);
  }, [G]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3300);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"),
    ss = String(left % 60).padStart(2, "0");
  useEffect(() => {
    document.title = running
      ? `${mm}:${ss} · Pixel Pomodoro Pet`
      : "Pixel Pomodoro Pet";
  }, [running, mm, ss]);

  // countdown (timestamp based, so it stays accurate)
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(r);
      if (r <= 0 && !done.current) {
        done.current = true;
        clearInterval(id);
        setRunning(false);
        fin.current && fin.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // Page Visibility guard
  useEffect(() => {
    const onVis = () => {
      const s = S.current;
      if (document.hidden) {
        if (s.running && s.isFocus) {
          setLeft(Math.max(1, Math.ceil((endAt.current - Date.now()) / 1000)));
          setRunning(false);
          away.current = true;
        }
      } else if (away.current) {
        away.current = false;
        say(
          "Your egg paused while you were away! Stay on this tab to continue growing!",
          "warn",
        );
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // hatch reveal
  useEffect(() => {
    if (!hatch || hatch.stage !== 0) return;
    const t = setTimeout(() => {
      setHatch((h) => h && { ...h, stage: 1 });
      sfx.chime(G.sound);
    }, 1700);
    return () => clearTimeout(t);
  }, [hatch]);

  const finish = () => {
    const mins = Math.round(total / 60);
    setLeft(total);
    if (!isFocus) {
      sfx.chime(G.sound);
      say("Break's over. Ready for another focus round?");
      return;
    }
    const pet = PETS[Math.floor(Math.random() * PETS.length)];
    const isNew = !G.pets[pet.id];
    const xp = mins * 4,
      coins = Math.round(mins * 0.8) + (isNew ? 0 : 30);
    const t = dayKey(new Date()),
      y = dayKey(new Date(Date.now() - 864e5));
    const streak =
      G.lastDay === t ? G.streak || 1 : G.lastDay === y ? G.streak + 1 : 1;
    setG({
      ...G,
      minutes: G.minutes + mins,
      sessions: G.sessions + 1,
      streak,
      lastDay: t,
      xp: G.xp + xp,
      coins: G.coins + coins,
      pets: isNew ? { ...G.pets, [pet.id]: { level: 1 } } : G.pets,
      active: G.active || pet.id,
    });
    setHatch({ pet, isNew, xp, coins, stage: 0 });
  };
  fin.current = finish;

  const selectMode = (m) => {
    setRunning(false);
    setMode(m);
    setLeft(
      (m === "focus" ? 25 : m === "short" ? 5 : m === "long" ? 15 : customMin) *
        60,
    );
  };
  const applyCustom = () => {
    const v = Math.min(90, Math.max(1, parseInt(draft, 10) || 25));
    setDraft(String(v));
    setCustomMin(v);
    setRunning(false);
    setLeft(v * 60);
  };
  const start = () => {
    endAt.current = Date.now() + left * 1000;
    done.current = false;
    setRunning(true);
  };
  const reset = () => {
    const started = left < total;
    setRunning(false);
    setLeft(total);
    if (started && isFocus)
      say("Session abandoned. Your egg is waiting for you.", "warn");
  };
  const levelUp = (id, via) => {
    const p = G.pets[id],
      pet = PETS.find((x) => x.id === id);
    if (!p || p.level >= 10) return;
    const cost = (via === "xp" ? 40 : 25) * p.level,
      have = via === "xp" ? G.xp : G.coins;
    if (have < cost) {
      say(
        `Not enough ${via === "xp" ? "XP" : "coins"} yet. Finish a focus session to earn more.`,
        "warn",
      );
      return;
    }
    const nl = p.level + 1;
    setG({
      ...G,
      [via]: have - cost,
      pets: { ...G.pets, [id]: { ...p, level: nl } },
    });
    sfx.up(G.sound);
    say(
      nl === 5 || nl === 10
        ? `${pet.name} evolved into its ${stageName(nl).toLowerCase()}!`
        : `${pet.name} reached level ${nl}!`,
    );
  };

  const ap = PETS.find((p) => p.id === G.active);
  const alv = ap ? G.pets[ap.id].level : 1;
  const today = dayKey(new Date()),
    yest = dayKey(new Date(Date.now() - 864e5));
  const streak = G.lastDay === today || G.lastDay === yest ? G.streak : 0;
  const filled = Math.round((1 - pct) * 20);
  const owned = Object.keys(G.pets).length;

  return (
    <div className="pp-root">
      <style>{CSS}</style>

      {toast && (
        <div
          role="status"
          className="fixed z-50 pp-card p-3 text-sm font-bold"
          style={{
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(92vw,420px)",
            background: toast.kind === "warn" ? "#E2D4F0" : "#C9F0DD",
          }}
        >
          <div className="flex gap-2 items-start">
            <Heart size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="mx-auto p-3 sm:p-5" style={{ maxWidth: 760 }}>
        {/* top bar */}
        <header className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Egg size={34} />
            <h1
              className="pp-pixel text-lg sm:text-2xl"
              style={{ textShadow: "2px 2px 0 #FFB6C1" }}
            >
              Pixel Pomodoro Pet
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="pp-chip" title="Pet coins">
              <Coins size={15} />
              {G.coins}
            </span>
            <span className="pp-chip" title="Focus XP">
              <Sparkles size={15} />
              {G.xp} XP
            </span>
            <button
              className="pp-btn cream sm"
              aria-label={G.sound ? "Mute" : "Unmute"}
              onClick={() => {
                setG({ ...G, sound: !G.sound });
                sfx.click(!G.sound);
              }}
            >
              {G.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              className="pp-btn cream sm"
              aria-label="Settings"
              onClick={click(() => setSettings(true))}
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        <nav className="flex gap-2 mb-4">
          <button
            className={`pp-btn ${tab === "focus" ? "" : "cream"}`}
            onClick={click(() => setTab("focus"))}
          >
            <Timer size={17} />
            Focus
          </button>
          <button
            className={`pp-btn ${tab === "gallery" ? "lav" : "cream"}`}
            onClick={click(() => setTab("gallery"))}
          >
            <Trophy size={17} />
            Pets {owned}/{PETS.length}
          </button>
        </nav>

        {tab === "focus" ? (
          <main className="pp-card p-4 sm:p-6">
            <div className="flex gap-2 flex-wrap justify-center mb-4">
              {PRESETS.map(([id, label, m]) => (
                <button
                  key={id}
                  className={`pp-btn sm ${mode === id ? "gold" : "cream"}`}
                  onClick={click(() => selectMode(id))}
                >
                  {label}
                  {m ? ` · ${m}m` : ""}
                </button>
              ))}
            </div>
            {mode === "custom" && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <label className="font-bold text-sm" htmlFor="cm">
                  Minutes (1–90)
                </label>
                <input
                  id="cm"
                  className="pp-in"
                  type="number"
                  min={1}
                  max={90}
                  value={draft}
                  disabled={running}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                />
                <button
                  className="pp-btn mint sm"
                  disabled={running}
                  onClick={click(applyCustom)}
                >
                  Set
                </button>
              </div>
            )}

            {/* stage: egg + companion */}
            <div
              className="flex items-end justify-center gap-4 sm:gap-8 py-2"
              style={{ minHeight: 200 }}
            >
              {isFocus ? (
                <>
                  <div
                    className={
                      running ? (stage > 0 ? "pp-wobble-q" : "pp-wobble") : ""
                    }
                  >
                    <Egg stage={stage} size={140} />
                  </div>
                  {ap ? (
                    <div className="text-center">
                      <div className="pp-bounce">
                        <Sprite pet={ap} lvl={alv} size={84} blink={blink} />
                      </div>
                      <p className="text-xs font-extrabold mt-1">
                        {ap.name} · Lv {alv}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="text-center text-xs font-bold p-3"
                      style={{
                        border: "3px dashed #3D262A",
                        borderRadius: 12,
                        maxWidth: 110,
                      }}
                    >
                      Finish a session to hatch your first buddy
                    </div>
                  )}
                </>
              ) : ap ? (
                <div className="text-center relative">
                  <span
                    className="pp-pixel absolute"
                    style={{
                      right: -10,
                      top: 0,
                      animation: "pp-zzz 2.4s linear infinite",
                    }}
                  >
                    z
                  </span>
                  <div className="pp-bounce">
                    <Sprite pet={ap} lvl={alv} size={150} blink={blink} />
                  </div>
                  <p className="text-sm font-extrabold mt-1">
                    {ap.name} is taking a break too
                  </p>
                </div>
              ) : (
                <Egg size={140} />
              )}
            </div>

            {/* digits */}
            <div className="pp-lcd text-center py-3 my-3">
              <div
                className="pp-pixel"
                style={{
                  fontSize: "clamp(3rem,16vw,5.5rem)",
                  lineHeight: 1,
                  color: "#3D262A",
                  textShadow: "3px 3px 0 #FFB6C1",
                }}
                aria-live="off"
              >
                {mm}:{ss}
              </div>
              <p className="text-xs font-bold mt-1">
                {running
                  ? isFocus
                    ? "Growing your egg…"
                    : "Resting…"
                  : left < total
                    ? "Paused"
                    : isFocus
                      ? "Ready to focus"
                      : "Ready to rest"}
              </p>
            </div>
            <div className="pp-bar mb-5" aria-hidden="true">
              {Array.from({ length: 20 }, (_, i) => (
                <i key={i} className={i < filled ? "on" : ""} />
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              {running ? (
                <button
                  className="pp-btn lav"
                  style={{ minWidth: 130 }}
                  onClick={click(() => {
                    setRunning(false);
                  })}
                >
                  <Pause size={18} />
                  Pause
                </button>
              ) : (
                <button
                  className="pp-btn mint"
                  style={{ minWidth: 130 }}
                  onClick={click(start)}
                >
                  <Play size={18} />
                  {left < total ? "Resume" : "Start"}
                </button>
              )}
              <button
                className="pp-btn cream"
                disabled={left === total && !running}
                onClick={click(reset)}
              >
                <RotateCcw size={18} />
                {left < total ? "Abandon" : "Reset"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 text-center">
              {[
                [Clock, fmtMin(G.minutes), "focused"],
                [Flame, `${streak} day${streak === 1 ? "" : "s"}`, "streak"],
                [Sparkles, G.sessions, "eggs hatched"],
              ].map(([Ic, v, l]) => (
                <div key={l} className="pp-lcd py-2">
                  <Ic size={16} style={{ margin: "0 auto" }} />
                  <div className="font-black">{v}</div>
                  <div className="text-xs font-bold">{l}</div>
                </div>
              ))}
            </div>
          </main>
        ) : (
          <main>
            <p className="text-sm font-bold mb-3">
              Pick a buddy to sit beside your timer. Spend coins or XP to level
              them up; they evolve at level 5 and 10.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PETS.map((pet) => {
                const d = G.pets[pet.id];
                if (!d)
                  return (
                    <div
                      key={pet.id}
                      className="pp-card p-4 flex items-center gap-4"
                      style={{ background: "#FDE2E4" }}
                    >
                      <Sprite pet={pet} size={72} dim />
                      <div>
                        <p className="font-black">Undiscovered</p>
                        <p className="text-xs font-bold">
                          Finish a focus session to hatch it.
                        </p>
                      </div>
                    </div>
                  );
                const isA = G.active === pet.id,
                  max = d.level >= 10;
                return (
                  <div
                    key={pet.id}
                    className="pp-card p-4"
                    style={{ background: isA ? "#FFF0F5" : "#FFFDF9" }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={isA ? "pp-bounce" : ""}>
                        <Sprite
                          pet={pet}
                          lvl={d.level}
                          size={84}
                          blink={isA && blink}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black flex items-center gap-1">
                          {pet.name}
                          {isA && <Heart size={15} fill="#FF8FAB" />}
                        </p>
                        <p className="text-xs font-bold">
                          Lv {d.level}/10 · {stageName(d.level)}
                        </p>
                        <div className="pp-bar mt-2" aria-hidden="true">
                          {Array.from({ length: 10 }, (_, i) => (
                            <i key={i} className={i < d.level ? "on" : ""} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                      <button
                        className="pp-btn sm gold"
                        disabled={max || G.coins < 25 * d.level}
                        onClick={click(() => levelUp(pet.id, "coins"))}
                      >
                        <Coins size={14} />
                        {max ? "Max level" : 25 * d.level}
                      </button>
                      <button
                        className="pp-btn sm lav"
                        disabled={max || G.xp < 40 * d.level}
                        onClick={click(() => levelUp(pet.id, "xp"))}
                      >
                        <Sparkles size={14} />
                        {max ? "Max level" : `${40 * d.level} XP`}
                      </button>
                      <button
                        className="pp-btn sm mint"
                        disabled={isA}
                        onClick={click(() => setG({ ...G, active: pet.id }))}
                      >
                        {isA ? "Active buddy" : "Make buddy"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        )}
        <p
          className="text-center text-xs font-bold mt-5"
          style={{ opacity: 0.7 }}
        >
          Stay on this tab while you focus. Leaving pauses your egg.
        </p>
      </div>

      {hatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(61,38,42,.6)" }}
        >
          {hatch.stage === 1 && <Confetti />}
          <div
            className="pp-card p-6 text-center w-full"
            style={{ maxWidth: 360 }}
            role="dialog"
            aria-label="Hatching"
          >
            {hatch.stage === 0 ? (
              <>
                <div className="pp-fast inline-block">
                  <Egg stage={3} size={150} />
                </div>
                <p className="pp-pixel mt-3">Something is hatching…</p>
              </>
            ) : (
              <>
                <div className="pp-pop inline-block">
                  <Sprite pet={hatch.pet} size={150} />
                </div>
                <h2 className="pp-pixel text-xl mt-2">
                  {hatch.isNew ? "A new pet!" : "An old friend!"}
                </h2>
                <p className="font-black">{hatch.pet.name}</p>
                <div className="flex gap-2 justify-center mt-3 flex-wrap">
                  <span className="pp-chip">
                    <Sparkles size={14} />+{hatch.xp} XP
                  </span>
                  <span className="pp-chip">
                    <Coins size={14} />+{hatch.coins}
                  </span>
                </div>
                {!hatch.isNew && (
                  <p className="text-xs font-bold mt-2">
                    Duplicate bonus: +30 coins included.
                  </p>
                )}
                <button
                  className="pp-btn mt-4"
                  onClick={click(() => setHatch(null))}
                >
                  <Heart size={16} />
                  Collect
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {settings && (
        <Modal
          title="Settings"
          onClose={() => {
            setSettings(false);
            setConfirm(false);
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold">Sound effects</span>
            <button
              className="pp-btn sm cream"
              onClick={() => {
                setG({ ...G, sound: !G.sound });
                sfx.click(!G.sound);
              }}
            >
              {G.sound ? (
                <>
                  <Volume2 size={14} />
                  On
                </>
              ) : (
                <>
                  <VolumeX size={14} />
                  Off
                </>
              )}
            </button>
          </div>
          <p className="text-xs font-bold mb-3">
            Progress is saved in this browser. In sandboxed previews that block
            storage, it lasts until you close the page.
          </p>
          {!confirm ? (
            <button
              className="pp-btn sm lav"
              onClick={click(() => setConfirm(true))}
            >
              <RotateCcw size={14} />
              Reset progress
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold">
                Delete all pets, XP and stats?
              </span>
              <button
                className="pp-btn sm"
                onClick={() => {
                  setG({ ...DEFAULT, sound: G.sound });
                  setConfirm(false);
                  setSettings(false);
                  say("Progress reset. Time for a fresh egg!");
                }}
              >
                Yes, reset
              </button>
              <button
                className="pp-btn sm cream"
                onClick={click(() => setConfirm(false))}
              >
                Keep
              </button>
            </div>
          )}

          <div className="border-t-2 border-dashed border-[#3D262A] pt-3 mt-4 text-center">
            <p className="text-xs font-bold" style={{ opacity: 0.65 }}>
              Pixel Pomodoro Pet · v1.0.0
              <br />
              Designed & Developed by Thu Ta
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
