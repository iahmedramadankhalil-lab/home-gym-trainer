export interface Item { ex: number; sets: number; reps: string; repsMin: number; repsMax: number; rest: number; note?: string; timed?: number; perSide?: boolean; tempo?: boolean; optional?: boolean; max?: boolean; }
export interface Day { id: number; weekday: string; title: string; en: string; focus: string; color: string; duration: string; items: Item[]; conditioning: boolean; }

const it = (ex: number, sets: number, reps: string, rest: number, o: Partial<Item> = {}): Item => {
  const m = reps.match(/(\d+)[–-](\d+)/); const n = reps.match(/\d+/);
  const lo = m ? Math.min(+m[1], +m[2]) : n ? +n[0] : 0; const hi = m ? Math.max(+m[1], +m[2]) : lo;
  return { ex, sets, reps, repsMin: lo, repsMax: hi, rest, ...o };
};

export const DAYS: Day[] = [
  { id: 1, weekday: 'السبت', title: 'دفع (A) — قوة', en: 'Push A — Strength', focus: 'صدر • كتف • تراي', color: '#e4572e', duration: '45–55 دقيقة', conditioning: false, items: [
    it(1, 4, '6–8', 120, { note: 'RIR 1–2' }), it(2, 4, '6–8', 120, { note: 'RIR 1–2' }), it(3, 3, '10–12', 75, { note: 'نزول 3 ث', tempo: true }),
    it(4, 3, '12–15', 60, { note: 'RIR 1' }), it(5, 3, '10–12', 60, { note: 'RIR 1' }), it(6, 2, 'أقصى عدد (RIR 1)', 60, { note: 'آخر تمرين', max: true }),
    it(18, 2, '40 ث', 45, { timed: 40, optional: true, note: 'بطن خفيف اختياري' })] },
  { id: 2, weekday: 'الأحد', title: 'سحب (A) — قوة', en: 'Pull A — Strength', focus: 'ضهر • كتف خلفي • باي', color: '#2f7fe0', duration: '45–55 دقيقة', conditioning: false, items: [
    it(7, 4, '6–8', 120, { note: 'RIR 1–2' }), it(8, 3, '8–10 / إيد', 90, { note: 'وقفة ثانية فوق', perSide: true }), it(9, 3, '10–12', 75, { note: 'فرد كامل' }),
    it(10, 3, '12–15', 60, { note: 'وزن خفيف' }), it(11, 3, '8–10', 75, { note: 'نزول 3 ث', tempo: true }), it(12, 2, '10–12', 60, { note: 'RIR 1' }),
    it(29, 2, '12', 45, { note: 'آخر التمرين' })] },
  { id: 3, weekday: 'الاثنين', title: 'رجل (A) + بطن — قوة', en: 'Legs A + Abs — Strength', focus: 'فخد أمامي • خلفية • مقعدة • سمانة • بطن', color: '#2a9d8f', duration: '45–55 دقيقة', conditioning: false, items: [
    it(13, 4, '8–10 / رجل', 90, { note: 'RIR 1–2', perSide: true }), it(14, 4, '8–10', 120, { note: 'نزول 3 ث', tempo: true }), it(15, 3, '12–15', 75, { note: 'وقفة 2 ث تحت' }),
    it(16, 3, '12', 60, { note: 'عصرة 2 ث' }), it(17, 3, '12–15 / رجل', 45, { note: 'وقفة تحت', perSide: true }), it(18, 3, '40–60 ث', 45, { timed: 40, note: 'زوّد لحد 60 ث' }),
    it(19, 3, '12', 45)] },
  { id: 4, weekday: 'الثلاثاء', title: 'دفع (B) — تضخيم + حرق', en: 'Push B — Hypertrophy + Conditioning', focus: 'صدر • كتف • تراي', color: '#e4572e', duration: '50–60 دقيقة', conditioning: true, items: [
    it(20, 4, '10–12', 90, { note: 'RIR 1', tempo: true }), it(21, 3, '10–12', 90, { note: 'RIR 1' }), it(22, 3, 'أقصى عدد (RIR 2)', 60, { max: true }),
    it(4, 4, '15–20', 45, { note: 'آخر مجموعة لحد الفشل' }), it(23, 3, '10–12', 60, { note: 'RIR 1' }), it(24, 2, 'أقصى عدد (RIR 1)', 60, { max: true })] },
  { id: 5, weekday: 'الأربعاء', title: 'سحب (B) — تضخيم + حرق', en: 'Pull B — Hypertrophy + Conditioning', focus: 'ضهر • ترابيس • كتف خلفي • باي', color: '#2f7fe0', duration: '50–60 دقيقة', conditioning: true, items: [
    it(25, 4, '10–12', 90, { note: 'RIR 1' }), it(8, 3, '12–15 / إيد', 60, { note: 'نزول 3 ث', perSide: true, tempo: true }), it(26, 3, '12–15', 60, { note: 'وقفة ثانية فوق' }),
    it(10, 3, '15–20', 45), it(27, 3, '10–12 / إيد', 60, { note: 'RIR 1', perSide: true }), it(28, 2, '12–15 / إيد', 45, { note: 'لحد الفشل', perSide: true }), it(29, 3, '12', 45)] },
  { id: 6, weekday: 'الخميس', title: 'رجل (B) + بطن — تضخيم + حرق', en: 'Legs B + Abs — Hypertrophy + Conditioning', focus: 'فخد أمامي • خلفية • مقعدة • سمانة • بطن', color: '#2a9d8f', duration: '50–60 دقيقة', conditioning: true, items: [
    it(30, 4, '10–12 / رجل', 90, { note: 'RIR 1', perSide: true }), it(31, 3, '10–12 / رجل', 75, { note: 'نزول 3 ث', perSide: true, tempo: true }), it(32, 4, '10–12', 90, { note: 'عصرة 2 ث' }),
    it(15, 3, '10 (نسخة 1½)', 75, { note: 'نسخة 1½' }), it(17, 4, '15–20 / رجل', 45, { perSide: true }), it(33, 3, '10 / جنب', 45, { perSide: true }), it(34, 3, '20', 45)] },
];

