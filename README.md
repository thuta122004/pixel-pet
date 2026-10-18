# Pixel Pomodoro Pet 🐣

**Pixel Pomodoro Pet** is a cozy, retro-styled React productivity web application that gamifies the Pomodoro Technique. Stay focused on your tasks, grow and hatch pixel art eggs, collect adorable companion pets, level them up, and build daily focus streaks—all accompanied by synthesized 8-bit sound effects.

---

## ✨ Features

* **Gamified Pomodoro Timer:** Choose between preset modes (**Focus (25m)**, **Short Break (5m)**, **Long Break (15m)**) or configure a custom duration (1 to 90 minutes).
* **Interactive Egg & Hatching Mechanics:** As your focus timer counts down, your egg gradually cracks and develops through distinct stages. Completing a session triggers a hatching event with confetti to reveal a random companion pet.
* **Pet Collection & Evolution:** Collect multiple unique pixel pets (like Pink Slime, Pixel Bunny, Honey Hamster, Strawberry Ghost, and Cloud Kitten). Level them up using earned coins or XP to watch them evolve through 3 distinct forms (Baby, Ribbon, and Royal form at level 10!).
* **Built-in Focus Guard:** Features visibility detection that gently pauses the timer and alerts you if you switch tabs, encouraging deep work and mindfulness.
* **Synthesized 8-Bit Audio:** Fully custom Web Audio API-synthesized sound effects for clicks, chimes, and level-ups—no external audio files required.
* **Persistence & Stats:** Tracks your total focus minutes, completion streaks, and hatched eggs using local storage (with in-memory fallback support).

---

## 🛠️ Tech Stack

* **React** (Hooks: `useState`, `useEffect`, `useRef`, `useMemo`)
* **Tailwind CSS** (Utility styling layered with custom pixel-art and retro animations)
* **Lucide React** (UI Icons)
* **HTML5 Canvas / SVG** (Crisp, scalable pixel art rendering using pixelated CSS rules)
* **Web Audio API** (Procedural sound generation)

---

## 🚀 Quick Start / Installation

Because this project is built as a self-contained React component (`PixelPomodoroPet.jsx`), you can drop it directly into any modern React project (such as a Vite or Next.js app) that has Tailwind CSS and `lucide-react` installed.

### 1. Prerequisites

Ensure you have Node.js installed, along with a React project initialized with Tailwind CSS.

### 2. Install Dependencies

Install the required icon library if you haven't already:

```bash
npm install lucide-react

```

### 3. Add the Component

Place `PixelPomodoroPet.jsx` into your components directory (e.g., `src/components/PixelPomodoroPet.jsx`) and import it into your main application entry point (`App.jsx`):

```jsx
import React from "react";
import PixelPomodoroPet from "./components/PixelPomodoroPet";

export default function App() {
  return <PixelPomodoroPet />;
}

```

### 4. Run the Development Server

```bash
npm run dev

```

---

## 🕹️ How to Play

1. **Select a Mode:** Pick *Focus* to start a 25-minute work block, or choose a break mode when you need to rest.
2. **Grow Your Egg:** Hit **Start**. Keep the browser tab active to let your egg grow and crack as the minutes count down.
3. **Collect Rewards:** When the timer finishes, collect your earned **XP** and **Coins**, and unlock or discover a new pet buddy!
4. **Manage Your Pets:** Head over to the **Pets Gallery** tab to set your active buddy, feed them XP/Coins to level them up, and unlock evolved visual forms at Levels 5 and 10.
