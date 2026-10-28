'use strict';
/* ================= PunArn prototype: core ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US');
const app = document.getElementById('app');

/* ---------- seeded random ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(2569);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- dates (demo clock: Mon 14 Sep 2569, 10:42) ---------- */
const DEMO = new Date(2026, 8, 14, 10, 42, 0);
const T0 = Date.now();
const now = () => new Date(DEMO.getTime() + (Date.now() - T0));
const TODAY = new Date(2026, 8, 14);
const TM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TMF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TD = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diffDays = (a, b) => Math.round((dayOnly(a) - dayOnly(b)) / 864e5);
const thDate = (d, long) => `${d.getDate()} ${(long ? TMF : TM)[d.getMonth()]} ${d.getFullYear() + 543}`;
const thShort = d => `${d.getDate()} ${TM[d.getMonth()]}`;
const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const firstCons = s => [...String(s)].find(c => THAI_CONS.includes(c) || /[a-z]/i.test(c)) || String(s)[0];
const thDay = d => `วัน${TD[d.getDay()]}ที่ ${d.getDate()} ${TMF[d.getMonth()]} ${d.getFullYear() + 543}`;
function nextSchoolDay(d) { let x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6) x = addDays(x, 1); return x; }
function dueText(due) {
  const n = diffDays(due, TODAY);
  if (n < 0) return { txt: `เกินกำหนด ${-n} วัน`, late: true, soon: true };
  if (n === 0) return { txt: 'ครบกำหนดคืนวันนี้', late: false, soon: true };
  if (n === 1) return { txt: `คืนภายในพรุ่งนี้ (${thShort(due)})`, late: false, soon: true };
  return { txt: `คืนภายใน ${thShort(due)} อีก ${n} วัน`, late: false, soon: n <= 2 };
}

/* ---------- school ---------- */
const SCHOOL = { name: 'โรงเรียนปันอ่านวิทยา', short: 'ปว', students: 812 };

/* ---------- books ---------- */
const BOOKS = window.__BOOKS;
const TYPE_GROUP = {
  'หนังสือเรียน/คู่มือเรียน': 'text', 'หนังสือเตรียมสอบ': 'exam', 'วรรณกรรมไทย': 'lit', 'วรรณคดีไทย': 'lit', 'วรรณกรรมแปล': 'lit',
  'วรรณกรรมภาษาอังกฤษ': 'lit', 'สารคดี/ความรู้ทั่วไป': 'nf', 'การ์ตูนความรู้': 'comic', 'หนังสืออ้างอิง': 'ref'
};
const TYPE_LABEL = { text: 'หนังสือเรียนและคู่มือ', exam: 'หนังสือเตรียมสอบ', lit: 'วรรณกรรมและนวนิยาย', nf: 'สารคดีและความรู้ทั่วไป', comic: 'การ์ตูนความรู้', ref: 'หนังสืออ้างอิง' };
const STATUS = { on: 'อยู่บนชั้น', out: 'ถูกยืม', ref: 'อ่านในห้องสมุดเท่านั้น', repair: 'ส่งซ่อม', lost: 'สูญหาย', gone: 'จำหน่ายออก' };
const norm = s => String(s || '').toLowerCase().normalize('NFC');
function prepBook(b) {
  b.s = b.s || (b.st === 'ถูกยืม' ? 'out' : String(b.st).startsWith('อ่าน') ? 'ref' : 'on');
  b.yce = +b.y > 2400 ? +b.y - 543 : +b.y;
  b.ybe = b.yce + 543;
  b.g = TYPE_GROUP[b.type] || 'nf';
  b.exam = b.exam || [];
  const h = hash(b.bc) % 40;
  b.pop = h + (b.g === 'exam' ? 26 : b.g === 'comic' ? 22 : b.type === 'วรรณกรรมแปล' ? 16 : b.g === 'lit' ? 8 : 0);
  b._idx = norm([b.t, b.a, b.p, b.subj, b.isbn, b.call, b.sub, b.exam.join(' '), b.type, b.bc, b.ed, b.note].join(' '));
  return b;
}
BOOKS.forEach(prepBook);
let BY = Object.fromEntries(BOOKS.map(b => [b.bc, b]));
const addBook = b => { prepBook(b); BOOKS.push(b); BY[b.bc] = b; return b; };
const nextBarcode = () => String(Math.max(...BOOKS.map(b => +b.bc)) + 1);
const shortTitle = t => String(t).split(' : ')[0].split(' = ')[0];
function lvlRange(l) { const m = String(l || '').match(/ม\.(\d)(?:\s*-\s*(\d))?/); return m ? [+m[1], +(m[2] || m[1])] : [1, 6]; }
const fitsGrade = (b, g) => { const [a, z] = lvlRange(b.lvl); return g >= a && g <= z; };
const visible = b => b.s !== 'gone';

