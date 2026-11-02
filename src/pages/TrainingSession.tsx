import { useEffect, useMemo, useRef, useState } from 'react';
import Figure from '../components/ExerciseAnimation/Figure';
import { EX } from '../data/exercises';
import { CONDITIONING, CYCLE, DAYS, Item, WARMUP } from '../data/schedule';
import { beep, Clock, cycleWeek, elapsed, fmt, fmtUp, newClock, pauseClock, Profile, remaining, runClock, save, SessionLog, SetLog, Settings, speak, stopSpeech, vibrate } from '../services/core';

export type Phase = 'WELCOME' | 'WARMUP' | 'EXERCISE_INTRO' | 'ACTIVE_SET' | 'REST' | 'CONDITIONING' | 'COMPLETED';
export interface SessionState {
  dayId: number; week: number; phase: Phase; warmIdx: number; exIdx: number; set: number;
  clock: Clock | null; reps: number; logs: SetLog[]; startedAt: number; rounds: number; condMin: number; restNext: 'set' | 'exercise'; paused: boolean;
}
export const SESSION_KEY = 'hgt.session';
export const newSession = (dayId: number, p: Profile): SessionState => ({ dayId, week: cycleWeek(p), phase: 'WELCOME', warmIdx: 0, exIdx: 0, set: 1, clock: null, reps: 0, logs: [], startedAt: Date.now(), rounds: 0, condMin: 10, restNext: 'set', paused: false });

const MOTIVATE = ['ممتاز يا بطل، كمّل كده!', 'شغل نضيف، التكنيك أهم من التقل.', 'برافو! خد نفس وارتاح.', 'عاش! كل مجموعة بتقرّبك.', 'حلو أوي، ركّز في اللي جاي.'];
const ORD = ['الأولى', 'التانية', 'التالتة', 'الرابعة', 'الخامسة'];
const restText = (s: number) => s >= 120 ? `${s / 60 === 2 ? 'دقيقتين' : s / 60 + ' دقايق'}` : s === 60 ? 'دقيقة' : s === 90 ? 'دقيقة ونص' : `${s} ثانية`;

function useNow(active: boolean) { const [n, setN] = useState(Date.now()); useEffect(() => { if (!active) return; const id = setInterval(() => setN(Date.now()), 200); const vis = () => setN(Date.now()); document.addEventListener('visibilitychange', vis); return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); }; }, [active]); return n; }

