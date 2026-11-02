import { useEffect, useState } from 'react';
import Figure from '../components/ExerciseAnimation/Figure';
import { EX, EXERCISES } from '../data/exercises';
import { CONDITIONING, CYCLE, DAYS, RIR_TEXT, SAFETY, WARMUP } from '../data/schedule';
import { arabicVoices, beep, cycleWeek, DEFAULT_PROFILE, pickVoice, Profile, Settings, speak } from '../services/core';

const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const nextDayId = (p: Profile) => (p.lastDay % 6) + 1;

export function Home({ profile, onStart, resume, onResume }: { profile: Profile; onStart: (id: number) => void; resume: { dayId: number } | null; onResume: () => void }) {
  const next = DAYS[nextDayId(profile) - 1]; const todayName = WD[new Date().getDay()]; const week = cycleWeek(profile);
  const lastSess = [...profile.history].reverse()[0];
  return (<div className="page">
    <header className="hero"><p className="muted">النهاردة {todayName} • أسبوع {week} من 6 — {CYCLE[week - 1].goal}</p><h1>مدربك الشخصي 💪</h1></header>
    {resume && <div className="card glow"><b>عندك جلسة مش مكتملة: {DAYS[resume.dayId - 1].title}</b><button className="primary" onClick={onResume}>كمّل من مكان ما وقفت ▶</button></div>}
    <div className="card glow today" style={{ borderColor: next.color }}>
      <span className="muted small">التمرين الجاي بالترتيب</span><h2 style={{ color: next.color }}>{next.title}</h2><p className="muted">{next.en} • {next.focus}</p>
      <p className="small">{next.items.length} تمارين • {next.duration}{next.conditioning ? ' • + دايرة حرق' : ''}</p>
      <div className="mini-figs">{next.items.slice(0, 4).map(i => <Figure key={i.ex} anim={EX(i.ex).anim} hi={EX(i.ex).hi} small />)}</div>
      <button className="primary big" onClick={() => onStart(next.id)}>ابدأ تمرين النهاردة ▶</button>
      {todayName === 'الجمعة' && <p className="small muted">النهاردة يوم الراحة في الجدول: مشي 30–45 دقيقة + إطالة. ولو حابب تتمرن، كمّل بالترتيب.</p>}
      <p className="small muted">لو فوّت يوم، كمّل بالترتيب من مكان ما وقفت — متقفزش على اليوم اللي بعده.</p>
    </div>
    <div className="card"><h3>آخر جلسة</h3>{lastSess ? <p>{DAYS[lastSess.dayId - 1].title} — {new Date(lastSess.date).toLocaleDateString('ar-EG')} — {lastSess.sets.length} مجموعة{lastSess.completed ? '' : ' (مش مكتملة)'}</p> : <p className="muted">لسه مفيش. أول تمرين هيبقى أسبوع تعلّم بـ RIR 2–3.</p>}</div>
  </div>);
}

export function WeeklyProgram({ onStart, profile }: { onStart: (id: number) => void; profile: Profile }) {
  const [open, setOpen] = useState<number | null>(nextDayId(profile));
  const deload = cycleWeek(profile) === 6;
  return (<div className="page"><h1>البرنامج الأسبوعي</h1>
    <div className="card small">كل عضلة مرتين في الأسبوع: يوم A للقوة (عدّات قليلة وتقل أعلى) ويوم B للتضخيم والحرق. الجمعة راحة: مشي 30–45 د + إطالة.{deload && <b> • الأسبوع ده Deload: نص عدد المجموعات.</b>}</div>
    {DAYS.map(d => <div key={d.id} className="card day" style={{ borderInlineStartColor: d.color }}>
      <button className="day-head" onClick={() => setOpen(open === d.id ? null : d.id)}><span>اليوم {d.id} • {d.weekday}</span><b>{d.title}</b><span className="muted small">{d.focus}</span></button>
      {open === d.id && <><table><thead><tr><th>#</th><th>التمرين</th><th>مج</th><th>عدّات</th><th>راحة</th><th>ملاحظة</th></tr></thead><tbody>
        {d.items.map((i, k) => <tr key={k}><td><span className="num">{i.ex}</span></td><td>{EX(i.ex).ar}<div className="en">{EX(i.ex).en}</div></td><td>{deload ? Math.ceil(i.sets / 2) : i.sets}</td><td>{i.reps}</td><td>{i.rest >= 120 ? i.rest / 60 + ' د' : i.rest + ' ث'}</td><td className="small">{i.note}{i.optional ? ' (اختياري)' : ''}</td></tr>)}
      </tbody></table>
        {d.conditioning && <p className="small">🔥 في الآخر: دايرة الحرق {CONDITIONING.minutes.join('–')} دقايق AMRAP: {CONDITIONING.moves.map(m => `${m.reps} ${m.ar}`).join(' ← ')}.</p>}
        <p className="small muted">المدة المتوقعة: {d.duration}. لو الوقت ضيّق، شيل آخر مجموعة من كل تمرين عزل — متشيلش التمارين الكبيرة.</p>
        <button className="primary" onClick={() => onStart(d.id)}>ابدأ اليوم ده ▶</button></>}
    </div>)}
    <div className="card"><h3>الإحماء قبل كل تمرينة (7–8 دقايق)</h3><ol>{WARMUP.map(w => <li key={w.en}>{w.ar} — {w.secs ? '2 دقيقة' : w.anim === 'circles' ? '10 + 10' : w.anim === 'ramp' ? '50% × 10 ثم 75% × 5' : '10'} <span className="muted small">({w.why})</span></li>)}</ol></div>
  </div>);
}