/* ---------- students (simulated) ---------- */
const FN_M = ['ธนกร', 'ภูมิพัฒน์', 'ณัฐวุฒิ', 'กิตติพัศ', 'ปัณณวิชญ์', 'ธีรภัทร', 'ชยพล', 'ศุภกร', 'วรเมธ', 'อนุชา', 'พีรวิชญ์', 'ณภัทร', 'ภาคิน', 'รัชชานนท์', 'สิรวิชญ์', 'ธนวัฒน์', 'กฤษดา', 'ปุณณัตถ์', 'ณัฐภัทร', 'ศิวกร'];
const FN_F = ['ปวีณ์ธิดา', 'ณัฐณิชา', 'ชญานิศ', 'พิชชาภา', 'ธัญชนก', 'ชนัญชิดา', 'ปภาวรินทร์', 'ศิรประภา', 'อรนภา', 'กมลชนก', 'วรัญญา', 'ณัฐธิดา', 'พรรษชล', 'ภัทรวดี', 'สุพิชญา', 'จิรัชยา', 'ปุณยวีร์', 'ธนพร', 'อัญชิสา', 'เบญญาภา'];
const LN = ['ศรีสุข', 'วงศ์ทอง', 'แสงอรุณ', 'บุญมา', 'ทองดี', 'จันทร์เพ็ญ', 'สุขสวัสดิ์', 'รุ่งเรือง', 'ประเสริฐศรี', 'กิจเจริญ', 'มีสุข', 'ศักดิ์สิทธิ์', 'พูลผล', 'ชัยมงคล', 'สายบุญ', 'อินทร์แก้ว', 'เพชรรัตน์', 'นาคประเสริฐ', 'ดวงดี', 'ธรรมวงศ์', 'ใจดี', 'สมบูรณ์ผล', 'เรืองศรี', 'พรหมมา'];
const NK_M = ['ภูมิ', 'ต้นกล้า', 'ปั้น', 'บอส', 'ฟิวส์', 'ไอซ์', 'เจได', 'นนท์', 'กัปตัน', 'ปุณ', 'ธันวา', 'ภู'];
const NK_F = ['แพรว', 'มิ้นท์', 'ใบเตย', 'น้ำหวาน', 'ปาย', 'ฟ้าใส', 'ขนุน', 'อิงฟ้า', 'เฟิร์น', 'ข้าวหอม', 'ปริม', 'พลอย'];
const STUDENTS = [];
(function genStudents() {
  let i = 0;
  for (let g = 1; g <= 6; g++) for (let r = 1; r <= 4; r++, i++) {
    const size = i < 20 ? 34 : 33;
    for (let n = 1; n <= size; n++) {
      const f = rnd() < 0.52;
      const id = `${46 - g}${r}${String(n).padStart(2, '0')}`;
      STUDENTS.push({
        id, g, room: r, no: n, f,
        pre: g <= 3 ? (f ? 'ด.ญ.' : 'ด.ช.') : (f ? 'นางสาว' : 'นาย'),
        first: pick(f ? FN_F : FN_M), last: pick(LN), nick: pick(f ? NK_F : NK_M),
        mv: Math.floor(rnd() * rnd() * 10), ls: Math.floor(rnd() * rnd() * 12)
      });
    }
  }
})();
const SBY = Object.fromEntries(STUDENTS.map(s => [s.id, s]));
Object.assign(SBY['41208'], { f: true, pre: 'นางสาว', first: 'กัญญาณัฐ', last: 'ศรีสุข', nick: 'แพรว', mv: 6, ls: 9 });
Object.assign(SBY['43105'], { f: true, pre: 'ด.ญ.', first: 'ณิชาภัทร', last: 'วงศ์ทอง', nick: 'ปริม' });
Object.assign(SBY['40115'], { f: false, pre: 'นาย', first: 'ภาคิน', last: 'ชัยมงคล', nick: 'ภู', mv: 4 });
const cls = s => `ม.${s.g}/${s.room}`;
const fullName = s => `${s.pre}${s.first} ${s.last}`;
const STAFF = [
  { name: 'ครูวิไลวรรณ ทองคำ', role: 'ผู้ดูแลระดับโรงเรียน', note: 'ครูผู้รับผิดชอบห้องสมุด' },
  { name: 'ครูสมชาย ใจดี', role: 'ครูผู้รับผิดชอบห้องสมุด', note: 'ครูภาษาไทย' },
  { name: 'ครูอรอุมา แสงทอง', role: 'ครูประจำวิชา', note: 'ครูวิทยาศาสตร์' },
  { name: 'นายประเสริฐ มั่นคง', role: 'ผู้บริหารโรงเรียน', note: 'ผู้อำนวยการ (ดูอย่างเดียว)' }
];
const ASSIST_IDS = ['43105', '42214', '41330', '40407'];

