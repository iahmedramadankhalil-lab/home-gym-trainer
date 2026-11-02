# مدربك الشخصي — Home Gym Trainer

PWA (React + TypeScript + Vite) built from the 6-day Push/Pull/Legs home program (34 exercises).

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # test the production build (service worker active here)
```

## Deploy to Vercel
- **CLI:** `npm i -g vercel` → `vercel` → `vercel --prod` (framework auto-detected: Vite, output `dist`).
- **Git:** push the folder to GitHub → vercel.com → Add New Project → import → Deploy. `vercel.json` already handles SPA routing and no-cache for `sw.js`.

## Test offline
1. `npm run build && npm run preview` (or open the Vercel URL), load the app once online.
2. DevTools → Application → Service Workers: `sw.js` is activated.
3. Network tab → "Offline" → reload. The app, animations, timers and logging keep working.
4. On phone: browser menu → "Add to Home screen" to install.

## Structure
```
src/data/exercises.ts        34 exercises (PDF numbering): muscles, equipment, start/end, steps, breathing, mistakes, tip
src/data/schedule.ts         6 days (sets/reps/rest/notes), warm-up, AMRAP circuit (B days only), 6-week cycle, safety
src/animations/exerciseAnimations.ts   start/end pose configs per movement
src/components/ExerciseAnimation/Figure.tsx  SVG figure, continuous interpolation, ghost start pose, arrows, orange muscle, equipment, slow-mo
src/services/core.ts         localStorage, Web Audio beeps, SpeechSynthesis (ar-EG preferred), timestamp-based clock
src/pages/TrainingSession.tsx  session state machine: WELCOME → WARMUP → EXERCISE_INTRO → ACTIVE_SET → REST → … → CONDITIONING → COMPLETED
src/pages/Pages.tsx          Home, Weekly Program, Library, Progress, Settings, Safety gate
public/sw.js, manifest.json, icons/
```

## Limitations
- Voice uses the device's installed Arabic voices; most are MSA/Gulf, so pronunciation may not sound Egyptian even though the text is Egyptian. Text is always shown.
- Reps are counted manually (no camera tracking).
- Figures are simplified stick illustrations, not anatomical simulations.
- Data lives only in this browser (use Settings → export backup).
- YouTube links from the PDF are not included (they need internet).
