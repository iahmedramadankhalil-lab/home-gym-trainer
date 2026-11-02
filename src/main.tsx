import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, load, Profile, save, Settings } from './services/core';
import TrainingSession, { newSession, SESSION_KEY, SessionState } from './pages/TrainingSession';
import { ExerciseLibrary, Home, nextDayId, Progress, SafetyGate, SettingsPage, WeeklyProgram } from './pages/Pages';

type Tab = 'home' | 'program' | 'train' | 'library' | 'progress' | 'settings';
const TABS: [Tab, string, string][] = [['home', '🏠', 'الرئيسية'], ['program', '📅', 'البرنامج'], ['train', '▶️', 'ابدأ'], ['library', '📚', 'المكتبة'], ['progress', '📈', 'التقدم'], ['settings', '⚙️', 'الإعدادات']];

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [profile, setP] = useState<Profile>(() => ({ ...DEFAULT_PROFILE, ...load('hgt.profile', DEFAULT_PROFILE) }));
  const [settings, setS] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load('hgt.settings', DEFAULT_SETTINGS) }));
  const [session, setSession] = useState<SessionState | null>(() => load<SessionState | null>(SESSION_KEY, null));
  const [inSession, setIn] = useState(false);
  const [pendingDay, setPending] = useState<number | null>(null);
  const setProfile = (p: Profile) => { setP(p); save('hgt.profile', p); };
  const setSettings = (s: Settings) => { setS(s); save('hgt.settings', s); };
  useEffect(() => { window.scrollTo(0, 0); }, [tab, inSession]);

  const start = (dayId: number) => {
    if (!settings.safetyAck) { setPending(dayId); return; }
    if (session && session.phase !== 'COMPLETED' && !confirm('عندك جلسة مش مكتملة. تبدأ جلسة جديدة بدالها؟')) { setIn(true); return; }
    const s = newSession(dayId, profile); setSession(s); setIn(true);
  };
  if (pendingDay) return <SafetyGate onAck={() => { setSettings({ ...settings, safetyAck: true }); const d = pendingDay; setPending(null); const s = newSession(d, profile); setSession(s); setIn(true); }} />;
  if (inSession && session) return <TrainingSession st={session} setSt={setSession} profile={profile} setProfile={setProfile} settings={settings} onExit={() => { setIn(false); setSession(load(SESSION_KEY, null)); setTab('home'); }} />;

  const resume = session && session.phase !== 'COMPLETED' ? session : null;
  return (<div className="app">
    <main>
      {tab === 'home' && <Home profile={profile} onStart={start} resume={resume} onResume={() => setIn(true)} />}
      {tab === 'program' && <WeeklyProgram profile={profile} onStart={start} />}
      {tab === 'library' && <ExerciseLibrary />}
      {tab === 'progress' && <Progress profile={profile} setProfile={setProfile} />}
      {tab === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} profile={profile} setProfile={setProfile} />}
    </main>
    <nav className="tabs">{TABS.map(([k, i, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => k === 'train' ? (resume ? setIn(true) : start(nextDayId(profile))) : setTab(k)}><span>{i}</span>{l}</button>)}</nav>
  </div>);
}
createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      const urls = [...new Set([...document.querySelectorAll('script[src],link[href]')].map(e => (e as HTMLScriptElement).src || (e as HTMLLinkElement).href).filter(u => u.startsWith(location.origin)))];
      const send = () => (reg.active || navigator.serviceWorker.controller)?.postMessage({ type: 'PRECACHE', urls });
      navigator.serviceWorker.ready.then(send);
    });
  });
}