/* ---------- app state (in memory only) ---------- */
const S = {
  role: 'teacher', student: null, offline: false, queue: [],
  policy: { max: 3, days: 7, renew: 1, block: false }, pin: '1234',
  loans: [], visits: [], log: [], drafts: [], classUse: [], labelQueue: [], audit: [], back: [],
  kioskOpened: false, circ: null, cat: null
};
(function genActivity() {
  const out = BOOKS.filter(b => b.s === 'out').map(b => b.bc);
  const mine = { '1000085': [8, 15], '1000184': [12, 19] };
  const others = STUDENTS.filter(s => s.id !== '41208' && s.id !== '40115');
  const overdueAgo = [3, 4, 6, 10, 11, 17];
  let oi = 0, ti = 0;
  out.forEach((bc, k) => {
    if (mine[bc]) { S.loans.push({ bc, sid: '41208', out: new Date(2026, 8, mine[bc][0]), due: new Date(2026, 8, mine[bc][1]) }); return; }
    let due;
    if (k % 3 === 1 && oi < overdueAgo.length) { due = addDays(TODAY, -overdueAgo[oi++]); while (due.getDay() === 0 || due.getDay() === 6) due = addDays(due, -1); }
    else if (ti < 5 && k % 3 === 2) { due = nextSchoolDay(addDays(TODAY, 7)); ti++; }
    else due = nextSchoolDay(addDays(TODAY, Math.floor(rnd() * 6) + 1));
    const sid = others[Math.floor(rnd() * others.length)].id;
    S.loans.push({ bc, sid, out: addDays(due, -7), due });
  });
  S.loans.filter(l => diffDays(l.out, TODAY) === 0).forEach((l, i) => S.log.push({ type: 'borrow', bc: l.bc, sid: l.sid, t: new Date(2026, 8, 14, 7, 20 + i * 6) }));
  ['1000012', '1000047', '1000160'].forEach((bc, i) => S.log.push({ type: 'return', bc, sid: others[i * 50].id, t: new Date(2026, 8, 14, 7, 35 + i * 9), late: i === 1 ? 2 : 0 }));
  const pool = others.slice();
  const take = () => pool.splice(Math.floor(rnd() * pool.length), 1)[0];
  for (let i = 0; i < 24; i++) S.visits.push({ sid: take().id, t: new Date(2026, 8, 14, 7, 2 + Math.floor(i * 2.1)), src: 'kiosk' });
  for (let i = 0; i < 38; i++) S.visits.push({ sid: take().id, t: new Date(2026, 8, 14, 9, 15 + Math.floor(i * 2.2)), src: 'kiosk' });
  S.visits.push({ sid: '40115', t: new Date(2026, 8, 14, 10, 31), src: 'kiosk' });
  S.visits.sort((a, b) => a.t - b.t);
  S.drafts.push({
    id: 'd1', by: '43105', at: new Date(2026, 8, 14, 9, 12), isbn: '9780060731335', t: 'Freakonomics : a rogue economist explores the hidden side of everything',
    ed: 'Revised and expanded ed.', a: 'Steven D. Levitt, Stephen J. Dubner', p: 'Harper Perennial', y: '2009', pg: '315', lang: 'อังกฤษ',
    type: 'สารคดี/ความรู้ทั่วไป', cls: '300 สังคมศาสตร์', ddc: '330', call: '330 LEV f', subj: 'Economics -- Sociological aspects', lvl: 'ม.4-6',
    loc: 'มุมหนังสือภาษาอังกฤษ (ชั้น 2)', cv: 'o|7352393', src: 'o:OL278022W', from: 'บริจาค', donor: 'ศิษย์เก่ารุ่น 2555'
  });
  S.drafts.push({
    id: 'd2', by: '42214', at: new Date(2026, 8, 14, 9, 40), isbn: '', t: 'ที่ระลึกครบรอบ 50 ปี โรงเรียนปันอ่านวิทยา', ed: '', a: 'โรงเรียนปันอ่านวิทยา',
    p: 'โรงเรียนปันอ่านวิทยา', y: '2568', pg: '120', lang: 'ไทย', type: 'สารคดี/ความรู้ทั่วไป', cls: '300 สังคมศาสตร์', ddc: '373.593',
    call: '373.593 ร ท', subj: 'โรงเรียนปันอ่านวิทยา -- ประวัติ', lvl: 'ม.1-6', loc: 'ชั้นหนังสือทั่วไป (ชั้น 1)', cv: '', from: 'ได้รับจากโรงเรียน', donor: ''
  });
  S.classUse = [
    { d: new Date(2026, 8, 2), slot: 'คาบ 3 (10:20–11:10)', teacher: 'ครูสมชาย ใจดี', subj: 'ภาษาไทย ท22101', room: 'ม.2/3', n: 34 },
    { d: new Date(2026, 8, 4), slot: 'คาบ 5 (13:00–13:50)', teacher: 'ครูอรอุมา แสงทอง', subj: 'วิทยาศาสตร์ ว21101', room: 'ม.1/2', n: 33 },
    { d: new Date(2026, 8, 9), slot: 'คาบ 2 (09:20–10:10)', teacher: 'ครูมาลี ศรีวงศ์', subj: 'ภาษาอังกฤษ อ31101', room: 'ม.4/1', n: 34 },
    { d: new Date(2026, 8, 11), slot: 'คาบ 6 (13:50–14:40)', teacher: 'ครูสมชาย ใจดี', subj: 'กิจกรรมส่งเสริมการอ่าน', room: 'ม.3/4', n: 33 }
  ];
  S.audit = [
    { t: new Date(2026, 8, 14, 9, 40), who: 'ด.ญ.ณิชาภัทร (ยุวบรรณารักษ์)', what: 'ส่งร่างระเบียน "ที่ระลึกครบรอบ 50 ปี..."' },
    { t: new Date(2026, 8, 11, 15, 2), who: 'ครูวิไลวรรณ ทองคำ', what: 'เปลี่ยนสถานะ 1000093 เป็น ส่งซ่อม' },
    { t: new Date(2026, 8, 10, 14, 25), who: 'ครูวิไลวรรณ ทองคำ', what: 'แก้นโยบายการยืม: 7 วัน 3 เล่ม' },
    { t: new Date(2026, 8, 3, 8, 10), who: 'ครูสมชาย ใจดี', what: 'บันทึกการเข้าใช้ย้อนหลัง 12 คน' }
  ];
})();
BY['1000093'] && (BY['1000093'].s = 'repair');
const loanOf = bc => S.loans.find(l => l.bc === bc);
const loansOf = sid => S.loans.filter(l => l.sid === sid);
const overdue = () => S.loans.filter(l => diffDays(l.due, TODAY) < 0).sort((a, b) => a.due - b.due);
const todayVisits = () => S.visits.filter(v => diffDays(v.t, TODAY) === 0);
const todayLog = type => S.log.filter(x => x.type === type && diffDays(x.t, TODAY) === 0);

