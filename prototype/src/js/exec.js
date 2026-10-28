/* ================= Statistics model (simulated, consistent everywhere) ================= */
const SEMS = [
  { id: '2/2567', months: [[2024, 10], [2024, 11], [2025, 0], [2025, 1], [2025, 2]], f: 0.86, reach: 0.51 },
  { id: '1/2568', months: [[2025, 4], [2025, 5], [2025, 6], [2025, 7], [2025, 8]], f: 1.0, reach: 0.55 },
  { id: '2/2568', months: [[2025, 10], [2025, 11], [2026, 0], [2026, 1], [2026, 2]], f: 1.05, reach: 0.58 },
  { id: '1/2569', months: [[2026, 4], [2026, 5], [2026, 6], [2026, 7], [2026, 8]], f: 1.13, reach: 0.64, current: true }
];
const PARTIAL = 10 / 21; // school days elapsed in Sep 2569 (to 14 Sep)
const GRADE_SH = [0.19, 0.18, 0.17, 0.16, 0.15, 0.15];
const FEMALE_SH = 0.58, FEMALE_POP = 0.52;
const SLOTS = [['before', 'ก่อนเข้าเรียน', '07:00–08:00', 0.15], ['class', 'ระหว่างคาบเรียน', '08:30–15:30', 0.23], ['lunch', 'พักกลางวัน', '12:00–13:00', 0.44], ['after', 'หลังเลิกเรียน', '15:30–16:30', 0.18]];
const MONTHS = [];
(function genModel() {
  const r = mulberry32(77);
  const base = { 4: 520, 5: 1180, 6: 1050, 7: 1210, 8: 1100, 10: 980, 11: 1040, 0: 1150, 1: 1320, 2: 410 };
  SEMS.forEach((s, si) => s.months.forEach(([y, m]) => {
    const partial = s.current && m === 8;
    let v = base[m] * s.f * (0.97 + r() * 0.06); if (partial) v *= PARTIAL;
    MONTHS.push({ y, m, sem: s.id, si, partial, visits: Math.round(v), loans: Math.round(v * (0.16 + r() * 0.02)), cls: Math.max(1, Math.round(v / 140 * (0.85 + r() * 0.3))) });
  }));
})();
const monthLabel = (mo, long) => `${(long ? TMF : TM)[mo.m]} ${String(mo.y + 543).slice(long ? 0 : 2)}`;
function factor(F, what) {
  let g = 1, x = 1, t = 1;
  if (F.grade === 'low') g = GRADE_SH.slice(0, 3).reduce((a, b) => a + b); else if (F.grade === 'high') g = GRADE_SH.slice(3).reduce((a, b) => a + b); else if (F.grade) g = GRADE_SH[+F.grade - 1];
  if (F.gender === 'f') x = what === 'pop' ? FEMALE_POP : FEMALE_SH; else if (F.gender === 'm') x = what === 'pop' ? 1 - FEMALE_POP : 1 - FEMALE_SH;
  if (F.slot) t = SLOTS.find(s => s[0] === F.slot)[3];
  if (what === 'cls') return F.grade ? g : 1;
  if (what === 'pop') return g * x;
  return g * x * t;
}
function semStats(si, F = {}) {
  const ms = MONTHS.filter(m => m.si === si);
  const v = ms.reduce((a, m) => a + m.visits, 0), l = ms.reduce((a, m) => a + m.loans, 0), c = ms.reduce((a, m) => a + m.cls, 0);
  const pop = SCHOOL.students * factor(F, 'pop');
  const visits = Math.round(v * factor(F)), uniq = Math.min(Math.round(pop * SEMS[si].reach * (F.slot ? 0.8 : 1)), visits);
  return { visits, loans: Math.round(l * factor(F)), cls: Math.round(c * factor(F, 'cls')), uniq, pop: Math.round(pop) };
}
/* same-period comparison: current semester vs same months last year, Sep scaled to the same share */
function semCompare(si, F) {
  const cur = semStats(si, F); const prevIdx = si - 2; if (prevIdx < 0) return { cur, prev: null };
  const ms = MONTHS.filter(m => m.si === prevIdx);
  const part = SEMS[si].current ? m => m.m === 8 ? PARTIAL : 1 : () => 1;
  const sum = k => Math.round(ms.reduce((a, m) => a + m[k] * part(m), 0));
  const prevAll = semStats(prevIdx, F);
  const prev = { visits: Math.round(sum('visits') * factor(F)), loans: Math.round(sum('loans') * factor(F)), cls: Math.round(sum('cls') * factor(F, 'cls')), uniq: Math.round(prevAll.uniq * (SEMS[si].current ? 0.93 : 1)) };
  return { cur, prev };
}
function apportion(total, shares) {
  const sum = shares.reduce((a, b) => a + b, 0), raw = shares.map(s => total * s / sum), out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { out[i]++; rest--; } });
  return out;
}
function monthStats(y, m) {
  const mo = MONTHS.find(x => x.y === y && x.m === m);
  const r = mulberry32(y * 12 + m);
  const days = []; const last = mo.partial ? 14 : new Date(y, m + 1, 0).getDate();
  const hol = { '2026-7-12': 1, '2026-6-28': 1, '2026-6-29': 1, '2025-7-12': 1, '2025-11-5': 1, '2025-11-10': 1, '2026-0-1': 1 };
  for (let d = 1; d <= last; d++) { const dt = new Date(y, m, d); if (dt.getDay() && dt.getDay() < 6 && !hol[`${y}-${m}-${d}`]) days.push({ d: dt, w: 0.75 + r() * 0.5 + (dt.getDay() === 5 ? -0.15 : 0) }); }
  const W = days.reduce((a, x) => a + x.w, 0);
  apportion(mo.visits, days.map(x => x.w)).forEach((v, i) => days[i].v = v);
  const gv = apportion(mo.visits, GRADE_SH), gl = apportion(mo.loans, GRADE_SH);
  const byGrade = GRADE_SH.map((g, i) => { const f = Math.round(gv[i] * (FEMALE_SH + (i - 2.5) * 0.01)); return { g: i + 1, f, m: gv[i] - f, loans: gl[i] }; });
  const sv = apportion(mo.visits, SLOTS.map(s => s[3]));
  const bySlot = SLOTS.map((s, i) => ({ label: s[1], time: s[2], v: sv[i] }));
  const top = [...BOOKS].filter(b => b.g !== 'ref' && b.bc < '1000201').sort((a, b) => (hash(b.bc + m) % 30 + b.pop) - (hash(a.bc + m) % 30 + a.pop)).slice(0, 10).map((b, i) => ({ b, n: Math.max(3, Math.round(mo.loans / 22) - i) }));
  const classes = mo.y === 2026 && mo.m === 8 ? S.classUse : Array.from({ length: mo.cls }, (_, i) => ({ d: days[Math.floor((i + 0.5) * days.length / mo.cls)].d, slot: `คาบ ${2 + (i * 3) % 5}`, teacher: ['ครูสมชาย ใจดี', 'ครูอรอุมา แสงทอง', 'ครูมาลี ศรีวงศ์', 'ครูธวัชชัย บุญมา'][i % 4], subj: ['ภาษาไทย', 'วิทยาศาสตร์', 'ภาษาอังกฤษ', 'สังคมศึกษา', 'กิจกรรมส่งเสริมการอ่าน'][i % 5], room: `ม.${1 + (i * 5) % 6}/${1 + i % 4}`, n: 32 + (i * 7) % 4 }));
  const uniq = Math.round(SCHOOL.students * (0.38 + r() * 0.12) * (mo.partial ? 0.7 : 1));
  return { mo, days, byGrade, bySlot, top, classes, uniq, returns: Math.round(mo.loans * 0.96) };
}