export function ExerciseLibrary() {
  const [sel, setSel] = useState<number | null>(null); const [q, setQ] = useState(''); const [slow, setSlow] = useState(false);
  const list = EXERCISES.filter(e => !q || e.ar.includes(q) || e.en.toLowerCase().includes(q.toLowerCase()) || String(e.id) === q);
  if (sel) { const e = EX(sel); return (<div className="page"><button className="ghost sm" onClick={() => setSel(null)}>→ رجوع للمكتبة</button>
    <div className="fig-wrap"><span className="num-badge">{e.id}</span><Figure anim={e.anim} hi={e.hi} slow={slow} /></div>
    <div className="row tight"><button className="ghost sm" onClick={() => setSlow(!slow)}>{slow ? 'سرعة عادية' : '🐢 بطيء'}</button></div>
    <h2 className="ex-name">{e.ar}</h2><p className="en center">{e.en} • {e.days}</p>
    <div className="card"><h4>🎯 العضلات</h4><p>{e.muscles}</p><h4>🏋️ الأداة</h4><p>{e.equip}</p></div>
    <div className="card two"><div><h4>البداية</h4><p>{e.start}</p></div><div><h4>النهاية</h4><p>{e.end}</p></div></div>
    <div className="card"><h4>الخطوات</h4><ol>{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
    <div className="card breath"><h4>🌬️ التنفس</h4><p>{e.breath}</p></div>
    <div className="card warn"><h4>⚠️ أخطاء شائعة</h4><ul>{e.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
    <div className="card tip"><p>💡 {e.tip}</p></div>
  </div>); }
  return (<div className="page"><h1>مكتبة التمارين ({EXERCISES.length})</h1><input className="search" placeholder="دوّر بالاسم أو الرقم" value={q} onChange={e => setQ(e.target.value)} />
    <p className="small muted">البرتقالي = العضلة اللي شغّالة • الخيال الرمادي = وضع البداية • السهم الأزرق = اتجاه الحركة. الرسومات تبسيطية للتوضيح، مش محاكاة تشريحية دقيقة.</p>
    <div className="grid">{list.map(e => <button key={e.id} className="card lib" onClick={() => setSel(e.id)}><span className="num">{e.id}</span><Figure anim={e.anim} hi={e.hi} small /><b>{e.ar}</b><span className="en">{e.en}</span></button>)}</div></div>);
}

function Spark({ pts }: { pts: number[] }) {
  if (pts.length < 2) return <span className="muted small">محتاج جلستين على الأقل</span>;
  const mx = Math.max(...pts), mn = Math.min(...pts), r = mx - mn || 1;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 200},${46 - ((v - mn) / r) * 40}`).join(' ');
  return <svg viewBox="0 0 200 50" className="spark"><polyline points={d} fill="none" stroke="#ff6a2b" strokeWidth={2.5} /></svg>;
}
export function Progress({ profile, setProfile }: { profile: Profile; setProfile: (p: Profile) => void }) {
  const [bw, setBw] = useState(''); const week = cycleWeek(profile);
  const hist = [...profile.history].reverse();
  const weekAgo = Date.now() - 7 * 864e5; const thisWeek = profile.history.filter(h => new Date(h.date).getTime() > weekAgo);
  const exStats = EXERCISES.map(e => { const s = profile.history.flatMap(h => h.sets.filter(x => x.ex === e.id).map(x => ({ ...x, date: h.date }))); const bySess = profile.history.map(h => Math.max(0, ...h.sets.filter(x => x.ex === e.id).map(x => x.weight))).filter(v => v > 0); return { e, s, bySess }; }).filter(x => x.s.length);
  return (<div className="page"><h1>التقدم</h1>
    <div className="card"><h3>دورة الـ 6 أسابيع — إنت في أسبوع {week}</h3>
      <div className="cycle">{CYCLE.map(c => <div key={c.w} className={c.w === week ? 'on' : ''}><b>{c.w}</b><span>{c.goal}</span><small>RIR {c.rir}</small></div>)}</div>
      <p className="small">{CYCLE[week - 1].how}</p><p className="small muted">{RIR_TEXT}</p>
      <p className="small muted">التدرج (Double Progression): ابدأ بوزن تعمل بيه أقل الرينج. كل مرة حاول تزوّد عدّة. لما توصل لأعلى الرينج في كل المجموعات بتكنيك نضيف، زوّد الوزن وارجع لأقل الرينج. مفيش وزن أتقل؟ بالترتيب: نزول أبطأ (3–4 ث) ← وقفة ثانيتين في أصعب نقطة ← عدّات 1½ ← راحة أقل ← مجموعة زيادة. بعد أسبوع 6 ارجع لأسبوع 2 بأرقامك الجديدة.</p>
      <label className="small">بداية الدورة: <input type="date" value={profile.cycleStart} onChange={e => setProfile({ ...profile, cycleStart: e.target.value, weekOverride: null })} /></label>
      <label className="small"> أو حدد الأسبوع يدوي: <select value={profile.weekOverride ?? ''} onChange={e => setProfile({ ...profile, weekOverride: e.target.value ? +e.target.value : null })}><option value="">تلقائي</option>{CYCLE.map(c => <option key={c.w} value={c.w}>{c.w}</option>)}</select></label>
    </div>
    <div className="card"><h3>الأسبوع ده</h3><p>{thisWeek.length} جلسات • {thisWeek.reduce((a, h) => a + h.sets.length, 0)} مجموعة</p>
      <div className="week-dots">{DAYS.map(d => <span key={d.id} className={thisWeek.some(h => h.dayId === d.id && h.completed) ? 'done' : ''}>{d.id}</span>)}</div></div>
    <div className="card"><h3>وزن الجسم</h3><div className="row"><input inputMode="decimal" placeholder="كجم" value={bw} onChange={e => setBw(e.target.value)} /><button className="primary" onClick={() => { const kg = parseFloat(bw); if (kg) { setProfile({ ...profile, bodyWeights: [...profile.bodyWeights, { date: new Date().toISOString().slice(0, 10), kg }] }); setBw(''); } }}>سجّل</button></div>
      <Spark pts={profile.bodyWeights.map(b => b.kg)} />{profile.bodyWeights.slice(-5).reverse().map((b, i) => <div key={i} className="small">{b.date}: {b.kg} كجم</div>)}
      <p className="small muted">اوزن نفسك الصبح 3–4 مرات في الأسبوع وخد المتوسط. لو أوزان التمرين طالعة والوسط ثابت أو نازل = بتبني عضل وبتحرق دهون.</p></div>
    <div className="card"><h3>أوزان الشغل الحالية</h3><p className="small muted">الأوزان مش بتتغير لوحدها — إنت اللي بتأكد أي زيادة.</p>
      <div className="weights">{EXERCISES.filter(e => e.equip !== 'وزن الجسم').map(e => <label key={e.id}><span className="num">{e.id}</span> {e.ar}<input inputMode="decimal" value={profile.weights[e.id] ?? ''} onChange={ev => setProfile({ ...profile, weights: { ...profile.weights, [e.id]: parseFloat(ev.target.value) || 0 } })} /></label>)}</div></div>
    <div className="card"><h3>أداء التمارين</h3>{exStats.length ? exStats.map(({ e, s, bySess }) => <div key={e.id} className="ex-stat"><b>{e.id}. {e.ar}</b><span className="small muted"> آخر: {s.slice(-3).map(x => x.weight ? `${x.weight}×${x.reps}` : x.secs ? `${x.secs}ث` : `${x.reps}`).join('، ')}</span><Spark pts={bySess} /></div>) : <p className="muted">ابدأ أول جلسة وهتظهر هنا.</p>}</div>
    <div className="card"><h3>ملاحظات التمرين</h3><textarea value={profile.notes} onChange={e => setProfile({ ...profile, notes: e.target.value })} rows={4} placeholder="مثلاً: الكتف الشمال أضعف…" /></div>
    <div className="card"><h3>سجل الجلسات</h3>{hist.length ? hist.map(h => <details key={h.id}><summary>{new Date(h.date).toLocaleDateString('ar-EG')} — {DAYS[h.dayId - 1].title} — {h.sets.length} مج • {h.minutes} د{h.rounds != null ? ` • ${h.rounds} لفّة` : ''}{h.completed ? ' ✔' : ' (ناقصة)'}</summary>
      <table><tbody>{h.sets.map((s, i) => <tr key={i}><td>{EX(s.ex).ar}</td><td>مج {s.set}</td><td>{s.weight ? `${s.weight} كجم × ${s.reps}` : s.secs ? `${s.secs} ث` : `${s.reps} عدة`}</td></tr>)}</tbody></table></details>) : <p className="muted">مفيش جلسات لسه.</p>}</div>
  </div>);
}

export function SettingsPage({ settings, setSettings, profile, setProfile }: { settings: Settings; setSettings: (s: Settings) => void; profile: Profile; setProfile: (p: Profile) => void }) {
  const [voices, setVoices] = useState(arabicVoices());
  useEffect(() => { const f = () => setVoices(arabicVoices()); f(); if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = f; }, []);
  const cur = pickVoice(settings.voiceURI);
  const exportData = () => { const b = new Blob([JSON.stringify({ profile, settings }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'home-gym-backup.json'; a.click(); };
  const importData = (f: File) => f.text().then(t => { try { const d = JSON.parse(t); if (d.profile) setProfile({ ...DEFAULT_PROFILE, ...d.profile }); alert('تم الاسترجاع'); } catch { alert('الملف مش صالح'); } });
  return (<div className="page"><h1>الإعدادات</h1>
    <div className="card"><h3>🔊 المدرب الصوتي</h3>
      <label className="check"><input type="checkbox" checked={settings.voice} onChange={e => setSettings({ ...settings, voice: e.target.checked })} /> تشغيل الصوت</label>
      <label>الصوت: <select value={settings.voiceURI} onChange={e => setSettings({ ...settings, voiceURI: e.target.value })}><option value="">تلقائي (مصري لو موجود)</option>{voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} — {v.lang}</option>)}</select></label>
      <p className="small muted">{voices.length ? `مستخدم دلوقتي: ${cur?.name} (${cur?.lang})` : 'مفيش صوت عربي متثبت على الجهاز ده — النص هيفضل ظاهر. على أندرويد: Settings ← Text-to-speech ← نزّل اللغة العربية. على iPhone: Settings ← Accessibility ← Spoken Content ← Voices ← Arabic.'}</p>
      <p className="small muted">نطق الصوت بيعتمد على الأصوات المتثبتة في جهازك؛ أغلب الأجهزة فيها عربي فصحى/خليجي بس، فالنطق ممكن ميبقاش مصري 100% حتى لو النص مكتوب بالمصري.</p>
      <label>مستوى الصوت <input type="range" min={0} max={1} step={0.1} value={settings.volume} onChange={e => setSettings({ ...settings, volume: +e.target.value })} /></label>
      <label>سرعة الكلام <input type="range" min={0.6} max={1.4} step={0.05} value={settings.rate} onChange={e => setSettings({ ...settings, rate: +e.target.value })} /> {settings.rate.toFixed(2)}</label>
      <label className="check"><input type="checkbox" checked={settings.spokenCount} onChange={e => setSettings({ ...settings, spokenCount: e.target.checked })} /> عدّ تنازلي بالصوت (3، 2، 1)</label>
      <label className="check"><input type="checkbox" checked={settings.beeps} onChange={e => setSettings({ ...settings, beeps: e.target.checked })} /> تنبيهات صوتية (بيب)</label>
      <button className="ghost" onClick={() => { beep(); speak('يلا نبدأ المجموعة الأولى. خلي ضهرك ثابت. انزل ببطء. ممتاز، اطلع لفوق.', settings); }}>جرّب الصوت</button></div>
    <div className="card"><h3>⚠️ الأمان</h3><ul>{SAFETY.map((s, i) => <li key={i} className="small">{s}</li>)}</ul></div>
    <div className="card"><h3>📴 الأوفلاين</h3><p className="small">بعد أول فتح وإنت أونلاين، التطبيق بيتخزن على جهازك ويشتغل من غير نت: التمارين، الأنيميشن، التايمر، والتسجيل. البيانات متخزنة على الجهاز ده بس (localStorage) — لو مسحت بيانات المتصفح هتضيع، فاعمل نسخة احتياطية. {navigator.onLine ? 'إنت أونلاين دلوقتي.' : 'إنت أوفلاين دلوقتي ✔'}</p>
      <div className="row"><button className="ghost" onClick={exportData}>تصدير نسخة احتياطية</button><label className="ghost btnlike">استرجاع<input type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && importData(e.target.files[0])} /></label></div></div>
    <div className="card"><h3>إعادة الضبط</h3><button className="danger" onClick={() => { if (confirm('هتمسح كل السجل والأوزان. متأكد؟')) { setProfile({ ...DEFAULT_PROFILE }); localStorage.removeItem('hgt.session'); } }}>مسح كل البيانات</button></div>
    <p className="small muted center">الملف ده إرشادي للياقة العامة ومش بديل عن استشارة طبية.</p>
  </div>);
}

export function SafetyGate({ onAck }: { onAck: () => void }) {
  return (<div className="page"><div className="card glow"><h2>⚠️ قبل أول تمرين</h2><ul>{SAFETY.map((s, i) => <li key={i}>{s}</li>)}</ul><button className="primary big" onClick={onAck}>فهمت، يلا بينا</button></div></div>);
}