/* ---------- union catalog (simulated shared records, real books) ---------- */
const UNION = [
  { isbn: '9789744723635', t: 'แฮร์รี่ พอตเตอร์กับห้องแห่งความลับ', ed: '', a: 'เจ. เค. โรว์ลิง', p: 'นานมีบุ๊คส์', y: '2544', pg: '', lang: 'ไทย', type: 'วรรณกรรมแปล', cls: '800 วรรณคดี/วรรณกรรม', ddc: '823.914', subj: 'นวนิยายอังกฤษ -- แปลเป็นภาษาไทย; แฮร์รี่ พอตเตอร์ (ตัวละคร)', lvl: 'ม.1-6', cv: 'o|6900538', src: 'o:Open Library', used: 31 },
  { isbn: '9780761169253', t: 'Steal Like an Artist : 10 things nobody told you about being creative', ed: '', a: 'Austin Kleon', p: 'Workman Publishing', y: '2012', pg: '160', lang: 'อังกฤษ', type: 'สารคดี/ความรู้ทั่วไป', cls: '100 ปรัชญาและจิตวิทยา', ddc: '153.35', subj: 'Creative ability; Creation (Literary, artistic, etc.)', lvl: 'ม.4-6', cv: 'o|7284187', src: 'o:OL16489931W', used: 4 },
  { isbn: '9781861976772', t: 'Eats, Shoots & Leaves : the zero tolerance approach to punctuation', ed: '', a: 'Lynne Truss', p: 'Profile Books', y: '2005', pg: '209', lang: 'อังกฤษ', type: 'สารคดี/ความรู้ทั่วไป', cls: '400 ภาษาศาสตร์', ddc: '428.2', subj: 'English language -- Punctuation', lvl: 'ม.4-6', cv: 'o|8567974', src: 'o:OL2793678W', used: 2 }
];