/* ================= Chart helpers (single hue, one accent, hover tooltip, table view) ================= */
const C_HI = '#0D6E68', C_LO = '#7DB3AC', C_GRID = '#E2EAE8';
function vBar(x, y, w, h, r = 4) { if (h <= 0) return ''; r = Math.min(r, w / 2, h); return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; }
function hBar(x, y, w, h, r = 4) { if (w <= 0) return ''; r = Math.min(r, h / 2, w); return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`; }
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function chartCols(data, o = {}) {
  /* data: [{label, v, hi, tip, group}] */
  const W = o.w || 640, H = o.h || 220, L = 44, B = o.groups ? 46 : 26, T = 14, R = 6;
  const max = niceMax(Math.max(...data.map(d => d.v)) * 1.08); const ih = H - T - B, iw = W - L - R;
  const ticks = [4, 5, 2].find(t => Number.isInteger(max / t) && /^[125]0*$/.test(String(max / t))) || 4;
  let gaps = 0; data.forEach((d, i) => { if (i && d.group !== data[i - 1].group) gaps++; });
  const gapW = o.groups ? 14 : 0; const slot = (iw - gaps * gapW) / data.length; const bw = Math.max(4, slot - 2 - (o.pad ?? slot * 0.28));
  let s = '';
  for (let i = 0; i <= ticks; i++) { const y = T + ih - ih * i / ticks; s += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${i ? C_GRID : '#B9C8C5'}" stroke-width="1"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" font-size="11">${fmt(max * i / ticks)}</text>`; }
  let gx = 0, groups = [], gStart = L;
  data.forEach((d, i) => {
    if (i && d.group !== data[i - 1].group) { groups.push([data[i - 1].group, gStart, L + gx]); gx += gapW; gStart = L + gx; }
    const x = L + gx + (slot - bw) / 2, h = ih * d.v / max, y = T + ih - h;
    s += `<path d="${vBar(x, y, bw, h)}" fill="${d.hi ? C_HI : C_LO}"/>`;
    if (d.label) s += `<text x="${x + bw / 2}" y="${T + ih + 16}" text-anchor="middle" font-size="11">${esc(d.label)}</text>`;
    if (d.lab) s += `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="600" style="fill:var(--ink)">${esc(d.lab)}</text>`;
    s += `<rect x="${L + gx}" y="${T}" width="${slot}" height="${ih}" fill="transparent" data-tip="${esc(d.tip)}"/>`;
    gx += slot;
  });
  if (o.groups) { groups.push([data[data.length - 1].group, gStart, L + gx]); groups.forEach(([g, a, b]) => { s += `<line x1="${a + 2}" x2="${b - 2}" y1="${T + ih + 26}" y2="${T + ih + 26}" stroke="#B9C8C5"/><text x="${(a + b) / 2}" y="${T + ih + 41}" text-anchor="middle" font-size="11.5" font-weight="500">${esc(g)}</text>`; }); }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${s}</svg>`;
}
function chartRows(data, o = {}) {
  const W = o.w || 420, rowH = 30, L = o.left || 118, R = 64, H = data.length * rowH + 6;
  const max = Math.max(...data.map(d => d.v)) || 1; let s = '';
  data.forEach((d, i) => {
    const y = 3 + i * rowH, w = (W - L - R) * d.v / max;
    s += `<text x="${L - 10}" y="${y + 17}" text-anchor="end" font-size="12" ${d.hi ? 'font-weight="600" style="fill:var(--ink)"' : ''}>${esc(d.label)}</text>`;
    s += `<path d="${hBar(L, y + 4, w, rowH - 10)}" fill="${d.hi ? C_HI : C_LO}"/>`;
    s += `<text x="${L + w + 8}" y="${y + 17}" font-size="12" style="fill:var(--ink)">${esc(d.lab ?? fmt(d.v))}</text>`;
    s += `<rect x="0" y="${y}" width="${W}" height="${rowH}" fill="transparent" data-tip="${esc(d.tip)}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${s}</svg>`;
}
function bindTips(root) {
  let tt = $('.tt'); if (!tt) { tt = document.createElement('div'); tt.className = 'tt'; tt.hidden = true; document.body.appendChild(tt); }
  tt.style.cssText = 'position:fixed;pointer-events:none;padding:8px 10px;border-radius:8px;background:#16302E;color:#fff;font:400 .8rem/1.45 var(--ui);z-index:80;white-space:nowrap';
  $$('[data-tip]', root).forEach(el => {
    el.addEventListener('pointermove', e => { tt.hidden = false; tt.innerHTML = el.getAttribute('data-tip').replace(/\|/g, '<br>'); const r = tt.getBoundingClientRect(); let x = e.clientX + 14, y = e.clientY - r.height - 10; if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14; if (y < 8) y = e.clientY + 16; tt.style.left = x + 'px'; tt.style.top = y + 'px'; });
    el.addEventListener('pointerleave', () => { tt.hidden = true; });
  });
}