export interface WarmMove { ar: string; en: string; anim: string; secs?: number; reps?: number; say: string; why: string; }
export const WARMUP: WarmMove[] = [
  { ar: 'جري في المكان أو نط حبل وهمي', en: 'Jog in place / imaginary rope', anim: 'jog', secs: 120, why: 'يرفع حرارة الجسم ونبض القلب', say: 'هنبدأ بالإحماء. اجري في المكان أو نط حبل وهمي لمدة دقيقتين. خليك خفيف على صوابع رجلك.' },
  { ar: 'لف الكتف والدراع دواير', en: 'Shoulder & arm circles', anim: 'circles', reps: 20, why: 'يجهّز مفصل الكتف', say: 'لف دراعاتك دواير، عشرة لقدام وعشرة لورا. الحركة واسعة وهادية.' },
  { ar: 'سكوات بوزن الجسم', en: 'Bodyweight squat', anim: 'bwSquat', reps: 10, why: 'الركبة والحوض', say: 'عشر سكوات بوزن جسمك. انزل كأنك بتقعد على كرسي، وصدرك مرفوع.' },
  { ar: 'ميل الحوض (Good Morning) وإيدك على صدرك', en: 'Good Morning', anim: 'goodMorning', reps: 10, why: 'الخلفية وأسفل الضهر', say: 'حط إيدك على صدرك، وارجع بمقعدتك لورا وضهرك مستقيم، عشر مرات.' },
  { ar: 'ضغط على الركبة أو الحيطة', en: 'Wall / knee push-up', anim: 'kneePush', reps: 10, why: 'الصدر والكتف', say: 'عشر ضغط على ركبك أو على الحيطة. جسمك مستقيم.' },
  { ar: 'مجموعتين تسخين لأول تمرين', en: 'Ramp-up sets', anim: 'ramp', reps: 15, why: 'يعلّم الجهاز العصبي الحركة', say: 'دلوقتي مجموعتين تسخين لأول تمرين: الأولى خمسين في المية من وزنك عشر عدات، والتانية خمسة وسبعين في المية خمس عدات.' },
];

export const CONDITIONING = {
  minutes: [8, 10],
  moves: [{ ar: 'جوبلت سكوات', en: 'Goblet Squat', reps: '12', anim: 'goblet' }, { ar: 'ضغط', en: 'Push-Up', reps: '10', anim: 'pushup' },
    { ar: 'سحب دمبل منحني بالإيدين', en: 'Bent-Over DB Row (both arms)', reps: '10', anim: 'row' }, { ar: 'Mountain Climbers', en: 'Mountain Climbers', reps: '20 ث', anim: 'climber' }],
};

export const CYCLE = [
  { w: 1, goal: 'تعلّم وأرقام البداية', how: 'RIR 2–3 في كل حاجة. سجّل أوزانك وعدّاتك. ركّز على التكنيك.', rir: '2–3' },
  { w: 2, goal: 'تدرج', how: 'RIR 1–2. زوّد عدّة أو وزن كل مرة بالـ Double Progression.', rir: '1–2' },
  { w: 3, goal: 'تدرج', how: 'RIR 1–2. زوّد عدّة أو وزن كل مرة بالـ Double Progression.', rir: '1–2' },
  { w: 4, goal: 'ضغط', how: 'RIR 0–1 في آخر مجموعة من كل تمرين عزل. زوّد مجموعة للعضلة اللي متأخرة.', rir: '0–1' },
  { w: 5, goal: 'ضغط', how: 'RIR 0–1 في آخر مجموعة من كل تمرين عزل. زوّد مجموعة للعضلة اللي متأخرة.', rir: '0–1' },
  { w: 6, goal: 'تخفيف (Deload)', how: 'نص عدد المجموعات، نفس الأوزان، RIR 3. الجسم بيبني وإنت مرتاح.', rir: '3' },
];
export const RIR_TEXT = 'RIR = عدد العدّات اللي كان ممكن تعملها زيادة. يعني RIR 1 = وقفت وإنت قادر تعمل عدّة واحدة كمان بتكنيك نضيف. لو الوزن خفيف، زوّد العدّات لحد ما توصل للـ RIR المطلوب.';
export const SAFETY = [
  'وجع العضلة يوم أو اتنين بعد التمرين طبيعي. لكن وجع حاد في مفصل، أو وجع بيزيد مع التمرين، أو تنميل — وقّف التمرين واستشير دكتور أو أخصائي علاج طبيعي.',
  'متضحيش بالتكنيك عشان تزوّد الوزن.',
  'الطارات على البار من غير قفل: ركّب قفل (كولار) أو لف شريط لاصق قوي على طرف البار — خصوصاً في الضغط فوق الراس والسكل كراشر.',
  'اتمرّن على السجادة مش على الرخام.',
  'اتأكد إن الكنبة أو الكرسي ثابتين ومش هيتزحلقوا (ضهرها للحيطة).',
  'متكتمش نفسك لفترة طويلة — طلّع النفس في الجزء الصعب.',
  'لو عندك أي مشكلة صحية أو إصابة قديمة، راجع دكتور قبل ما تبدأ. البرنامج إرشادي ومش بديل عن استشارة طبية.',
];
