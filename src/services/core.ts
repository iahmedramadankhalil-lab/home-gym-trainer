// storage, audio, speech, timer helpers — no network needed
export function load<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
export function save(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ } }

export interface Settings { voice: boolean; volume: number; rate: number; voiceURI: string; beeps: boolean; spokenCount: boolean; safetyAck: boolean; }
export const DEFAULT_SETTINGS: Settings = { voice: true, volume: 1, rate: 0.95, voiceURI: '', beeps: true, spokenCount: true, safetyAck: false };
export interface SetLog { ex: number; item: number; set: number; reps: number; weight: number; secs?: number }
export interface SessionLog { id: string; date: string; dayId: number; week: number; sets: SetLog[]; minutes: number; rounds?: number; note?: string; completed: boolean }
export interface Profile { bodyWeights: { date: string; kg: number }[]; weights: Record<number, number>; notes: string; lastDay: number; cycleStart: string; weekOverride: number | null; history: SessionLog[] }
export const DEFAULT_PROFILE: Profile = { bodyWeights: [], weights: {}, notes: '', lastDay: 0, cycleStart: new Date().toISOString().slice(0, 10), weekOverride: null, history: [] };

export function cycleWeek(p: Profile): number {
  if (p.weekOverride) return p.weekOverride;
  const days = Math.floor((Date.now() - new Date(p.cycleStart).getTime()) / 864e5);
  return (Math.max(0, Math.floor(days / 7)) % 6) + 1;
}

// ---- audio (Web Audio, generated locally) ----
let ctx: AudioContext | null = null;
export function beep(freq = 880, ms = 140, vol = 0.25) {
  try {
    ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + ms / 1000);
  } catch { /* no audio */ }
}
export const vibrate = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* */ } };

// ---- speech ----
export function arabicVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('ar'));
}
export function pickVoice(uri: string) {
  const vs = arabicVoices();
  return vs.find(v => v.voiceURI === uri) ?? vs.find(v => /ar[-_]eg/i.test(v.lang)) ?? vs.find(v => /ar[-_]sa/i.test(v.lang)) ?? vs[0];
}
export function speak(text: string, s: Settings, opts: { interrupt?: boolean } = {}) {
  if (!s.voice || !('speechSynthesis' in window) || !text) return;
  if (opts.interrupt !== false) speechSynthesis.cancel();
  // split long text into sentences — some engines cut off long utterances
  const parts = text.split(/(?<=[.!؟?\n])\s+/).filter(Boolean);
  const v = pickVoice(s.voiceURI);
  for (const part of parts) {
    const u = new SpeechSynthesisUtterance(part); u.lang = v?.lang ?? 'ar-EG'; if (v) u.voice = v;
    u.rate = s.rate; u.volume = s.volume; speechSynthesis.speak(u);
  }
}
export const stopSpeech = () => { try { speechSynthesis.cancel(); } catch { /* */ } };

// ---- timestamp timer (accurate across tab sleep / refresh) ----
export interface Clock { dur: number; acc: number; since: number | null } // ms
export const newClock = (durSec: number, run = false): Clock => ({ dur: durSec * 1000, acc: 0, since: run ? Date.now() : null });
export const elapsed = (c: Clock, now = Date.now()) => c.acc + (c.since ? now - c.since : 0);
export const remaining = (c: Clock, now = Date.now()) => Math.max(0, c.dur - elapsed(c, now));
export const pauseClock = (c: Clock): Clock => c.since ? { ...c, acc: elapsed(c), since: null } : c;
export const runClock = (c: Clock): Clock => c.since ? c : { ...c, since: Date.now() };
export const fmt = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const fmtUp = (ms: number) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
