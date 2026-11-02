import { useEffect, useRef, useState } from 'react';
import { ANIMS, Pose, Pt } from '../../animations/exerciseAnimations';
import type { Seg } from '../../data/exercises';

const ORANGE = '#ff6a2b', BODY = '#e9ecf2', GHOST = 'rgba(255,255,255,.13)', ARROW = '#4da3ff';
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function mix(A: Pose, B: Pose, t: number): Pose {
  const o: any = {};
  for (const k of Object.keys(A) as (keyof Pose)[]) { const a = A[k]!; const b = (B[k] ?? a) as Pt; o[k] = lerp(a, b, t); }
  for (const k of Object.keys(B) as (keyof Pose)[]) if (!(k in o)) o[k] = B[k];
  return o;
}

function Body({ p, hi, ghost, eq, front }: { p: Pose; hi: Seg[]; ghost?: boolean; eq: string; front?: boolean }) {
  const c = (s: Seg) => ghost ? GHOST : hi.includes(s) ? ORANGE : BODY;
  const L = (a: Pt, b: Pt, col: string, w = 7, key?: string) => <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={w} strokeLinecap="round" />;
  const e2 = p.e2 ?? p.e, w2 = p.w2 ?? p.w, k2 = p.k2 ?? p.k, a2 = p.a2 ?? p.a, t2 = p.t2 ?? (p.t ? [p.t[0] - p.a[0] + a2[0], p.t[1] - p.a[1] + a2[1]] as Pt : undefined);
  const far = ghost ? GHOST : 'rgba(233,236,242,.45)';
  const farHi = (s: Seg) => ghost ? GHOST : hi.includes(s) ? 'rgba(255,106,43,.6)' : far;
  return (
    <g>
      {/* far limbs */}
      {L(p.hp, k2, front ? c('thigh') : farHi('thigh'))}{L(k2, a2, front ? c('shin') : farHi('shin'))}{t2 && L(a2, t2, far, 5)}
      {L(p.n, e2, front ? c('uarm') : farHi('uarm'))}{L(e2, w2, front ? c('farm') : farHi('farm'), 6)}
      {/* torso */}
      {L(p.n, p.hp, c('torso'), 11)}
      {hi.includes('neck') && !ghost && L(p.n, lerp(p.n, p.h, .45), ORANGE, 12)}
      {L(p.hp, p.k, c('thigh'), 8)}{L(p.k, p.a, c('shin'), 7)}{p.t && L(p.a, p.t, ghost ? GHOST : BODY, 5)}
      {L(p.n, p.e, c('uarm'))}{L(p.e, p.w, c('farm'), 6)}
      <circle cx={p.h[0]} cy={p.h[1]} r={10} fill={ghost ? GHOST : BODY} />
      {!ghost && <Equipment p={p} w2={w2} eq={eq} front={front} />}
    </g>
  );
}
function Equipment({ p, w2, eq, front }: { p: Pose; w2: Pt; eq: string; front?: boolean }) {
  const plate = (pt: Pt, r: number, k: string) => <g key={k}><circle cx={pt[0]} cy={pt[1]} r={r} fill="#111" stroke="#666" strokeWidth={2} /><circle cx={pt[0]} cy={pt[1]} r={2.5} fill="#bbb" /></g>;
  const db = (pt: Pt, k: string) => <g key={k}><rect x={pt[0] - 9} y={pt[1] - 2.5} width={18} height={5} rx={2} fill="#999" /><rect x={pt[0] - 11} y={pt[1] - 6} width={5} height={12} rx={1.5} fill="#222" stroke="#777" /><rect x={pt[0] + 6} y={pt[1] - 6} width={5} height={12} rx={1.5} fill="#222" stroke="#777" /></g>;
  if (eq === 'bar') return front ? <g><line x1={p.w[0] - 22} y1={p.w[1]} x2={w2[0] + 22} y2={w2[1]} stroke="#aaa" strokeWidth={4} />{[p.w[0] - 24, w2[0] + 24].map((x, i) => <rect key={i} x={x - 3} y={p.w[1] - 12} width={6} height={24} fill="#111" stroke="#666" />)}</g> : plate(p.w, 12, 'b');
  if (eq === 'db') return <g>{db(p.w, 'a')}{db(w2, 'b')}</g>;
  if (eq === 'db1') return db(p.w, 'a');
  if (eq === 'plate') return <g><circle cx={p.w[0]} cy={p.w[1]} r={10} fill="none" stroke="#111" strokeWidth={5} /></g>;
  return null;
}

export default function Figure({ anim, hi = [], slow = false, replay = 0, paused = false, small = false }: { anim: string; hi?: Seg[]; slow?: boolean; replay?: number; paused?: boolean; small?: boolean }) {
  const cfg = ANIMS[anim] ?? ANIMS.pushup;
  const [t, setT] = useState(0);
  const t0 = useRef(performance.now()); const off = useRef(0); const pausedAt = useRef<number | null>(null);
  useEffect(() => { t0.current = performance.now(); off.current = 0; }, [replay, anim]);
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (paused) { if (pausedAt.current == null) pausedAt.current = now; }
      else {
        if (pausedAt.current != null) { off.current += now - pausedAt.current; pausedAt.current = null; }
        const period = (cfg.hold ? 3000 : 2600) * (slow ? 2.4 : 1);
        const ph = ((now - t0.current - off.current) % period) / period;
        setT(cfg.hold ? 0.5 + 0.5 * Math.sin(ph * Math.PI * 2) * 0.15 : (1 - Math.cos(ph * Math.PI * 2)) / 2);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [anim, slow, paused, cfg.hold]);
  const p = mix(cfg.A, cfg.B, t);
  const arr = cfg.arrow ? [cfg.A[cfg.arrow], cfg.B[cfg.arrow]] as Pt[] : null;
  return (
    <svg viewBox="0 0 200 200" className={small ? 'fig fig-sm' : 'fig'} role="img" aria-label="تمثيل حركة التمرين">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill={ARROW} /></marker></defs>
      <line x1="0" y1="181" x2="200" y2="181" stroke="#3a3f4b" strokeWidth={2} />
      {cfg.bench && <rect x={cfg.bench[0]} y={cfg.bench[1]} width={cfg.bench[2]} height={cfg.bench[3]} rx={5} fill="#3b3428" stroke="#6b5d45" />}
      {cfg.step && <rect x={cfg.step[0]} y={cfg.step[1]} width={cfg.step[2]} height={12} fill="#3b3428" stroke="#6b5d45" />}
      <Body p={cfg.A} hi={hi} ghost eq={cfg.eq} front={cfg.front} />
      <Body p={p} hi={hi} eq={cfg.eq} front={cfg.front} />
      {arr && !small && <line x1={arr[0][0] + 12} y1={arr[0][1]} x2={arr[1][0] + 12} y2={arr[1][1]} stroke={ARROW} strokeWidth={2} strokeDasharray="4 3" markerEnd="url(#ah)" markerStart="url(#ah)" />}
      {cfg.label && !small && <text x="196" y="14" fontSize="9" fill="#9aa3b2" textAnchor="end">{cfg.label}</text>}
    </svg>
  );
}