/* ---------- Thai cataloguing helpers ---------- */
const THAI_CONS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ';
function titleMark(t) {
  const w = String(t).trim().split(/\s+/); if (/^(the|a|an)$/i.test(w[0]) && w.length > 1) w.shift();
  for (const ch of w.join(' ')) { if (THAI_CONS.includes(ch)) return ch; if (/[a-z0-9]/i.test(ch)) return ch.toLowerCase(); }
  return '';
}
function authorMark(a) {
  a = String(a || '').split(/[,;]/)[0].trim(); if (!a) return '';
  if (/[a-z]/i.test(a)) { const last = a.split(/\s+/).pop().replace(/[^a-z]/gi, ''); return last.slice(0, 3).toUpperCase(); }
  const words = a.split(/\s+/); const w = (a.includes('.') ? words[words.length - 1] : words[0]);
  for (const ch of w) if (THAI_CONS.includes(ch)) return ch;
  return '';
}
const callNo = (ddc, a, t) => [ddc, authorMark(a), titleMark(t)].filter(Boolean).join(' ');
const DDC_CLASS = { 0: '000 เบ็ดเตล็ด/ความรู้ทั่วไป', 1: '100 ปรัชญาและจิตวิทยา', 2: '200 ศาสนา', 3: '300 สังคมศาสตร์', 4: '400 ภาษาศาสตร์', 5: '500 วิทยาศาสตร์', 6: '600 เทคโนโลยี/วิทยาศาสตร์ประยุกต์', 7: '700 ศิลปะและนันทนาการ', 8: '800 วรรณคดี/วรรณกรรม', 9: '900 ประวัติศาสตร์และภูมิศาสตร์' };
const LOCS = ['มุมหนังสือเรียนและเตรียมสอบ (ชั้น 2)', 'มุมหนังสือภาษาอังกฤษ (ชั้น 2)', 'มุมวรรณกรรม (ชั้น 1)', 'ชั้นหนังสือทั่วไป (ชั้น 1)', 'มุมการ์ตูนความรู้ (ชั้น 1)', 'มุมหนังสืออ้างอิง (ชั้น 1)'];
function locFor(type, lang) {
  if (type === 'หนังสืออ้างอิง') return LOCS[5];
  if (type === 'หนังสือเรียน/คู่มือเรียน' || type === 'หนังสือเตรียมสอบ') return LOCS[0];
  if (lang === 'อังกฤษ') return LOCS[1];
  if (type === 'การ์ตูนความรู้') return LOCS[4];
  if (TYPE_GROUP[type] === 'lit') return LOCS[2];
  return LOCS[3];
}
function isbnOk(s) {
  s = String(s).replace(/[-\s]/g, '');
  if (/^\d{13}$/.test(s)) { let t = 0; for (let i = 0; i < 12; i++) t += +s[i] * (i % 2 ? 3 : 1); return (10 - t % 10) % 10 === +s[12]; }
  if (/^\d{9}[\dX]$/i.test(s)) { let t = 0; for (let i = 0; i < 10; i++) t += (10 - i) * (s[i].toUpperCase() === 'X' ? 10 : +s[i]); return t % 11 === 0; }
  return false;
}