/* ================= Executive dashboard (FR-M6-04, FR-M6-06, US-06) ================= */
const GRADE_OPTS = [['', 'ทุกระดับชั้น'], ['low', 'ม.ต้น (ม.1–3)'], ['high', 'ม.ปลาย (ม.4–6)'], ['1', 'ม.1'], ['2', 'ม.2'], ['3', 'ม.3'], ['4', 'ม.4'], ['5', 'ม.5'], ['6', 'ม.6']];
function viewExec(q) {
  const F = { sem: q.sem ?? '3', grade: q.grade || '', gender: q.gender || '', slot: q.slot || '' };
  const si = +F.sem, sem = SEMS[si];
  const { cur, prev } = semCompare(si, F);
  const delta = (a, b, unit) => { if (!b) return `<div class="delta">ไม่มีข้อมูลภาคเรียนเดียวกันปีก่อน</div>`; const p = Math.round((a - b) / b * 100); return `<div class="delta ${p > 0 ? 'up' : p < 0 ? 'down' : ''}">${p > 0 ? '+' : ''}${p}% จาก${sem.current ? 'ช่วงเดียวกัน' : 'ภาคเรียนเดียวกัน'}ปีก่อน (${fmt(b)}${unit})</div>`; };
  const sel = (name, label, opts) => `<label class="field"><span>${label}</span><select class="input" name="${name}">${opts.map(([v, t]) => `<option value="${v}" ${F[name] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
  const fac = factor(F);
  const monthly = MONTHS.map(mo => ({ group: 'ภาคเรียน ' + mo.sem, label: TM[mo.m], v: Math.round(mo.visits * fac), hi: mo.si === si, tip: `<b>${monthLabel(mo, true)}</b>|ผู้เข้าใช้ ${fmt(Math.round(mo.visits * fac))} ครั้ง${mo.partial ? '|ถึง 14 ก.ย. 2569' : ''}` }));
  const semBars = k => SEMS.map((s, i) => { const v = semStats(i, F)[k]; return { group: '', label: s.id, v, hi: i === si, lab: i === si ? fmt(v) : '', tip: `<b>ภาคเรียน ${s.id}</b>|${k === 'loans' ? 'ยืม' : 'ใช้เป็นห้องเรียน'} ${fmt(v)} ${k === 'loans' ? 'เล่ม' : 'ครั้ง'}${s.current ? '|ถึง 14 ก.ย. 2569' : ''}` }; });
  const semMs = MONTHS.filter(m => m.si === si), semV = semMs.reduce((a, m) => a + m.visits, 0);
  const F2 = { ...F, slot: '' }, fg = factor(F2);
  const slotRows = SLOTS.map(s => { const v = Math.round(semV * fg * s[3]); return { label: s[1], v, hi: !F.slot || F.slot === s[0], tip: `<b>${s[1]}</b> ${s[2]} น.|${fmt(v)} ครั้ง (${Math.round(s[3] * 100)}%)` }; });
  const F3 = { ...F, grade: '' }, fgr = factor(F3);
  const inSel = g => !F.grade || F.grade === String(g) || (F.grade === 'low' && g <= 3) || (F.grade === 'high' && g >= 4);
  const gradeRows = GRADE_SH.map((sh, i) => { const v = Math.round(semV * fgr * sh), per = v / (SCHOOL.students / 6 * (F.gender === 'f' ? FEMALE_POP : F.gender === 'm' ? 1 - FEMALE_POP : 1)); return { label: 'ม.' + (i + 1), v, hi: inSel(i + 1), tip: `<b>ม.${i + 1}</b>|${fmt(v)} ครั้ง|เฉลี่ย ${per.toFixed(1)} ครั้งต่อคน` }; });
  const top = monthStats(...(sem.current ? [2026, 7] : [sem.months[3][0], sem.months[3][1]])).top;
  const semName = s => `ภาคเรียนที่ ${s.id}${s.current ? ' (ปัจจุบัน)' : ''}`;
  const filtTxt = [F.grade && GRADE_OPTS.find(g => g[0] === F.grade)[1], F.gender && (F.gender === 'f' ? 'นักเรียนหญิง' : 'นักเรียนชาย'), F.slot && SLOTS.find(s => s[0] === F.slot)[1]].filter(Boolean).join(' ');
  const html = `<header class="e-top">${schoolMark('ภาพรวมห้องสมุดสำหรับผู้บริหาร')}<span class="grow"></span><span class="small muted noprint">ข้อมูลถึง ${thDate(TODAY)}</span><button class="btn noprint acts" data-print>${ICON.print}ดาวน์โหลด PDF</button>${fszControl()}</header>
    <main class="e-body">
      <h1 tabindex="-1" style="margin-bottom:4px">การใช้ห้องสมุด ${semName(sem)}</h1>
      <p class="muted" style="margin-bottom:18px">${filtTxt ? `กรองเฉพาะ ${esc(filtTxt)} ` : ''}ตัวเลขทั้งหมดเป็นยอดรวม ไม่แสดงข้อมูลนักเรียนรายบุคคล</p>
      <form class="frow" data-ef aria-label="ตัวกรอง">
        ${sel('sem', 'ภาคเรียน', SEMS.map((s, i) => [String(i), semName(s)]).reverse())}
        ${sel('grade', 'ระดับชั้น', GRADE_OPTS)}
        ${sel('gender', 'เพศ', [['', 'ทุกเพศ'], ['f', 'หญิง'], ['m', 'ชาย']])}
        ${sel('slot', 'ช่วงเวลา', [['', 'ทุกช่วงเวลา'], ...SLOTS.map(s => [s[0], `${s[1]} (${s[2]})`])])}
        ${F.grade || F.gender || F.slot ? '<button type="button" class="linkbtn" data-clear style="align-self:center">ล้างตัวกรอง</button>' : ''}
      </form>
      <section class="strip" aria-label="ตัวเลขสรุป">
        <div><div class="lab">ผู้เข้าใช้ห้องสมุด</div><div class="val num">${fmt(cur.visits)}</div><div class="small muted">ครั้ง</div>${delta(cur.visits, prev && prev.visits, ' ครั้ง')}</div>
        <div><div class="lab">นักเรียนที่เคยเข้าใช้</div><div class="val num">${Math.round(cur.uniq / cur.pop * 100)}%</div><div class="small muted">${fmt(cur.uniq)} จาก ${fmt(cur.pop)} คน</div>${prev ? delta(cur.uniq, prev.uniq, ' คน') : delta(0, 0)}</div>
        <div><div class="lab">การยืมหนังสือ</div><div class="val num">${fmt(cur.loans)}</div><div class="small muted">เล่ม</div>${delta(cur.loans, prev && prev.loans, ' เล่ม')}</div>
        <div><div class="lab">ใช้เป็นห้องเรียน</div><div class="val num">${fmt(cur.cls)}</div><div class="small muted">ครั้ง${F.gender || F.slot ? ' (กรองได้เฉพาะระดับชั้น)' : ''}</div>${delta(cur.cls, prev && prev.cls, ' ครั้ง')}</div>
      </section>
      <div class="charts">
        <section class="panel chart wide" aria-labelledby="c1"><div class="chart-h"><h2 id="c1">ผู้เข้าใช้รายเดือน 4 ภาคเรียน</h2><button type="button" class="linkbtn" data-table="t1" aria-expanded="false">ดูเป็นตาราง</button></div>
          <p class="chart-sub">แท่งสีเข้มคือภาคเรียนที่เลือก เดือน ต.ค. และ เม.ย. เป็นช่วงปิดภาคเรียน เดือน ก.ย. 2569 นับถึงวันที่ 14</p>
          ${chartCols(monthly, { w: 1040, h: 250, groups: true, aria: 'กราฟแท่งจำนวนผู้เข้าใช้รายเดือน' })}
          <div class="legend"><span><i style="background:${C_HI}"></i>ภาคเรียนที่เลือก</span><span><i style="background:${C_LO}"></i>ภาคเรียนอื่น</span></div>
          <div id="t1" hidden><table class="tbl" style="margin-top:12px"><thead><tr><th>เดือน</th><th>ภาคเรียน</th><th class="num">ผู้เข้าใช้ (ครั้ง)</th><th class="num">ยืม (เล่ม)</th></tr></thead><tbody>${MONTHS.map(mo => `<tr><td>${monthLabel(mo, true)}${mo.partial ? ' (ถึง 14 ก.ย.)' : ''}</td><td>${mo.sem}</td><td class="num">${fmt(Math.round(mo.visits * fac))}</td><td class="num">${fmt(Math.round(mo.loans * fac))}</td></tr>`).join('')}</tbody></table></div>
        </section>
        <section class="panel chart" aria-labelledby="c2"><div class="chart-h"><h2 id="c2">การยืมหนังสือรายภาคเรียน</h2></div><p class="chart-sub">หน่วย: เล่ม</p>${chartCols(semBars('loans'), { w: 460, h: 210, pad: 40, aria: 'กราฟแท่งจำนวนการยืมรายภาคเรียน' })}</section>
        <section class="panel chart" aria-labelledby="c3"><div class="chart-h"><h2 id="c3">ใช้ห้องสมุดเป็นห้องเรียน</h2></div><p class="chart-sub">หน่วย: ครั้ง ครูบันทึกพร้อมรายวิชาและจำนวนนักเรียน</p>${chartCols(semBars('cls'), { w: 460, h: 210, pad: 40, aria: 'กราฟแท่งจำนวนครั้งที่ใช้เป็นห้องเรียน' })}</section>
        <section class="panel chart" aria-labelledby="c4"><div class="chart-h"><h2 id="c4">ช่วงเวลาที่เข้าใช้</h2></div><p class="chart-sub">ผู้เข้าใช้ในภาคเรียนที่เลือก หน่วย: ครั้ง</p>${chartRows(slotRows, { aria: 'กราฟแท่งแนวนอนตามช่วงเวลา' })}</section>
        <section class="panel chart" aria-labelledby="c5"><div class="chart-h"><h2 id="c5">ระดับชั้น</h2></div><p class="chart-sub">ผู้เข้าใช้ในภาคเรียนที่เลือก หน่วย: ครั้ง</p>${chartRows(gradeRows, { left: 60, aria: 'กราฟแท่งแนวนอนตามระดับชั้น' })}</section>
        <section class="panel chart wide" aria-labelledby="c6"><div class="chart-h"><h2 id="c6">หนังสือที่ถูกยืมมากที่สุด</h2><span class="small muted">${sem.current ? 'เดือน ส.ค. 2569' : 'เดือนที่ 4 ของภาคเรียน'}</span></div>
          <ol class="toplist" style="columns:2;column-gap:32px">${top.map(x => `<li style="break-inside:avoid">${cover(x.b)}<span>${esc(shortTitle(x.b.t))}<br><span class="small muted">${esc(x.b.type)}</span></span><span class="num small">${x.n} ครั้ง</span></li>`).join('')}</ol></section>
      </div>
      <p class="small muted" style="margin-top:18px">เริ่มเก็บข้อมูลในปันอ่านตั้งแต่ภาคเรียนที่ 2/2567 ข้อมูลเก็บถาวรแม้เปลี่ยนครูผู้รับผิดชอบ</p>
    </main>`;
  return {
    title: 'ภาพรวมผู้บริหาร', html,
    mount(root) {
      const f = $('[data-ef]', root);
      f.addEventListener('change', () => { const d = Object.fromEntries(new FormData(f)); Object.keys(d).forEach(k => d[k] === '' && delete d[k]); history.replaceState(null, '', '#/e?' + new URLSearchParams(d)); refresh(); });
      $('[data-clear]', root)?.addEventListener('click', () => { history.replaceState(null, '', '#/e?sem=' + F.sem); refresh(); });
      $('[data-print]', root).addEventListener('click', () => window.print());
      $$('[data-table]', root).forEach(b => b.addEventListener('click', () => { const t = $('#' + b.dataset.table); t.hidden = !t.hidden; b.setAttribute('aria-expanded', !t.hidden); b.textContent = t.hidden ? 'ดูเป็นตาราง' : 'ซ่อนตาราง'; }));
      bindTips(root);
    }
  };
}