export default function TrainingSession({ st, setSt, profile, setProfile, settings, onExit }: { st: SessionState; setSt: (s: SessionState) => void; profile: Profile; setProfile: (p: Profile) => void; settings: Settings; onExit: () => void; }) {
  const day = DAYS.find(d => d.id === st.dayId)!;
  const deload = st.week === 6;
  const items: Item[] = day.items;
  const setsOf = (it: Item) => deload ? Math.ceil(it.sets / 2) : it.sets;
  const item = items[st.exIdx]; const ex = item ? EX(item.ex) : null; const totalSets = item ? setsOf(item) : 0;
  const now = useNow(!!st.clock && !!st.clock.since);
  const [slow, setSlow] = useState(false); const [replay, setReplay] = useState(0); const [metro, setMetro] = useState(false);
  const [weightDraft, setWeightDraft] = useState<string>('');
  const up = (patch: Partial<SessionState>) => setSt({ ...st, ...patch });
  const say = (t: string) => speak(t, settings);
  const allSets = items.reduce((a, it) => a + setsOf(it), 0);
  const doneSets = st.logs.length;
  const prevSpoken = useRef<string>('');

  // persist + warn on accidental navigation
  useEffect(() => { save(SESSION_KEY, st); }, [st]);
  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (st.phase !== 'COMPLETED') { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, [st.phase]);
  useEffect(() => () => stopSpeech(), []);
  useEffect(() => { if (ex) setWeightDraft(String(profile.weights[ex.id] ?? '')); }, [ex?.id]);

  // auto-speech on phase entry
  useEffect(() => {
    const key = `${st.phase}-${st.warmIdx}-${st.exIdx}-${st.set}`; if (prevSpoken.current === key) return; prevSpoken.current = key;
    if (st.phase === 'WELCOME') say(`أهلاً بيك يا بطل! جاهز نبدأ تمرين النهاردة؟ النهاردة ${day.title}. هنمشي خطوة خطوة. ركّز معايا في التكنيك، ومتستعجلش في أي حركة.`);
    if (st.phase === 'WARMUP') say(WARMUP[st.warmIdx].say);
    if (st.phase === 'EXERCISE_INTRO' && ex && item) say(introScript(ex, item));
    if (st.phase === 'ACTIVE_SET' && ex) say(`يلا نبدأ المجموعة ${ORD[st.set - 1] ?? st.set}. ${item.timed ? `اثبت ${item.timed} ثانية.` : `الهدف ${item.reps} عدة.`} ${ex.breath.split('.')[0]}.`);
    if (st.phase === 'REST' && item) say(`${MOTIVATE[(st.set + st.exIdx) % MOTIVATE.length]} عندك راحة ${restText(item.rest)}.`);
    if (st.phase === 'CONDITIONING') say(`آخر جزء: دايرة الحرق. أكبر عدد لفات في ${st.condMin} دقايق. ١٢ جوبلت سكوات، ١٠ ضغط، ١٠ سحب دمبل منحني، و٢٠ ثانية ماونتن كلايمبرز. يلا!`);
    if (st.phase === 'COMPLETED') say('خلصنا التمرين كله! عاش يا بطل. اشرب مية واتمشى شوية، وشوفك المرة الجاية.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.phase, st.warmIdx, st.exIdx, st.set]);

  // clock events (end of countdown, last seconds)
  const lastSec = useRef(-1);
  const rem = st.clock ? remaining(st.clock, now) : 0;
  useEffect(() => {
    if (!st.clock || !st.clock.since) return;
    const s = Math.ceil(rem / 1000);
    if (s !== lastSec.current) {
      lastSec.current = s;
      const counting = st.phase === 'REST' || (st.phase === 'ACTIVE_SET' && item?.timed) || (st.phase === 'WARMUP' && WARMUP[st.warmIdx].secs);
      if (counting && st.clock.dur > 0) {
        if (s === 10 && st.phase === 'REST') say('فاضل عشر ثواني، جهّز نفسك.');
        if (s <= 3 && s > 0) { if (settings.beeps) beep(660, 120); if (settings.spokenCount) speak(['', 'واحد', 'اتنين', 'تلاتة'][s], settings); }
        if (s === 0) { if (settings.beeps) beep(1040, 400); vibrate([200, 100, 200]); onClockEnd(); }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);
  // metronome for tempo (3s down / 1s up)
  useEffect(() => { if (!(metro && st.phase === 'ACTIVE_SET' && st.clock?.since)) return; let i = 0; const id = setInterval(() => { const ph = i % 4; if (settings.beeps) beep(ph === 3 ? 990 : 520, 70, 0.15); i++; }, 1000); return () => clearInterval(id); }, [metro, st.phase, st.clock?.since]);

  function onClockEnd() {
    if (st.phase === 'REST') goAfterRest();
    else if (st.phase === 'ACTIVE_SET' && item?.timed) completeSet(item.timed);
    else if (st.phase === 'WARMUP') say('تمام، دوس التالي لما تكون جاهز.');
  }
  // ----- transitions -----
  function startWarm(i: number) { const w = WARMUP[i]; up({ phase: 'WARMUP', warmIdx: i, clock: w.secs ? newClock(w.secs) : null, reps: 0 }); }
  function toIntro(i: number) { if (i >= items.length) return finishMain(); up({ phase: 'EXERCISE_INTRO', exIdx: i, set: 1, clock: null, reps: 0 }); }
  function startSet() { up({ phase: 'ACTIVE_SET', clock: item.timed ? newClock(item.timed, true) : { dur: 0, acc: 0, since: Date.now() }, reps: item.timed ? 0 : item.repsMax || 0, paused: false }); }
  function completeSet(secs?: number) {
    const w = parseFloat(weightDraft) || 0;
    const log: SetLog = { ex: item.ex, item: st.exIdx, set: st.set, reps: item.timed ? 0 : st.reps, weight: w, secs: secs ?? (item.timed ? Math.round(elapsed(st.clock!) / 1000) : undefined) };
    if (w && w !== profile.weights[item.ex]) setProfile({ ...profile, weights: { ...profile.weights, [item.ex]: w } });
    const last = st.set >= totalSets; const lastItem = st.exIdx >= items.length - 1;
    if (last && lastItem) return finishMain([...st.logs, log]);
    setSt({ ...st, logs: [...st.logs, log], phase: 'REST', clock: newClock(item.rest, true), restNext: last ? 'exercise' : 'set', paused: false });
  }
  function goAfterRest() {
    if (st.restNext === 'set') { const ns = st.set + 1; setSt({ ...st, phase: 'ACTIVE_SET', set: ns, clock: item.timed ? newClock(item.timed, true) : { dur: 0, acc: 0, since: Date.now() }, reps: item.timed ? 0 : item.repsMax || 0 }); }
    else { const ni = st.exIdx + 1; if (ni >= items.length) finishMain(); else setSt({ ...st, phase: 'EXERCISE_INTRO', exIdx: ni, set: 1, clock: null, reps: 0 }); }
  }
  function finishMain(logs = st.logs) { if (day.conditioning) setSt({ ...st, logs, phase: 'CONDITIONING', clock: newClock(st.condMin * 60), rounds: 0 }); else complete(logs); }
  function complete(logs = st.logs, rounds?: number) {
    const log: SessionLog = { id: String(st.startedAt), date: new Date().toISOString(), dayId: st.dayId, week: st.week, sets: logs, minutes: Math.round((Date.now() - st.startedAt) / 60000), rounds, completed: true };
    setProfile({ ...profile, lastDay: st.dayId, history: [...profile.history.filter(h => h.id !== log.id), log] });
    setSt({ ...st, logs, phase: 'COMPLETED', clock: null, rounds: rounds ?? st.rounds });
  }
  function togglePause() { if (!st.clock) return; up({ clock: st.clock.since ? pauseClock(st.clock) : runClock(st.clock), paused: !!st.clock.since }); if (st.clock.since) stopSpeech(); }
  function endSession() {
    if (!confirm('عايز تنهي الجلسة؟ اللي خلصته هيتسجل.')) return;
    if (st.logs.length) setProfile({ ...profile, history: [...profile.history.filter(h => h.id !== String(st.startedAt)), { id: String(st.startedAt), date: new Date().toISOString(), dayId: st.dayId, week: st.week, sets: st.logs, minutes: Math.round((Date.now() - st.startedAt) / 60000), completed: false }] });
    localStorage.removeItem(SESSION_KEY); stopSpeech(); onExit();
  }
  function skipExercise() { if (!confirm(`تتخطى ${ex?.ar}؟ مش هيتسجل كمكتمل.`)) return; toIntro(st.exIdx + 1); }

  const progress = Math.round((doneSets / Math.max(1, allSets)) * 100);
  const equipment = useMemo(() => [...new Set(items.map(i => EX(i.ex).equip))], [day.id]);

  // ===== RENDER =====
  const Top = <div className="s-top"><button className="ghost sm" onClick={endSession}>✕ إنهاء</button><div className="s-prog"><div style={{ width: progress + '%' }} /></div><span className="muted small">{progress}%</span>{deload && <span className="tag">Deload</span>}</div>;

  if (st.phase === 'WELCOME') return (
    <div className="session">{Top}
      <div className="welcome card glow">
        <div className="coach-bubble">أهلاً بيك يا بطل! جاهز نبدأ تمرين النهاردة؟ هنمشي خطوة خطوة. ركّز معايا في التكنيك، ومتستعجلش في أي حركة.</div>
        <h1 style={{ color: day.color }}>{day.title}</h1><p className="muted">{day.en} — {day.focus}</p>
        <div className="stats"><div><b>{items.length}</b><span>تمارين</span></div><div><b>{allSets}</b><span>مجموعة</span></div><div><b>{day.duration}</b><span>بالإحماء</span></div><div><b>{st.week}</b><span>أسبوع الدورة</span></div></div>
        <p className="small">🎯 RIR الأسبوع ده: <b>{CYCLE[st.week - 1].rir}</b> — {CYCLE[st.week - 1].how}</p>
        <h3>الأدوات المطلوبة</h3><ul className="chips">{equipment.map(e => <li key={e}>{e}</li>)}</ul>
        <button className="primary big" onClick={() => startWarm(0)}>يلا نبدأ الإحماء ▶</button>
        <button className="ghost" onClick={() => toIntro(0)}>تخطي الإحماء (مش مستحسن)</button>
      </div>
    </div>);

  if (st.phase === 'WARMUP') {
    const w = WARMUP[st.warmIdx]; const first = EX(items[0].ex); const fw = profile.weights[first.id];
    return (<div className="session">{Top}
      <div className="stage-label">الإحماء {st.warmIdx + 1} / {WARMUP.length}</div>
      <div className="fig-wrap"><Figure anim={w.anim === 'ramp' ? (EX(items[0].ex).anim) : w.anim} hi={w.anim === 'ramp' ? first.hi : []} slow={slow} replay={replay} paused={!!st.clock && !st.clock.since && st.clock.acc > 0} /></div>
      <h2 className="ex-name">{w.ar}</h2><p className="muted center">{w.en} — {w.why}</p>
      <div className="coach-bubble">{w.say}</div>
      {w.anim === 'ramp' && <div className="card small">أول تمرين: <b>{first.ar}</b> ({first.en}). {fw ? <>تسخين 1: <b>{Math.round(fw * 0.5)} كجم × 10</b> — تسخين 2: <b>{Math.round(fw * 0.75)} كجم × 5</b></> : 'سجّل وزن شغلك للتمرين ده عشان أحسبلك 50% و75%.'}</div>}
      {w.secs ? <div className="timer">{fmt(remaining(st.clock!, now))}</div> : <RepCounter value={st.reps} target={w.reps!} onChange={r => up({ reps: r })} />}
      <div className="row">
        {w.secs && <button className="primary" onClick={togglePause}>{st.clock?.since ? '⏸ إيقاف' : (st.clock && st.clock.acc > 0 ? '▶ كمّل' : '▶ ابدأ')}</button>}
        {w.secs && <button className="ghost" onClick={() => up({ clock: newClock(w.secs!) })}>↺ إعادة</button>}
        <button className="ghost" onClick={() => say(w.say)}>🔊 كرر</button>
      </div>
      <div className="row nav">
        <button className="ghost" disabled={st.warmIdx === 0} onClick={() => startWarm(st.warmIdx - 1)}>السابق</button>
        <button className="primary" onClick={() => st.warmIdx < WARMUP.length - 1 ? startWarm(st.warmIdx + 1) : toIntro(0)}>{st.warmIdx < WARMUP.length - 1 ? 'التالي ←' : 'خلصنا الإحماء، يلا للتمرين ←'}</button>
      </div>
    </div>);
  }

  if (st.phase === 'EXERCISE_INTRO' && ex) return (
    <div className="session">{Top}
      <div className="stage-label">التمرين {st.exIdx + 1} / {items.length} — شرح الحركة {item.optional && <span className="tag">اختياري</span>}</div>
      <div className="fig-wrap"><span className="num-badge">{ex.id}</span><Figure anim={ex.anim} hi={ex.hi} slow={slow || true} replay={replay} /></div>
      <div className="row tight"><button className="ghost sm" onClick={() => setSlow(!slow)}>{slow ? 'سرعة عادية' : '🐢 بطيء جداً'}</button><button className="ghost sm" onClick={() => { setReplay(replay + 1); say(introScript(ex, item)); }}>↺ أعد الشرح</button></div>
      <h2 className="ex-name">{ex.ar}</h2><p className="en center">{ex.en}</p>
      <div className="prescr"><span>{totalSets} مجموعات</span><span>{item.reps}</span><span>راحة {restText(item.rest)}</span>{item.note && <span>{item.note}</span>}</div>
      <Teach ex={ex} />
      <button className="primary big" onClick={startSet}>فهمت — ابدأ المجموعة الأولى ▶</button>
      <div className="row nav"><button className="ghost" disabled={st.exIdx === 0} onClick={() => toIntro(st.exIdx - 1)}>التمرين السابق</button><button className="ghost" onClick={skipExercise}>تخطي التمرين</button><button className="ghost" onClick={() => toIntro(st.exIdx + 1)}>التالي</button></div>
    </div>);

  if (st.phase === 'ACTIVE_SET' && ex) {
    const running = !!st.clock?.since; const w = parseFloat(weightDraft) || 0;
    return (<div className="session">{Top}
      <div className="stage-label">{ex.ar} — المجموعة <b>{st.set}</b> / {totalSets}</div>
      <div className="fig-wrap"><Figure anim={ex.anim} hi={ex.hi} slow={slow} replay={replay} paused={!running} /></div>
      <div className="prescr"><span>الهدف: {item.reps}</span>{item.perSide && <span>لكل جنب</span>}{item.note && <span>{item.note}</span>}<span>RIR {CYCLE[st.week - 1].rir}</span></div>
      {item.timed ? <div className={`timer ${rem < 4000 ? 'alert' : ''}`}>{fmt(rem)}</div> : <><div className="timer small-t">{fmtUp(st.clock ? elapsed(st.clock, now) : 0)}</div><RepCounter value={st.reps} target={item.repsMax} onChange={r => up({ reps: r })} label="العدّات اللي عملتها فعلاً" /></>}
      {ex.equip !== 'وزن الجسم' && <label className="weight">الوزن (كجم): <input inputMode="decimal" value={weightDraft} onChange={e => setWeightDraft(e.target.value)} placeholder="مثلاً 28" /></label>}
      {item.tempo && <label className="small check"><input type="checkbox" checked={metro} onChange={e => setMetro(e.target.checked)} /> مترونوم التمبو (3 ث نزول • 1 ث طلوع)</label>}
      <div className="coach-bubble small">{ex.breath}</div>
      <div className="row">
        <button className="primary big" onClick={() => { completeSet(); }}>✔ خلصت المجموعة</button>
      </div>
      <div className="row">
        <button className="ghost" onClick={togglePause}>{running ? '⏸ إيقاف مؤقت' : '▶ كمّل'}</button>
        {item.timed && <button className="ghost" onClick={() => up({ clock: newClock(item.timed!, true) })}>↺ إعادة التايمر</button>}
        <button className="ghost" onClick={() => { setReplay(replay + 1); up({ phase: 'EXERCISE_INTRO' }); }}>🎬 أعد الشرح</button>
        <button className="ghost" onClick={() => setSlow(!slow)}>{slow ? 'سرعة عادية' : '🐢 بطيء'}</button>
      </div>
      <div className="row nav"><button className="ghost" disabled={st.exIdx === 0} onClick={() => toIntro(st.exIdx - 1)}>التمرين السابق</button><button className="ghost" onClick={skipExercise}>تخطي التمرين</button><button className="ghost" onClick={() => { if (confirm('تروح للتمرين اللي بعده؟ المجموعات الباقية مش هتتسجل.')) toIntro(st.exIdx + 1); }}>التمرين التالي</button></div>
      {!item.timed && st.set === totalSets && w > 0 && <DoubleProg item={item} logs={st.logs.filter(l => l.item === st.exIdx)} reps={st.reps} />}
    </div>);
  }

  if (st.phase === 'REST' && item) {
    const nextIt = st.restNext === 'set' ? item : items[st.exIdx + 1]; const nextEx = nextIt ? EX(nextIt.ex) : null; const running = !!st.clock?.since;
    return (<div className="session rest">{Top}
      <div className="stage-label">راحة ✔ المجموعة {st.set} خلصت</div>
      <div className="coach-bubble">{MOTIVATE[(st.set + st.exIdx) % MOTIVATE.length]}</div>
      <div className={`timer huge ${rem < 10000 ? 'alert' : ''}`}>{fmt(rem)}</div>
      <div className="ring"><div style={{ width: `${100 - (rem / (st.clock?.dur || 1)) * 100}%` }} /></div>
      <div className="row"><button className="ghost" onClick={togglePause}>{running ? '⏸ إيقاف' : '▶ كمّل'}</button><button className="ghost" onClick={() => st.clock && up({ clock: { ...st.clock, dur: st.clock.dur + 30000 } })}>+30 ث</button><button className="primary" onClick={goAfterRest}>تخطي الراحة ⏭</button></div>
      {nextEx && <div className="card next"><span className="muted small">اللي جاي:</span><div className="row-flex"><Figure anim={nextEx.anim} hi={nextEx.hi} small /><div><b>{nextEx.ar}</b><div className="small muted">{st.restNext === 'set' ? `المجموعة ${st.set + 1} من ${totalSets}` : `${setsOf(nextIt!)} مجموعات × ${nextIt!.reps}`}</div></div></div></div>}
    </div>);
  }

  if (st.phase === 'CONDITIONING') {
    const running = !!st.clock?.since; const started = !!st.clock && (st.clock.since || st.clock.acc > 0);
    return (<div className="session">{Top}
      <div className="stage-label">دايرة الحرق — AMRAP</div>
      <p className="center muted">أكبر عدد لفّات في الوقت. اكتب عدد اللفات وحاول تزوّده الأسبوع الجاي.</p>
      {!started && <div className="row"><button className={st.condMin === 8 ? 'primary' : 'ghost'} onClick={() => up({ condMin: 8, clock: newClock(480) })}>8 دقايق</button><button className={st.condMin === 10 ? 'primary' : 'ghost'} onClick={() => up({ condMin: 10, clock: newClock(600) })}>10 دقايق</button></div>}
      <div className={`timer huge ${rem < 10000 && started ? 'alert' : ''}`}>{fmt(rem)}</div>
      <div className="circuit">{CONDITIONING.moves.map(m => <div key={m.en} className="card"><Figure anim={m.anim} small /><b>{m.reps}</b><span>{m.ar}</span></div>)}</div>
      <div className="rounds"><button className="ghost" onClick={() => up({ rounds: Math.max(0, st.rounds - 1) })}>−</button><div><b>{st.rounds}</b><span>لفّات</span></div><button className="primary" onClick={() => { up({ rounds: st.rounds + 1 }); beep(880, 90); }}>+ لفّة</button></div>
      <div className="row"><button className="ghost" onClick={togglePause}>{running ? '⏸ إيقاف' : started ? '▶ كمّل' : '▶ ابدأ'}</button><button className="primary" onClick={() => complete(st.logs, st.rounds)}>إنهاء وتسجيل ✔</button></div>
    </div>);
  }

  // COMPLETED
  const vol = st.logs.reduce((a, l) => a + l.weight * l.reps, 0);
  return (<div className="session">
    <div className="welcome card glow">
      <div className="big-emoji">🏆</div><h1>خلصنا {day.title}!</h1>
      <div className="stats"><div><b>{st.logs.length}</b><span>مجموعة</span></div><div><b>{Math.round((Date.now() - st.startedAt) / 60000)}</b><span>دقيقة</span></div><div><b>{Math.round(vol)}</b><span>كجم حجم كلي</span></div>{day.conditioning && <div><b>{st.rounds}</b><span>لفّات حرق</span></div>}</div>
      <p className="muted">المرة الجاية: {DAYS[st.dayId % 6].title}. لو فوّت يوم، كمّل بالترتيب من مكان ما وقفت.</p>
      <button className="primary big" onClick={() => { localStorage.removeItem(SESSION_KEY); onExit(); }}>رجوع للرئيسية</button>
    </div>
  </div>);
}

function introScript(ex: ReturnType<typeof EX>, item: Item) {
  return `التمرين ده اسمه ${ex.ar}. ${ex.en}.
هنشتغل على: ${ex.muscles.replace(/—/g, '، و')}.
الأداة: ${ex.equip}.
وضع البداية: ${ex.start}.
${ex.steps.join('\n')}
التنفس: ${ex.breath}
خلي بالك من الأخطاء دي: ${ex.mistakes.join(' ')}
${item.note ? 'ملاحظة: ' + item.note + '.' : ''} لما تكون فاهم الحركة، دوس ابدأ.`;
}

function Teach({ ex }: { ex: ReturnType<typeof EX> }) {
  return (<div className="teach">
    <div className="card"><h4>🎯 العضلات</h4><p>{ex.muscles}</p><h4>🏋️ الأداة</h4><p>{ex.equip}</p></div>
    <div className="card two"><div><h4>البداية</h4><p>{ex.start}</p></div><div><h4>النهاية</h4><p>{ex.end}</p></div></div>
    <div className="card"><h4>الخطوات</h4><ol>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
    <div className="card breath"><h4>🌬️ التنفس</h4><p>{ex.breath}</p></div>
    <div className="card warn"><h4>⚠️ أخطاء شائعة</h4><ul>{ex.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
    <div className="card tip"><p>💡 {ex.tip}</p></div>
  </div>);
}

function RepCounter({ value, target, onChange, label = 'العدّات' }: { value: number; target: number; onChange: (n: number) => void; label?: string }) {
  return (<div className="reps"><span className="muted small">{label}{target ? ` (الهدف ${target})` : ''}</span>
    <div className="rounds"><button className="ghost" onClick={() => onChange(Math.max(0, value - 1))}>−</button><div><b>{value}</b></div><button className="primary" onClick={() => { onChange(value + 1); beep(740, 50, 0.12); }}>+</button></div></div>);
}

function DoubleProg({ item, logs, reps }: { item: Item; logs: SetLog[]; reps: number }) {
  const all = [...logs.map(m => m.reps), reps];
  if (!item.repsMax || !all.every(r => r >= item.repsMax)) return null;
  return <div className="card tip small">📈 عملت {item.repsMax} في كل المجموعات بتكنيك نضيف؟ حسب الـ Double Progression زوّد الوزن المرة الجاية وارجع لـ {item.repsMin}. (مش هيتغير لوحده — غيّره إنت من خانة الوزن.)</div>;
}