/* ---------- icons ---------- */
const P = d => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: P('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  search: P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  exam: P('<path d="M2 9.5 12 4.5l10 5-10 5z"/><path d="M6 11.5v5c3 2.6 9 2.6 12 0v-5M22 9.5V15"/>'),
  me: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  today: P('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  circ: P('<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>'),
  catalog: P('<path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 16a2 2 0 0 1 2-2h10M11 6.5v5M8.5 9h5"/>'),
  labels: P('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
  items: P('<path d="M4 4h3v16H4zM9 4h3v16H9z"/><path d="m14 5.2 2.9-.8 4 14.5-2.9.8z"/>'),
  visits: P('<path d="M5 21V4a1 1 0 0 1 1-1h9l4 2v16M3 21h18"/><path d="M12 11.5v1"/>'),
  report: P('<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>'),
  import: P('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 15v5h16v-5"/>'),
  users: P('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 15c2 .7 3 2.3 3.5 5"/>'),
  settings: P('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  export: P('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 20h16"/>'),
  help: P('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .9-1 1.6v.4M12 17.2v.1"/>'),
  kiosk: P('<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M10 18.5h4"/>'),
  chat: P('<path d="M4 5h16v11H9l-5 4z"/>'),
  camera: P('<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>'),
  check: P('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
  back: P('<path d="M15 5l-7 7 7 7"/>'),
  print: P('<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>'),
  copy: P('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/>')
};
const LOGO = `<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 8C12 5 7 5 3 6.5V26c4-1.5 9-1.5 13 1.5z" fill="#0D6E68"/><path d="M16 8c4-3 9-3 13-1.5V26c-4-1.5-9-1.5-13 1.5z" fill="#F26B4F"/></svg>`;
const CREST = (w = 34) => `<svg width="${w}" height="${Math.round(w * 1.12)}" viewBox="0 0 36 40" aria-hidden="true"><path d="M18 2 33 7v12c0 9-6.5 15.5-15 19C9.5 34.5 3 28 3 19V7z" fill="#fff" stroke="#16302E" stroke-width="2"/><path d="M18 8 27 11v8c0 5.5-3.8 9.7-9 12-5.2-2.3-9-6.5-9-12v-8z" fill="#0D6E68"/><text x="18" y="23.5" text-anchor="middle" font-family="IBM Plex Sans Thai,sans-serif" font-weight="600" font-size="9.5" fill="#fff">ปว</text></svg>`;
const brand = () => `<span class="logo">${LOGO}<span><b>ปันอ่าน</b><small>ห้องสมุดโรงเรียนบนคลาวด์</small></span></span>`;
const schoolMark = (sub = 'ห้องสมุดบนระบบปันอ่าน') => `<span class="logo">${CREST()}<span><b>${esc(SCHOOL.name)}</b><small>${esc(sub)}</small></span></span>`;
const info = txt => `<span class="info" tabindex="0" role="note" aria-label="${esc(txt)}">i<span class="tip" aria-hidden="true">${esc(txt)}</span></span>`;

/* ---------- covers & spine labels ---------- */
function coverUrls(b, big) {
  if (!b.cv) return [];
  const [k, p, ext] = b.cv.split('|');
  if (k === 'n') { const base = 'https://storage.naiin.com/system/application/bookstore/resource/product/' + p; return big ? [`${base}_XXL.${ext}`, `${base}_XL.${ext}`] : [`${base}_XL.${ext}`, `${base}_XXL.${ext}`]; }
  const base = 'https://covers.openlibrary.org/b/id/' + p; return big ? [`${base}-L.jpg?default=false`, `${base}-M.jpg?default=false`] : [`${base}-M.jpg?default=false`, `${base}-L.jpg?default=false`];
}
const phHTML = (t, a, bc) => `<span class="cover-ph${hash(bc) % 3 === 1 ? ' v1' : hash(bc) % 3 === 2 ? ' v2' : ''}" aria-hidden="true"><b>${esc(shortTitle(t))}</b><small>${esc(String(a || '').split(',')[0])}</small></span>`;
function cover(b, o = {}) {
  const u = coverUrls(b, o.big);
  if (!u.length) return `<span class="cover">${phHTML(b.t, b.a, b.bc || b.isbn)}</span>`;
  return `<span class="cover"><img src="${u[0]}" data-fb="${u[1]}" data-t="${esc(b.t)}" data-a="${esc(b.a)}" data-k="${esc(b.bc || b.isbn)}" alt="" ${o.eager ? '' : 'loading="lazy"'} decoding="async" onerror="coverErr(this)"></span>`;
}
window.coverErr = function (img) {
  const fb = img.getAttribute('data-fb');
  if (fb) { img.removeAttribute('data-fb'); img.src = fb; return; }
  img.outerHTML = phHTML(img.dataset.t, img.dataset.a, img.dataset.k);
};
const spine = (call, size = '') => `<span class="spine ${size}" role="img" aria-label="ป้ายสันหนังสือ ${esc(call)}">${String(call).split(' ').map(p => `<span>${esc(p)}</span>`).join('')}</span>`;
function statusPill(b, forStudent) {
  if (b.s === 'out') {
    const l = loanOf(b.bc); if (!l) return `<span class="pill out">ถูกยืม</span>`;
    const d = diffDays(l.due, TODAY);
    if (d < 0) return `<span class="pill late">${forStudent ? 'ถูกยืม รอคืน' : `เกินกำหนด ${-d} วัน`}</span>`;
    return `<span class="pill out">ถูกยืม ถึง ${thShort(l.due)}</span>`;
  }
  if (b.s === 'on') return `<span class="pill on-shelf">อยู่บนชั้น ยืมได้</span>`;
  return `<span class="pill ref">${STATUS[b.s]}</span>`;
}

/* ---------- Code 39 barcode (SVG) ---------- */
const C39 = { 0: 'nnnwwnwnn', 1: 'wnnwnnnnw', 2: 'nnwwnnnnw', 3: 'wnwwnnnnn', 4: 'nnnwwnnnw', 5: 'wnnwwnnnn', 6: 'nnwwwnnnn', 7: 'nnnwnnwnw', 8: 'wnnwnnwnn', 9: 'nnwwnnwnn', '*': 'nwnnwnwnn' };
function barcode(code, h = 34) {
  const chars = ('*' + code + '*').split(''); let x = 0; const N = 1, W = 2.5; let rects = '';
  chars.forEach((c, ci) => {
    C39[c].split('').forEach((e, i) => { const w = e === 'w' ? W : N; if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="${h}"/>`; x += w; });
    if (ci < chars.length - 1) x += N;
  });
  return `<svg class="c39" viewBox="0 0 ${x} ${h}" width="${Math.round(x * 1.15)}" height="${h}" preserveAspectRatio="none" role="img" aria-label="บาร์โค้ด ${code}" fill="#000">${rects}</svg>`;
}

/* ---------- router ---------- */
let lastPath = null, KEY = null, TIMERS = [];
const every = (fn, ms) => TIMERS.push(setInterval(fn, ms));
const later = (fn, ms) => { const t = setTimeout(fn, ms); TIMERS.push(t); return t; };
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '').split('#')[0]; const [path, qs = ''] = h.split('?');
  return { parts: path.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(qs)) };
}
const go = h => { location.hash = h; };
function render(keepFocus) {
  TIMERS.forEach(t => { clearInterval(t); clearTimeout(t); }); TIMERS = []; KEY = null;
  const tt = $('.tt'); if (tt) tt.hidden = true;
  const { parts, q } = parseHash(); const path = parts.join('/');
  const focusId = keepFocus && document.activeElement ? document.activeElement.id : null;
  let v;
  if (parts[0] === 's') v = viewStudent(parts.slice(1), q);
  else if (parts[0] === 'k') v = viewKiosk(q);
  else if (parts[0] === 't' || parts[0] === 'a') { S.role = parts[0] === 'a' ? 'assistant' : 'teacher'; v = viewTeacher(parts.slice(1), q); }
  else if (parts[0] === 'e') v = viewExec(q);
  else v = viewLaunch();
  document.body.dataset.view = parts[0] || 'home';
  app.innerHTML = v.html;
  document.title = (v.title ? v.title + ' | ' : '') + 'ปันอ่าน ต้นแบบ';
  v.mount && v.mount(app);
  const changed = path !== lastPath;
  if (changed) {
    window.scrollTo(0, 0);
    const af = $('[data-autofocus]', app);
    if (lastPath !== null) (af || $('h1', app))?.focus({ preventScroll: true });
    else af && af.focus({ preventScroll: true });
  } else if (focusId) { const el = document.getElementById(focusId); el && el.focus({ preventScroll: true }); }
  lastPath = path;
  renderProtobar();
}
const refresh = () => render(true);
window.addEventListener('hashchange', () => render());
document.addEventListener('keydown', e => { if ($('.dlg-back')) { if (e.key === 'Escape') closeDialog(); return; } KEY && KEY(e); });

/* ---------- toast, dialog, download ---------- */
let toastT;
function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
}
let dlgReturn = null;
function openDialog(html, mount) {
  closeDialog(); dlgReturn = document.activeElement;
  const back = document.createElement('div'); back.className = 'dlg-back';
  back.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-h">${html}</div>`;
  back.addEventListener('mousedown', e => { if (e.target === back) closeDialog(); });
  back.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDialog(); });
  document.body.appendChild(back);
  mount && mount(back.firstElementChild);
  const f = $('[data-autofocus]', back) || $('input,select,textarea,button', back); f && f.focus();
  return back.firstElementChild;
}
function closeDialog() { const b = $('.dlg-back'); if (b) { b.remove(); dlgReturn && dlgReturn.focus && dlgReturn.focus(); dlgReturn = null; } }
function download(name, text, mime = 'text/csv') {
  const blob = new Blob([mime.startsWith('text/csv') ? '﻿' + text : text], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const csvCell = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const toCSV = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n');

/* ---------- offline simulation (NFR-05) ---------- */
function offlineBar() {
  if (!S.offline) return '';
  return `<div class="offline-bar" role="status">ออฟไลน์ บันทึกไว้ในเครื่อง ${S.queue.length} รายการ ระบบจะส่งเองเมื่อกลับมาเชื่อมต่อ</div>`;
}
function setOffline(v) {
  S.offline = v;
  if (!v && S.queue.length) { const n = S.queue.length; S.queue = []; toast(`กลับมาออนไลน์แล้ว ส่งรายการที่บันทึกไว้ ${n} รายการเรียบร้อย`); }
  else toast(v ? 'จำลองอินเทอร์เน็ตขัดข้อง รายการใหม่จะเก็บไว้ในเครื่องก่อน' : 'กลับมาออนไลน์แล้ว');
  refresh();
}
const enqueue = what => { if (S.offline) S.queue.push(what); };

/* ---------- prototype bar ---------- */
function renderProtobar() {
  let pb = $('.protobar');
  if (!pb) { pb = document.createElement('div'); pb.className = 'protobar noprint'; document.body.appendChild(pb); }
  const open = pb.dataset.open === '1';
  pb.innerHTML = `<button type="button" aria-expanded="${open}" aria-controls="pb-menu"><span class="dot"></span><span class="pb-long">ต้นแบบ: เปลี่ยนบทบาท</span><span class="pb-short">ต้นแบบ</span></button>
  ${open ? `<div class="menu" id="pb-menu">
    <a href="#/">หน้าเลือกบทบาท</a>
    <a href="#/s">นักเรียน (มือถือ)</a>
    <a href="#/k">Kiosk ทางเข้า (แท็บเล็ต)</a>
    <a href="#/t/today">ครูผู้รับผิดชอบห้องสมุด</a>
    <a href="#/a/circ">ยุวบรรณารักษ์</a>
    <a href="#/e">ผู้บริหารโรงเรียน</a>
    <hr style="border:0;border-top:1px solid var(--line);margin:6px 0">
    <button type="button" data-pb="offline">${S.offline ? 'เลิกจำลองอินเทอร์เน็ตขัดข้อง' : 'จำลองอินเทอร์เน็ตขัดข้อง'}</button>
    <button type="button" data-pb="reset">ล้างข้อมูลทดลองทั้งหมด</button>
    <p>ข้อมูลหนังสือ 200 เล่มมาจากไฟล์ CSV ส่วนโรงเรียน นักเรียน และสถิติเป็นข้อมูลจำลอง ข้อมูลที่กรอกจะหายเมื่อโหลดหน้าใหม่</p>
  </div>` : ''}`;
  pb.onclick = e => {
    e.stopPropagation();
    if (e.target.closest('button[aria-expanded]')) { pb.dataset.open = open ? '' : '1'; renderProtobar(); return; }
    const b = e.target.closest('[data-pb]');
    if (b) { pb.dataset.open = ''; if (b.dataset.pb === 'offline') setOffline(!S.offline); else location.href = location.pathname; return; }
    if (e.target.closest('a')) { pb.dataset.open = ''; renderProtobar(); }
  };
}
document.addEventListener('click', e => { const pb = $('.protobar'); if (pb && pb.dataset.open === '1' && !pb.contains(e.target)) { pb.dataset.open = ''; renderProtobar(); } });

/* ---------- font size (NFR-14) ---------- */
let FS = '0';
const setFS = v => { FS = v; v === '0' ? document.documentElement.removeAttribute('data-fs') : document.documentElement.setAttribute('data-fs', v); };
const fszControl = () => `<div class="fsz" role="group" aria-label="ขนาดตัวอักษร">${['0', '1', '2'].map((v, i) => `<button type="button" data-fs="${v}" aria-pressed="${FS === v}" aria-label="${['ปกติ', 'ใหญ่', 'ใหญ่มาก'][i]}">ก</button>`).join('')}</div>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-fs]'); if (b && b.tagName === 'BUTTON') { setFS(b.dataset.fs); $$('[data-fs]').forEach(x => x.tagName === 'BUTTON' && x.setAttribute('aria-pressed', x.dataset.fs === FS)); } });

/* ---------- launcher ---------- */
function viewLaunch() {
  const role = (href, cls, ico, h, p, dev, tryTxt) => `<a class="role ${cls}" href="${href}"><span class="ico">${ico}</span><span><span class="dev">${dev}</span><h2>${h}</h2><p>${p}</p><p class="try">${tryTxt}</p></span></a>`;
  return {
    title: 'เลือกบทบาท',
    html: `<main class="launch">
    <div class="brand">${brand()}</div>
    <h1>ต้นแบบระบบห้องสมุดโรงเรียนปันอ่าน</h1>
    <p class="lead">ลองใช้ระบบในฐานะผู้ใช้แต่ละกลุ่มของ${esc(SCHOOL.name)} (โรงเรียนสมมติ) หนังสือทั้ง 200 เล่มเป็นหนังสือจริงพร้อมภาพปก วันที่ในต้นแบบคือ${thDay(TODAY)} เวลา 10:42 น.</p>
    <div class="roles">
      ${role('#/s', 'student', ICON.home, 'นักเรียน', 'ค้นหนังสือ ดูว่าอยู่ชั้นไหน มุมเตรียมสอบ และหนังสือที่ยืมอยู่', 'มือถือ', 'ลองทำ: หาหนังสือเตรียมสอบ A-Level ฟิสิกส์ แล้วดูว่าอยู่ที่ไหน')}
      ${role('#/k', '', ICON.kiosk, 'Kiosk ทางเข้าห้องสมุด', 'นักเรียนสแกนบัตรหรือพิมพ์รหัสเพื่อบันทึกการเข้าใช้', 'แท็บเล็ตแนวนอน', 'ลองทำ: พิมพ์รหัส 41208 แล้วกดตกลง')}
      ${role('#/t/today', '', ICON.today, 'ครูผู้รับผิดชอบห้องสมุด', 'ยืม-คืน ลงหนังสือใหม่ พิมพ์ป้าย รายงานรายเดือน และตั้งค่าโรงเรียน', 'คอมพิวเตอร์ที่เคาน์เตอร์', 'ลองทำ: ลงหนังสือจาก ISBN 9789744723635 แล้วพิมพ์ป้าย')}
      ${role('#/a/circ', '', ICON.circ, 'ยุวบรรณารักษ์', 'ช่วยครูยืม-คืน เปิด kiosk และลงรายการเป็นร่างให้ครูตรวจ', 'คอมพิวเตอร์ที่เคาน์เตอร์', 'ลองทำ: ยืมหนังสือ 2 เล่มให้รหัส 41208')}
      ${role('#/e', '', ICON.report, 'ผู้บริหารโรงเรียน', 'แนวโน้มการเข้าใช้และการยืมย้อนหลัง 4 ภาคเรียน', 'คอมพิวเตอร์', 'ลองทำ: ดูว่านักเรียน ม.ปลายเข้าห้องสมุดช่วงไหนมากที่สุด')}
      <div class="role about"><span class="ico">${ICON.info}</span><span><span class="dev">ข้อมูลในต้นแบบ</span><h2>มีอะไรบ้าง</h2><p>หนังสือจริง 200 เล่ม (ไทย 128 อังกฤษ 72) ภาพปกจากร้านนายอินทร์และ Open Library นักเรียนจำลอง ${fmt(STUDENTS.length)} คน กำลังยืม ${S.loans.length} เล่ม และสถิติจำลอง 4 ภาคเรียน</p><p class="try">รหัสผ่านทดลองของนักเรียนทุกคนคือ 1234 และ PIN ครูคือ 1234</p></span></div>
    </div>
    <p class="foot">ต้นแบบนี้ใช้ทดสอบการใช้งานกับครูและนักเรียน ไม่ได้เชื่อมต่อฐานข้อมูลจริง ข้อมูลที่กรอกจะหายเมื่อโหลดหน้าใหม่ แถบ "ต้นแบบ" มุมขวาบนใช้สลับบทบาทและจำลองอินเทอร์เน็ตขัดข้อง</p>
  </main>`
  };
}
