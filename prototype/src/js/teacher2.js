/* ================= Teacher pages, part 2 ================= */

/* ---------- Items (FR-M2-06, FR-M2-08, FR-M2-10) ---------- */
function tItems() {
  const F = S.itemsF || (S.itemsF = { q: '', st: '', g: '', loc: '', n: 30 });
  return {
    title: 'ทรัพยากรทั้งหมด',
    actions: `<button class="btn" data-import>${ICON.import}นำเข้าจาก CSV หรือ Excel</button><button class="btn" data-exp>${ICON.export}ส่งออก CSV</button>`,
    body: `<form class="frow" data-if aria-label="ค้นหาและกรอง">
        <label class="field grow" style="min-width:240px"><span>ค้นหา</span><input class="input" id="iq" name="q" value="${esc(F.q)}" placeholder="ชื่อเรื่อง ผู้แต่ง เลขทะเบียน หรือ ISBN" autocomplete="off"></label>
        <label class="field"><span>สถานะ</span><select class="input" name="st"><option value="">ทุกสถานะ</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${F.st === k ? 'selected' : ''}>${v}</option>`).join('')}<option value="late" ${F.st === 'late' ? 'selected' : ''}>เกินกำหนดคืน</option></select></label>
        <label class="field"><span>ประเภท</span><select class="input" name="g"><option value="">ทุกประเภท</option>${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${F.g === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>มุมจัดเก็บ</span><select class="input" name="loc"><option value="">ทุกมุม</option>${LOCS.map(l => `<option ${F.loc === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </form><div class="panel" style="padding:8px 16px" id="itab"></div>`,
    mount(root) {
      const f = $('[data-if]', root), box = $('#itab', root);
      const draw = () => {
        Object.assign(F, Object.fromEntries(new FormData(f)));
        let list = F.q ? BOOKS.filter(b => b._idx.includes(norm(F.q))) : BOOKS.slice();
        if (F.st === 'late') list = list.filter(b => { const l = loanOf(b.bc); return l && diffDays(l.due, TODAY) < 0; }); else if (F.st) list = list.filter(b => b.s === F.st);
        if (F.g) list = list.filter(b => b.g === F.g); if (F.loc) list = list.filter(b => b.loc === F.loc);
        list.sort((a, b) => b.bc - a.bc);
        const opt = b => b.s === 'out' ? statusPill(b) : `<label class="sr" for="st-${b.bc}">สถานะของ ${esc(shortTitle(b.t))}</label><select class="input" id="st-${b.bc}" data-st="${b.bc}" style="min-height:36px;padding:4px 8px;width:auto">${Object.entries(STATUS).filter(([k]) => k !== 'out').map(([k, v]) => `<option value="${k}" ${b.s === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
        box.innerHTML = `<p class="small muted" style="padding:8px 0">แสดง ${Math.min(F.n, list.length)} จาก ${list.length} รายการ (ทั้งห้องสมุด ${BOOKS.length} เล่ม)</p>
          <table class="tbl"><thead><tr><th></th><th>ชื่อเรื่อง</th><th>เลขเรียกหนังสือ</th><th>เลขทะเบียน</th><th>มุมจัดเก็บ</th><th>สถานะ</th></tr></thead><tbody>
          ${list.slice(0, F.n).map(b => `<tr><td>${cover(b)}</td><td><div class="t">${esc(shortTitle(b.t))}</div><div class="small muted">${esc(b.a)}</div></td><td class="num">${esc(b.call)}</td><td class="num">${b.bc}</td><td class="small">${esc(b.loc)}</td><td>${opt(b)}</td></tr>`).join('')}</tbody></table>
          ${list.length > F.n ? `<p style="padding:12px 0"><button class="btn sm" data-more>แสดงเพิ่มอีก 30 รายการ</button></p>` : ''}`;
        $('[data-more]', box)?.addEventListener('click', () => { F.n += 30; draw(); });
        $$('[data-st]', box).forEach(s => s.addEventListener('change', () => {
          const b = BY[s.dataset.st], v = s.value;
          const apply = reason => { b.s = v; S.audit.unshift({ t: now(), who: ME().name, what: `เปลี่ยนสถานะ ${b.bc} เป็น ${STATUS[v]}${reason ? ` (${reason})` : ''}` }); toast(`เปลี่ยนสถานะ ${shortTitle(b.t)} เป็น "${STATUS[v]}" แล้ว`); };
          if (v === 'gone') {
            openDialog(`<h2 id="dlg-h">จำหน่ายหนังสือออก</h2><p class="muted">${esc(shortTitle(b.t))} (${b.bc}) จะไม่แสดงในหน้าค้นหาของนักเรียน แต่ประวัติการยืมยังอยู่ครบ</p>
              <form data-gone style="margin-top:14px" class="stack"><label class="field"><span>เหตุผล</span><select class="input" name="r"><option>ชำรุดจนซ่อมไม่ได้</option><option>เนื้อหาล้าสมัย</option><option>สูญหายเกิน 1 ภาคเรียน</option><option>อื่น ๆ</option></select></label>
              <label class="field"><span>วันที่จำหน่าย</span><input class="input" name="d" value="${thDate(TODAY)}"></label>
              <div class="acts"><button type="button" class="btn" data-close>ยกเลิก</button><button class="btn primary">จำหน่ายออก</button></div></form>`, d => {
              $('[data-gone]', d).addEventListener('submit', e => { e.preventDefault(); apply(e.target.r.value); closeDialog(); draw(); });
              $('[data-close]', d).addEventListener('click', () => { s.value = b.s; });
            });
          } else apply();
        }));
      };
      let t; f.addEventListener('input', e => { if (e.target.name === 'q') { clearTimeout(t); t = setTimeout(() => { F.n = 30; draw(); }, 180); } });
      f.addEventListener('change', e => { if (e.target.name !== 'q') { F.n = 30; draw(); } });
      f.addEventListener('submit', e => e.preventDefault());
      draw();
      $('[data-exp]', root).addEventListener('click', () => exportItems());
      $('[data-import]', root).addEventListener('click', () => importDialog('items'));
    }
  };
}
const ITEM_HEAD = ['บาร์โค้ด (Barcode)', 'ISBN', 'ชื่อเรื่อง (Title)', 'ฉบับพิมพ์ (Edition)', 'ผู้แต่ง (Author)', 'สำนักพิมพ์ (Publisher)', 'ปีที่พิมพ์ (Year)', 'จำนวนหน้า (Pages)', 'ภาษา (Language)', 'ประเภททรัพยากร (Resource type)', 'เลขหมู่ DDC (DDC no.)', 'เลขเรียกหนังสือ (Call no.)', 'หัวเรื่อง (Subjects)', 'ระดับชั้นที่เหมาะสม (Grade level)', 'สถานที่จัดเก็บ (Location)', 'สถานะ (Status)'];
const itemRow = b => [b.bc, b.isbn, b.t, b.ed, b.a, b.p, b.y, b.pg, b.lang, b.type, b.ddc, b.call, b.subj, b.lvl, b.loc, STATUS[b.s]];
const exportItems = () => { download(`punarn-items-${TODAY.getFullYear() + 543}${String(TODAY.getMonth() + 1).padStart(2, '0')}${String(TODAY.getDate()).padStart(2, '0')}.csv`, toCSV([ITEM_HEAD, ...BOOKS.map(itemRow)])); toast(`ส่งออก ${BOOKS.length} รายการเป็นไฟล์ CSV แล้ว`); };

/* simulated import with column mapping and error rows (FR-M1-04, FR-M2-06) */
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
function importDialog(kind) {
  const isStu = kind === 'students';
  const fields = isStu ? ['รหัสประจำตัว', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ชั้น', 'ห้อง', 'เพศ'] : ['บาร์โค้ด', 'ISBN', 'ชื่อเรื่อง', 'ผู้แต่ง', 'สำนักพิมพ์', 'ปีที่พิมพ์', 'เลขหมู่', 'มุมจัดเก็บ'];
  const sample = isStu
    ? [['เลขประจำตัว', 'คำนำหน้า', 'ชื่อ', 'สกุล', 'ชื่อเล่น', 'ระดับชั้น', 'ห้อง', 'เพศ'], ['46101', 'ด.ช.', 'ธนกร', 'บุญมา', 'ภู', 'ม.1', '1', 'ชาย'], ['46102', 'ด.ญ.', 'พิชชาภา', 'ทองดี', 'ใบเตย', 'ม.1', '1', 'หญิง'], ['41208', 'ด.ญ.', 'อรนภา', 'มีสุข', 'ปาย', 'ม.1', '1', 'หญิง'], ['46104', 'ด.ช.', 'ศุภกร', 'ใจดี', 'บอส', '', '1', 'ชาย'], ...Array.from({ length: 130 }, (_, i) => [String(46105 + i), 'ด.ญ.', 'นักเรียน', 'ใหม่', '', 'ม.1', String(1 + i % 4), 'หญิง'])]
    : [['Barcode', 'ISBN', 'Title', 'Author', 'Publisher', 'Year', 'DDC', 'Location'], ['1000301', '9780761169253', 'Steal Like an Artist', 'Austin Kleon', 'Workman', '2012', '153.35', 'มุมหนังสือภาษาอังกฤษ (ชั้น 2)'], ['1000001', '9781593279288', 'Python Crash Course', 'Eric Matthes', 'No Starch Press', '2019', '005.133', ''], ...Array.from({ length: 46 }, (_, i) => [String(1000302 + i), '', 'หนังสือบริจาค ' + (i + 1), '', '', '2565', '', ''])];
  const step1 = () => `<h2 id="dlg-h">${isStu ? 'นำเข้ารายชื่อนักเรียน' : 'นำเข้าทรัพยากร'}</h2><p class="muted">ใช้ไฟล์ CSV หรือ Excel แถวแรกต้องเป็นชื่อคอลัมน์</p>
    <label class="dz" style="display:block;margin-top:14px;cursor:pointer"><input type="file" accept=".csv,.xlsx,.xls" class="sr" data-file>ลากไฟล์มาวางที่นี่ หรือ<span style="color:var(--teal);text-decoration:underline">เลือกไฟล์</span></label>
    <div class="row wrap" style="margin-top:12px"><button class="btn sm" data-sample>ใช้ไฟล์ตัวอย่าง</button><button class="btn ghost sm" data-tpl>ดาวน์โหลดแบบฟอร์ม</button></div>
    <div class="acts"><button class="btn" data-close>ยกเลิก</button></div>`;
  const step2 = rows => {
    const head = rows[0], body = rows.slice(1);
    const RX = { 'รหัสประจำตัว': /รหัส|เลขประจำตัว|student.?id/i, 'คำนำหน้า': /คำนำหน้า|prefix/i, 'ชื่อ': /^\s*(ชื่อ|first ?name)\s*$/i, 'นามสกุล': /สกุล|last ?name|surname/i, 'ชื่อเล่น': /เล่น|nick/i, 'ชั้น': /ชั้น|grade|level/i, 'ห้อง': /ห้อง|room/i, 'เพศ': /เพศ|gender|sex/i,
      'บาร์โค้ด': /บาร์โค้ด|barcode|ทะเบียน/i, 'ISBN': /isbn/i, 'ชื่อเรื่อง': /ชื่อเรื่อง|title/i, 'ผู้แต่ง': /ผู้แต่ง|author/i, 'สำนักพิมพ์': /สำนักพิมพ์|publish/i, 'ปีที่พิมพ์': /ปี|year/i, 'เลขหมู่': /เลขหมู่|ddc|dewey/i, 'มุมจัดเก็บ': /มุม|สถานที่|locat/i };
    const guess = f => head.findIndex(h => RX[f].test(h));
    const map = fields.map(guess);
    const errs = [];
    body.forEach((r, i) => {
      if (isStu) { if (SBY[r[0]]) errs.push([i + 2, `รหัส ${r[0]} ซ้ำกับนักเรียนที่มีอยู่ (${fullName(SBY[r[0]])})`]); else if (!r[5]) errs.push([i + 2, 'ไม่มีระดับชั้น']); }
      else { if (BY[r[0]]) errs.push([i + 2, `เลขทะเบียน ${r[0]} มีอยู่แล้ว (${shortTitle(BY[r[0]].t)})`]); else if (!r[6]) errs.push([i + 2, 'ไม่มีเลขหมู่ ระบบจะแนะนำให้หลังนำเข้า']); }
    });
    const hard = errs.filter(e => !/แนะนำ/.test(e[1])).length;
    return `<h2 id="dlg-h">จับคู่คอลัมน์และตรวจข้อมูล</h2><p class="muted">พบ ${body.length} แถว ระบบจับคู่คอลัมน์ให้แล้ว ตรวจแล้วแก้ได้</p>
      <div class="grid2" style="margin-top:14px">${fields.map((f, i) => `<label class="field"><span>${f}</span><select class="input"><option value="-1">ไม่ใช้</option>${head.map((h, j) => `<option ${map[i] === j ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></label>`).join('')}</div>
      ${errs.length ? `<div class="msg ${hard ? 'err' : 'warn'}" style="display:block"><b>มี ${errs.length} แถวที่ต้องตรวจ</b><ul style="margin:6px 0 0;padding-left:18px">${errs.slice(0, 5).map(e => `<li>แถวที่ ${e[0]}: ${esc(e[1])}</li>`).join('')}${errs.length > 5 ? `<li>และอีก ${errs.length - 5} แถว</li>` : ''}</ul></div>` : '<div class="msg ok">ไม่พบแถวที่มีปัญหา</div>'}
      <div class="acts"><button class="btn" data-close>ยกเลิก</button>${errs.length ? '<button class="btn" data-errs>ดาวน์โหลดแถวที่มีปัญหา</button>' : ''}<button class="btn primary" data-go>${isStu ? `สร้างบัญชี ${body.length - hard} คน` : `นำเข้า ${body.length - hard} รายการ`}</button></div>`;
  };
  openDialog(step1(), dlg => {
    const show = rows => {
      dlg.innerHTML = step2(rows);
      $('[data-errs]', dlg)?.addEventListener('click', () => download('import-errors.csv', toCSV([['แถว', 'ปัญหา'], ['ดูรายละเอียดในหน้าจอนำเข้า', '']])));
      $('[data-go]', dlg).addEventListener('click', () => { closeDialog(); toast(isStu ? 'สร้างบัญชีนักเรียนแล้ว (ต้นแบบ: ไม่เพิ่มข้อมูลจริง)' : 'นำเข้าแล้ว (ต้นแบบ: ไม่เพิ่มข้อมูลจริง)'); S.audit.unshift({ t: now(), who: ME().name, what: isStu ? `นำเข้ารายชื่อนักเรียน ${rows.length - 1} แถว` : `นำเข้าทรัพยากร ${rows.length - 1} แถว` }); });
    };
    $('[data-sample]', dlg).addEventListener('click', () => show(sample));
    $('[data-tpl]', dlg).addEventListener('click', () => download(isStu ? 'แบบฟอร์มรายชื่อนักเรียน.csv' : 'แบบฟอร์มทรัพยากร.csv', toCSV([fields])));
    $('[data-file]', dlg).addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      if (!/\.csv$/i.test(file.name)) { toast('ต้นแบบอ่านได้เฉพาะ CSV ใช้ไฟล์ตัวอย่างแทน'); show(sample); return; }
      file.text().then(t => { const rows = parseCSV(t.replace(/^﻿/, '')); rows.length > 1 ? show(rows) : toast('ไฟล์นี้ไม่มีข้อมูล'); });
    });
  });
}

/* ---------- Visits (FR-M5-04, FR-M5-05) ---------- */
function tVisits() {
  const tv = todayVisits().slice().reverse();
  const slotOpts = ['คาบ 1 (08:30–09:20)', 'คาบ 2 (09:20–10:10)', 'คาบ 3 (10:20–11:10)', 'คาบ 4 (11:10–12:00)', 'คาบ 5 (13:00–13:50)', 'คาบ 6 (13:50–14:40)', 'คาบ 7 (14:40–15:30)'];
  return {
    title: 'การเข้าใช้พื้นที่',
    actions: `<a class="btn" href="#/k">${ICON.kiosk}เปิด kiosk</a>`,
    body: `<div class="two">
      <div>
        <section class="panel" aria-labelledby="cu-h"><h2 id="cu-h">บันทึกการใช้ห้องสมุดเป็นห้องเรียน</h2><p class="small muted" style="margin:4px 0 14px">ใช้เมื่อครูพาทั้งห้องมาเรียนในห้องสมุด นับแยกจากการเข้าใช้รายคน</p>
          <form class="grid2" data-cu>
            <label class="field"><span>วันที่</span><input class="input" name="d" value="${thDate(TODAY)}"></label>
            <label class="field"><span>คาบเรียน</span><select class="input" name="slot">${slotOpts.map(s => `<option>${s}</option>`).join('')}</select></label>
            <label class="field"><span>ครูผู้สอน</span><input class="input" name="teacher" list="teachers" required><datalist id="teachers"><option>ครูสมชาย ใจดี</option><option>ครูอรอุมา แสงทอง</option><option>ครูมาลี ศรีวงศ์</option></datalist></label>
            <label class="field"><span>รายวิชา</span><input class="input" name="subj" placeholder="เช่น ภาษาไทย ท22101" required></label>
            <label class="field"><span>ชั้นและห้อง</span><select class="input" name="room">${[1, 2, 3, 4, 5, 6].flatMap(g => [1, 2, 3, 4].map(r => `<option>ม.${g}/${r}</option>`)).join('')}</select></label>
            <label class="field"><span>จำนวนนักเรียน</span><input class="input" name="n" inputmode="numeric" value="34" required></label>
            <div class="full"><button class="btn primary">บันทึกการใช้ห้องเรียน</button></div>
          </form>
          <table class="tbl" style="margin-top:18px"><thead><tr><th>วันที่</th><th>คาบ</th><th>ครูและรายวิชา</th><th>ห้อง</th><th class="num">นักเรียน</th></tr></thead><tbody>${S.classUse.slice().reverse().map(c => `<tr><td>${thShort(c.d)}</td><td class="small">${esc(c.slot)}</td><td>${esc(c.teacher)}<div class="small muted">${esc(c.subj)}</div></td><td>${esc(c.room)}</td><td class="num">${c.n}</td></tr>`).join('')}</tbody></table>
        </section>
        <section class="panel" aria-labelledby="bk-h"><h2 id="bk-h">บันทึกย้อนหลัง</h2><p class="small muted" style="margin:4px 0 14px">ใช้เมื่อนักเรียนเข้าใช้แต่ไม่ได้สแกน เช่น kiosk ปิดอยู่ รายการย้อนหลังมีเครื่องหมายกำกับในรายงาน</p>
          <form class="grid2" data-back>
            <label class="field"><span>วันที่</span><input class="input" name="d" value="${thDate(addDays(TODAY, -3))}"></label>
            <label class="field"><span>ช่วงเวลา</span><select class="input" name="slot">${SLOTS.map(s => `<option>${s[1]} (${s[2]})</option>`).join('')}</select></label>
            <label class="field full"><span>รหัสนักเรียน <em>คั่นด้วยเว้นวรรค หรือเว้นว่างแล้วใส่จำนวนคน</em></span><input class="input" name="ids" placeholder="41208 40115 45301"></label>
            <label class="field"><span>หรือจำนวนคน <em>(ไม่ระบุชื่อ)</em></span><input class="input" name="n" inputmode="numeric"></label>
            <div class="full"><button class="btn">บันทึกย้อนหลัง</button></div>
          </form><div id="bk-msg" aria-live="polite"></div>
        </section>
      </div>
      <section class="panel" aria-labelledby="tv-h"><div class="panel-h"><h2 id="tv-h">เข้าใช้วันนี้ ${tv.length} คน</h2></div>
        <table class="tbl"><thead><tr><th>เวลา</th><th>นักเรียน</th><th>ชั้น</th></tr></thead><tbody>${tv.slice(0, 14).map(v => { const s = SBY[v.sid]; return `<tr><td class="num" style="text-align:left">${hhmm(v.t)}</td><td>${esc(fullName(s))}</td><td>${cls(s)}</td></tr>`; }).join('')}</tbody></table>
        ${tv.length > 14 ? `<p class="small muted" style="margin-top:10px">และอีก ${tv.length - 14} คน ดูทั้งหมดในรายงานรายเดือน</p>` : ''}
      </section></div>`,
    mount(root) {
      $('[data-cu]', root).addEventListener('submit', e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
        S.classUse.push({ d: TODAY, slot: d.slot, teacher: d.teacher, subj: d.subj, room: d.room, n: +d.n || 0 }); enqueue({ type: 'class' });
        toast(`บันทึกการใช้ห้องเรียนแล้ว ${d.room} ${d.n} คน`); refresh();
      });
      $('[data-back]', root).addEventListener('submit', e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
        const ids = d.ids.split(/\s+/).filter(Boolean), bad = ids.filter(i => !SBY[i]);
        if (bad.length) { $('#bk-msg').innerHTML = `<div class="msg err" role="alert">ไม่พบรหัส ${bad.map(esc).join(' ')} ในโรงเรียนนี้ แก้แล้วบันทึกอีกครั้ง</div>`; return; }
        const n = ids.length || +d.n || 0; if (!n) { $('#bk-msg').innerHTML = '<div class="msg err" role="alert">ใส่รหัสนักเรียน หรือจำนวนคนอย่างน้อย 1 คน</div>'; return; }
        S.back.push({ d: d.d, slot: d.slot, n, ids }); S.audit.unshift({ t: now(), who: ME().name, what: `บันทึกการเข้าใช้ย้อนหลัง ${n} คน วันที่ ${d.d}` });
        $('#bk-msg').innerHTML = `<div class="msg ok saved" role="status">บันทึกย้อนหลังแล้ว ${n} คน วันที่ ${esc(d.d)}</div>`; e.target.reset();
      });
    }
  };
}

/* ---------- Reports (FR-M6-01..03, US-02) ---------- */
function tReports(q) {
  const opts = MONTHS.filter(m => !(m.y === 2026 && m.m > 8)).map(m => [`${m.y}-${m.m}`, monthLabel(m, true) + (m.partial ? ' (ถึงวันนี้)' : '')]).reverse();
  const key = q.m || '2026-7'; const [y, m] = key.split('-').map(Number);
  const R = monthStats(y, m), mo = R.mo;
  const tot = R.byGrade.reduce((a, g) => ({ f: a.f + g.f, m: a.m + g.m, l: a.l + g.loans }), { f: 0, m: 0, l: 0 });
  const daily = chartCols(R.days.map(d => ({ group: '', label: d.d.getDate() % 5 === 1 || R.days.length < 12 ? String(d.d.getDate()) : '', v: d.v, hi: true, tip: `<b>${thDay(d.d)}</b>|${fmt(d.v)} ครั้ง` })), { w: 720, h: 170, pad: 3, aria: 'กราฟผู้เข้าใช้รายวัน' });
  const title = `รายงานการใช้ห้องสมุด ประจำเดือน${TMF[m]} ${y + 543}`;
  const report = `<article class="report" id="report">
    <header><div class="row" style="align-items:flex-start">${CREST(44)}<div><h2 style="margin:0;font-size:1.25rem">${title}</h2><p class="muted">${esc(SCHOOL.name)}${mo.partial ? ' ข้อมูลถึงวันที่ 14 ก.ย. 2569' : ''}</p></div></div><div class="small muted" style="text-align:right">พิมพ์เมื่อ ${thDate(TODAY)}<br>จากระบบปันอ่าน</div></header>
    <div class="rep-figs"><div><b class="num">${fmt(mo.visits)}</b><span>ผู้เข้าใช้ (ครั้ง)</span></div><div><b class="num">${fmt(R.uniq)}</b><span>นักเรียนที่เข้าใช้ (คน)</span></div><div><b class="num">${fmt(mo.loans)}</b><span>ยืมหนังสือ (เล่ม)</span></div><div><b class="num">${fmt(R.classes.length)}</b><span>ใช้เป็นห้องเรียน (ครั้ง)</span></div></div>
    <h2>ผู้เข้าใช้รายวัน</h2><div class="chart" id="rep-chart">${daily}</div>
    <h2>แยกตามระดับชั้นและเพศ</h2>
    <table class="tbl"><thead><tr><th>ระดับชั้น</th><th class="num">ชาย</th><th class="num">หญิง</th><th class="num">รวม (ครั้ง)</th><th class="num">ยืม (เล่ม)</th></tr></thead><tbody>${R.byGrade.map(g => `<tr><td>ม.${g.g}</td><td class="num">${fmt(g.m)}</td><td class="num">${fmt(g.f)}</td><td class="num">${fmt(g.m + g.f)}</td><td class="num">${fmt(g.loans)}</td></tr>`).join('')}<tr><td><b>รวม</b></td><td class="num"><b>${fmt(tot.m)}</b></td><td class="num"><b>${fmt(tot.f)}</b></td><td class="num"><b>${fmt(tot.m + tot.f)}</b></td><td class="num"><b>${fmt(tot.l)}</b></td></tr></tbody></table>
    <h2>แยกตามช่วงเวลา</h2>
    <table class="tbl"><thead><tr><th>ช่วงเวลา</th><th>เวลา</th><th class="num">ครั้ง</th><th class="num">ร้อยละ</th></tr></thead><tbody>${R.bySlot.map(s => `<tr><td>${s.label}</td><td>${s.time} น.</td><td class="num">${fmt(s.v)}</td><td class="num">${Math.round(s.v / mo.visits * 100)}</td></tr>`).join('')}</tbody></table>
    <h2>การยืม-คืน</h2><p>ยืม ${fmt(mo.loans)} เล่ม รับคืน ${fmt(R.returns)} เล่ม หนังสือที่ถูกยืมมากที่สุด 10 อันดับ</p>
    <table class="tbl"><thead><tr><th>อันดับ</th><th>ชื่อเรื่อง</th><th>ประเภท</th><th class="num">ครั้ง</th></tr></thead><tbody>${R.top.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(shortTitle(x.b.t))}</td><td class="small">${esc(x.b.type)}</td><td class="num">${x.n}</td></tr>`).join('')}</tbody></table>
    <h2>การใช้ห้องสมุดเป็นห้องเรียน</h2>
    <table class="tbl"><thead><tr><th>วันที่</th><th>ครูผู้สอน</th><th>รายวิชา</th><th>ห้อง</th><th class="num">นักเรียน</th></tr></thead><tbody>${R.classes.map(c => `<tr><td>${thShort(c.d)}</td><td>${esc(c.teacher)}</td><td>${esc(c.subj)}</td><td>${esc(c.room)}</td><td class="num">${c.n}</td></tr>`).join('')}</tbody></table>
    <div class="row sig" style="justify-content:space-around;margin-top:48px;text-align:center"><div>ลงชื่อ ........................................<br>(ครูวิไลวรรณ ทองคำ)<br>ครูผู้รับผิดชอบห้องสมุด</div><div>ลงชื่อ ........................................<br>(นายประเสริฐ มั่นคง)<br>ผู้อำนวยการ${esc(SCHOOL.name)}</div></div>
  </article>`;
  return {
    title: 'รายงาน',
    actions: `<button class="btn" data-xls>${ICON.export}ดาวน์โหลด Excel</button><button class="btn primary" data-pdf>${ICON.print}ดาวน์โหลด PDF</button>`,
    body: `<form class="frow noprint" data-rf><label class="field"><span>เดือน</span><select class="input" name="m">${opts.map(([v, t]) => `<option value="${v}" ${v === key ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <p class="small muted" style="align-self:center;max-width:52ch">รายงานสร้างเองทุกสิ้นเดือน ปุ่ม PDF เปิดหน้าพิมพ์ ให้เลือก "บันทึกเป็น PDF" ปุ่ม Excel ได้ไฟล์ CSV ที่เปิดใน Excel ได้</p></form>${report}`,
    mount(root) {
      $('[data-rf]', root).addEventListener('change', e => { history.replaceState(null, '', '#/t/reports?m=' + e.target.value); refresh(); });
      $('[data-pdf]', document).addEventListener('click', () => window.print());
      $('[data-xls]', document).addEventListener('click', () => {
        const rows = [[title], [SCHOOL.name], [], ['ผู้เข้าใช้ (ครั้ง)', mo.visits], ['นักเรียนที่เข้าใช้ (คน)', R.uniq], ['ยืม (เล่ม)', mo.loans], ['คืน (เล่ม)', R.returns], ['ใช้เป็นห้องเรียน (ครั้ง)', R.classes.length], [],
          ['ระดับชั้น', 'ชาย', 'หญิง', 'รวม', 'ยืม'], ...R.byGrade.map(g => ['ม.' + g.g, g.m, g.f, g.m + g.f, g.loans]), [], ['ช่วงเวลา', 'เวลา', 'ครั้ง'], ...R.bySlot.map(s => [s.label, s.time, s.v]), [],
          ['วันที่', 'ผู้เข้าใช้'], ...R.days.map(d => [thDate(d.d), d.v]), [], ['อันดับ', 'ชื่อเรื่อง', 'ครั้ง'], ...R.top.map((x, i) => [i + 1, shortTitle(x.b.t), x.n])];
        download(`รายงานห้องสมุด-${TMF[m]}-${y + 543}.csv`, toCSV(rows)); toast('ดาวน์โหลดไฟล์สำหรับ Excel แล้ว');
      });
      bindTips(root);
    }
  };
}

/* ---------- Admin: import students & promotion (FR-M1-04, M1-05) ---------- */
function tImport() {
  const per = [1, 2, 3, 4, 5, 6].map(g => STUDENTS.filter(s => s.g === g).length);
  return {
    title: 'นำเข้านักเรียน',
    body: `<section class="panel"><h2>นำเข้ารายชื่อนักเรียนจากไฟล์</h2><p class="muted" style="margin:6px 0 16px">ใช้ไฟล์ CSV หรือ Excel จากระบบทะเบียนของโรงเรียน ระบบจะจับคู่คอลัมน์ให้ และแสดงแถวที่มีปัญหาก่อนสร้างบัญชี นักเรียนเข้าสู่ระบบด้วยรหัสประจำตัว ไม่ต้องมีอีเมล</p>
      <div class="row wrap"><button class="btn primary" data-imp>${ICON.import}เลือกไฟล์รายชื่อ</button><button class="btn" data-tpl>ดาวน์โหลดแบบฟอร์ม</button></div>
      <p class="small muted" style="margin-top:12px">ตอนนี้มีนักเรียน ${fmt(STUDENTS.length)} คน นำเข้าล่าสุด 16 พ.ค. 2569</p></section>
    <section class="panel"><h2>เลื่อนชั้นประจำปีการศึกษา</h2><p class="muted" style="margin:6px 0 16px">ทำปีละครั้งก่อนเปิดภาคเรียนที่ 1 นักเรียนทุกคนเลื่อนขึ้น 1 ชั้น นักเรียน ม.6 ย้ายเป็นศิษย์เก่า ประวัติการยืมและการเข้าใช้ยังอยู่ครบ</p>
      <table class="tbl" style="max-width:560px"><thead><tr><th>ปัจจุบัน</th><th class="num">จำนวน</th><th>หลังเลื่อนชั้น</th></tr></thead><tbody>${per.map((n, i) => `<tr><td>ม.${i + 1}</td><td class="num">${n}</td><td>${i < 5 ? 'ม.' + (i + 2) : 'ศิษย์เก่า (ยืมไม่ได้)'}</td></tr>`).join('')}</tbody></table>
      <p style="margin-top:16px"><button class="btn" data-promote>เลื่อนชั้นเป็นปีการศึกษา 2570</button></p></section>`,
    mount(root) {
      $('[data-imp]', root).addEventListener('click', () => importDialog('students'));
      $('[data-tpl]', root).addEventListener('click', () => download('แบบฟอร์มรายชื่อนักเรียน.csv', toCSV([['รหัสประจำตัว', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ชั้น', 'ห้อง', 'เพศ']])));
      $('[data-promote]', root).addEventListener('click', () => openDialog(`<h2 id="dlg-h">เลื่อนชั้นนักเรียนทั้งโรงเรียน</h2><p>นักเรียน ${fmt(STUDENTS.length)} คนจะเลื่อนขึ้น 1 ชั้น และ ม.6 จำนวน ${per[5]} คนจะเป็นศิษย์เก่า</p><p class="small muted" style="margin-top:8px">ทำได้ปีละครั้ง ถ้าทำผิด ติดต่อผู้ดูแลระบบส่วนกลางเพื่อย้อนกลับภายใน 7 วัน</p>
        <label class="row" style="margin-top:14px"><input type="checkbox" data-ok> ตรวจแล้วว่าเป็นช่วงปิดภาคเรียน</label>
        <div class="acts"><button class="btn" data-close>ยกเลิก</button><button class="btn primary" data-go disabled>เลื่อนชั้นเป็นปี 2570</button></div>`, d => {
        $('[data-ok]', d).addEventListener('change', e => { $('[data-go]', d).disabled = !e.target.checked; });
        $('[data-go]', d).addEventListener('click', () => { closeDialog(); toast('ต้นแบบ: จำลองการเลื่อนชั้น ไม่เปลี่ยนข้อมูลจริง'); });
      }));
    }
  };
}

/* ---------- Admin: users & roles, transfer admin (FR-M1-02, M1-06, US-07) ---------- */
function tUsers() {
  return {
    title: 'ผู้ใช้และสิทธิ์',
    actions: `<button class="btn" data-add>เพิ่มยุวบรรณารักษ์</button><button class="btn primary" data-transfer>โอนสิทธิ์ผู้ดูแล</button>`,
    body: `<section class="panel"><h2 style="margin-bottom:12px">ครูและผู้บริหาร</h2><table class="tbl"><thead><tr><th>ชื่อ</th><th>บทบาท</th><th>หมายเหตุ</th></tr></thead><tbody>${STAFF.map(s => `<tr><td>${esc(s.name)}</td><td>${s.role === 'ผู้ดูแลระดับโรงเรียน' ? `<span class="pill on-shelf">${s.role}</span>` : esc(s.role)}</td><td class="small muted">${esc(s.note)}</td></tr>`).join('')}</tbody></table></section>
    <section class="panel"><h2>ยุวบรรณารักษ์ ${ASSIST_IDS.length} คน</h2><p class="small muted" style="margin:4px 0 12px">ยืม-คืน เปิด kiosk และลงรายการเป็นร่างได้ เห็นผู้ยืมเพียงชื่อและชั้น ไม่เห็นประวัติการยืม ไม่เห็นรายงาน</p>
      <table class="tbl"><thead><tr><th>ชื่อ</th><th>ชั้น</th><th>รหัส</th><th></th></tr></thead><tbody>${ASSIST_IDS.map(id => `<tr><td>${esc(fullName(SBY[id]))}</td><td>${cls(SBY[id])}</td><td class="num" style="text-align:left">${id}</td><td class="num"><button class="btn ghost sm" data-rm="${id}">ยกเลิกสิทธิ์</button></td></tr>`).join('')}</tbody></table></section>
    <section class="panel"><h2 style="margin-bottom:12px">ประวัติการแก้ไขข้อมูล</h2><table class="tbl"><tbody>${S.audit.slice(0, 8).map(a => `<tr><td class="small" style="white-space:nowrap">${thShort(a.t)} ${hhmm(a.t)}</td><td class="small">${esc(a.who)}</td><td class="small">${esc(a.what)}</td></tr>`).join('')}</tbody></table></section>`,
    mount() {
      $('[data-transfer]').addEventListener('click', () => openDialog(`<h2 id="dlg-h">โอนสิทธิ์ผู้ดูแลระดับโรงเรียน</h2><p class="muted">ใช้เมื่อเปลี่ยนครูผู้รับผิดชอบห้องสมุด ข้อมูลหนังสือ สถิติ และรายงานทั้งหมดอยู่ครบ ไม่มีอะไรถูกลบ</p>
        <form data-tr class="stack" style="margin-top:14px"><label class="field"><span>โอนให้</span><select class="input" name="to">${STAFF.filter(s => s.role !== 'ผู้ดูแลระดับโรงเรียน' && s.role !== 'ผู้บริหารโรงเรียน').map(s => `<option>${s.name}</option>`).join('')}<option>ครูท่านอื่น (ส่งคำเชิญทางอีเมล)</option></select></label>
        <label class="row small"><input type="checkbox" name="keep" checked> ให้ฉันยังเป็นครูผู้รับผิดชอบห้องสมุดต่อ</label>
        <p class="small muted">ผู้รับจะได้อีเมลยืนยัน สิทธิ์จะโอนเมื่อผู้รับกดยืนยัน</p>
        <div class="acts"><button type="button" class="btn" data-close>ยกเลิก</button><button class="btn primary">ส่งคำขอโอนสิทธิ์</button></div></form>`, d => {
        $('[data-tr]', d).addEventListener('submit', e => { e.preventDefault(); const to = e.target.to.value; closeDialog(); S.audit.unshift({ t: now(), who: 'ครูวิไลวรรณ ทองคำ', what: `ส่งคำขอโอนสิทธิ์ผู้ดูแลให้ ${to}` }); toast(`ส่งคำขอโอนสิทธิ์ให้ ${to} แล้ว รอการยืนยัน`); refresh(); });
      }));
      $('[data-add]').addEventListener('click', () => openDialog(`<h2 id="dlg-h">เพิ่มยุวบรรณารักษ์</h2><form data-ad class="stack" style="margin-top:10px"><label class="field"><span>รหัสประจำตัวนักเรียน</span><input class="input" name="id" inputmode="numeric" maxlength="5" data-autofocus></label><div id="ad-who" class="small" aria-live="polite"></div>
        <div class="acts"><button type="button" class="btn" data-close>ยกเลิก</button><button class="btn primary">ให้สิทธิ์ยุวบรรณารักษ์</button></div></form>`, d => {
        const f = $('[data-ad]', d);
        f.id.addEventListener('input', () => { const s = SBY[f.id.value]; $('#ad-who', d).textContent = s ? `${fullName(s)} ${cls(s)}` : f.id.value.length === 5 ? 'ไม่พบรหัสนี้' : ''; });
        f.addEventListener('submit', e => { e.preventDefault(); const s = SBY[f.id.value]; if (!s) { $('#ad-who', d).textContent = 'ไม่พบรหัสนี้ ตรวจรหัส 5 หลักอีกครั้ง'; return; } if (!ASSIST_IDS.includes(s.id)) ASSIST_IDS.push(s.id); closeDialog(); toast(`ให้สิทธิ์ยุวบรรณารักษ์แก่ ${s.first} แล้ว`); refresh(); });
      }));
      $$('[data-rm]').forEach(b => b.addEventListener('click', () => { const i = ASSIST_IDS.indexOf(b.dataset.rm); ASSIST_IDS.splice(i, 1); toast('ยกเลิกสิทธิ์แล้ว'); refresh(); }));
    }
  };
}

/* ---------- Admin: settings (FR-M3-03) ---------- */
function tSettings() {
  const P = S.policy;
  return {
    title: 'ตั้งค่าโรงเรียน',
    body: `<form data-set>
      <section class="panel"><h2 style="margin-bottom:14px">ข้อมูลโรงเรียน</h2><div class="grid2">
        <label class="field"><span>ชื่อโรงเรียน</span><input class="input" name="name" value="${esc(SCHOOL.name)}"></label>
        <div class="field"><span class="ui" style="display:block;font-size:.86rem;font-weight:500;margin-bottom:6px">ตราโรงเรียน</span><div class="row">${CREST(40)}<label class="btn sm">เปลี่ยนรูป<input type="file" accept="image/*" class="sr"></label></div></div>
      </div><p class="small muted" style="margin-top:10px">ชื่อและตราแสดงบนหน้าค้นหาของนักเรียน kiosk และหัวรายงาน</p></section>
      <section class="panel"><h2 style="margin-bottom:14px">นโยบายการยืม</h2><div class="grid3">
        <label class="field"><span>ยืมได้สูงสุด <em>(เล่มต่อคน)</em></span><input class="input" name="max" type="number" min="1" max="10" value="${P.max}"></label>
        <label class="field"><span>ระยะเวลายืม <em>(วัน)</em></span><input class="input" name="days" type="number" min="1" max="30" value="${P.days}"></label>
        <label class="field"><span>ต่ออายุได้ <em>(ครั้ง)</em></span><input class="input" name="renew" type="number" min="0" max="3" value="${P.renew}"></label>
        <label class="field full"><span>เมื่อมีหนังสือเกินกำหนด</span><select class="input" name="block"><option value="0" ${P.block ? '' : 'selected'}>เตือน แต่ยังยืมเล่มใหม่ได้</option><option value="1" ${P.block ? 'selected' : ''}>ต้องคืนก่อน จึงยืมเล่มใหม่ได้</option></select></label>
      </div><p class="small muted" style="margin-top:10px">ถ้าวันครบกำหนดตรงกับวันหยุด ระบบเลื่อนเป็นวันเปิดเรียนถัดไปให้</p></section>
      <section class="panel"><h2 style="margin-bottom:14px">Kiosk และมุมจัดเก็บ</h2><div class="grid2">
        <label class="field"><span>PIN สำหรับออกจากโหมด kiosk</span><input class="input" name="pin" inputmode="numeric" value="${esc(S.pin)}" maxlength="6"></label>
        <label class="field"><span>ไม่นับซ้ำเมื่อสแกนภายใน</span><select class="input"><option>30 นาที</option><option>60 นาที</option></select></label>
        <label class="field full"><span>มุมจัดเก็บหนังสือ <em>(บรรทัดละ 1 มุม)</em></span><textarea class="input" rows="6">${LOCS.join('\n')}</textarea></label>
      </div></section>
      <p style="margin-top:18px"><button class="btn primary">บันทึกการตั้งค่า</button></p></form>`,
    mount(root) {
      $('[data-set]', root).addEventListener('submit', e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
        Object.assign(S.policy, { max: +d.max || 3, days: +d.days || 7, renew: +d.renew || 0, block: d.block === '1' }); S.pin = d.pin || S.pin;
        S.audit.unshift({ t: now(), who: ME().name, what: `แก้นโยบายการยืม: ${S.policy.days} วัน ${S.policy.max} เล่ม` });
        toast('บันทึกการตั้งค่าแล้ว');
      });
    }
  };
}

/* ---------- Admin: export (FR-M12-01, M12-02, NFR-11) ---------- */
function marcxml() {
  const x = s => esc(s);
  const sf = (c, v) => v ? `<subfield code="${c}">${x(v)}</subfield>` : '';
  const df = (tag, i1, i2, inner) => inner ? `\n  <datafield tag="${tag}" ind1="${i1}" ind2="${i2}">${inner}</datafield>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<collection xmlns="http://www.loc.gov/MARC21/slim">` + BOOKS.map(b => `\n<record>\n  <leader>00000nam a2200000 a 4500</leader>\n  <controlfield tag="001">${b.bc}</controlfield>`
    + df('020', ' ', ' ', sf('a', b.isbn)) + df('082', '0', '4', sf('a', b.ddc)) + df('100', '1', ' ', sf('a', String(b.a).split(',')[0]))
    + df('245', '1', '0', sf('a', b.t)) + df('250', ' ', ' ', sf('a', b.ed)) + df('264', ' ', '1', sf('b', b.p) + sf('c', b.y)) + df('300', ' ', ' ', sf('a', b.pg ? b.pg + ' p.' : ''))
    + String(b.subj || '').split(';').filter(s => s.trim()).map(s => df('650', ' ', '4', sf('a', s.trim()))).join('')
    + df('852', ' ', ' ', sf('b', b.loc) + sf('h', b.call) + sf('p', b.bc)) + '\n</record>').join('') + '\n</collection>\n';
}
function tExport() {
  const ymd = `${TODAY.getFullYear() + 543}${String(TODAY.getMonth() + 1).padStart(2, '0')}${String(TODAY.getDate()).padStart(2, '0')}`;
  const items = [
    ['items', 'ทรัพยากรทั้งหมด', `${BOOKS.length} รายการ`, 'CSV'],
    ['marc', 'ระเบียนบรรณานุกรม', `${BOOKS.length} ระเบียน ใช้ย้ายไประบบห้องสมุดอื่นได้`, 'MARCXML'],
    ['students', 'รายชื่อนักเรียน', `${fmt(STUDENTS.length)} คน`, 'CSV'],
    ['loans', 'การยืมที่ยังไม่คืน', `${S.loans.length} รายการ`, 'CSV'],
    ['visits', 'การเข้าใช้วันนี้', `${todayVisits().length} รายการ`, 'CSV']
  ];
  return {
    title: 'ส่งออกข้อมูล',
    body: `<section class="panel"><h2>ข้อมูลเป็นของโรงเรียน ดาวน์โหลดได้ทุกเมื่อ</h2><p class="muted" style="margin:6px 0 16px">ไฟล์ทั้งหมดเป็นรูปแบบเปิดที่โปรแกรมอื่นอ่านได้ เก็บไว้ส่งต่อครูคนใหม่ หรือย้ายไปใช้ระบบอื่นได้</p>
      <table class="tbl"><tbody>${items.map(([k, t, d, f]) => `<tr><td><div class="t">${t}</div><div class="small muted">${d}</div></td><td><span class="pill ref">${f}</span></td><td class="num"><button class="btn sm" data-x="${k}">${ICON.export}ดาวน์โหลด</button></td></tr>`).join('')}</tbody></table></section>
    <section class="panel"><h2>สำรองข้อมูลอัตโนมัติ</h2><p class="muted" style="margin-top:6px">ระบบสำรองข้อมูลทุกคืน ครั้งล่าสุด ${thDate(TODAY)} เวลา 02:00 น. เก็บย้อนหลัง 30 วัน</p></section>`,
    mount(root) {
      $$('[data-x]', root).forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.x;
        if (k === 'items') return exportItems();
        if (k === 'marc') { download(`punarn-marc-${ymd}.xml`, marcxml(), 'application/xml'); return toast(`ส่งออกระเบียน ${BOOKS.length} รายการเป็น MARCXML แล้ว`); }
        if (k === 'students') download(`punarn-students-${ymd}.csv`, toCSV([['รหัสประจำตัว', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ชื่อเล่น', 'ชั้น', 'ห้อง', 'เพศ'], ...STUDENTS.map(s => [s.id, s.pre, s.first, s.last, s.nick, 'ม.' + s.g, s.room, s.f ? 'หญิง' : 'ชาย'])]));
        if (k === 'loans') download(`punarn-loans-${ymd}.csv`, toCSV([['เลขทะเบียน', 'ชื่อเรื่อง', 'รหัสนักเรียน', 'ชื่อ', 'ชั้น', 'วันที่ยืม', 'กำหนดคืน'], ...S.loans.map(l => [l.bc, BY[l.bc].t, l.sid, fullName(SBY[l.sid]), cls(SBY[l.sid]), thDate(l.out), thDate(l.due)])]));
        if (k === 'visits') download(`punarn-visits-${ymd}.csv`, toCSV([['เวลา', 'รหัสนักเรียน', 'ชั้น', 'เพศ'], ...todayVisits().map(v => [hhmm(v.t), v.sid, cls(SBY[v.sid]), SBY[v.sid].f ? 'หญิง' : 'ชาย'])]));
        toast('ดาวน์โหลดแล้ว');
      }));
    }
  };
}

/* ---------- Help / manual (FR-M11-05, FR-M11-04) ---------- */
function tHelp() {
  const A = isA();
  const T = [
    ['circ', 'ยืมและคืนหนังสือ', `<ol><li>เปิดเมนู ยืม-คืน แท็บ <b>ยืม</b> (สีเขียว) หรือกด F2</li><li>สแกนบัตรนักเรียน หรือพิมพ์รหัส 5 หลักแล้วกด Enter</li><li>สแกนบาร์โค้ดหนังสือทีละเล่ม</li><li>กด <b>บันทึกการยืม</b> หรือกด Enter ที่ช่องว่าง</li></ol><p>คืนหนังสือ: เลือกแท็บ <b>คืน</b> (สีส้ม) หรือกด F4 แล้วสแกนหนังสือ ระบบบันทึกทันที ไม่ต้องสแกนบัตร</p><p>ถ้าสแกนหนังสือที่ยังไม่ได้คืนในแท็บยืม ระบบจะเตือนและมีปุ่มรับคืนให้</p>`],
    ['kiosk', 'เปิด kiosk ที่ทางเข้า', `<p>เปิดเมนู <b>เปิด kiosk</b> บนแท็บเล็ตหรือคอมพิวเตอร์ที่ทางเข้า วางไว้ได้ทั้งวัน นักเรียนสแกนบัตรหรือพิมพ์รหัส ระบบไม่นับซ้ำถ้าสแกนอีกภายใน 30 นาที</p><p>ออกจากโหมด kiosk: กดค้างที่ข้อความด้านล่างจอ 1 วินาที แล้วใส่ PIN ครู</p>`],
    ['catalog', 'ลงหนังสือใหม่', `<ol><li>สแกนเลข ISBN ที่ปกหลัง ระบบหาข้อมูลจากฐานข้อมูลกลาง</li><li>ตรวจว่าตรงกับเล่มในมือ แล้วกด <b>ใช่ เล่มนี้</b></li><li>ตรวจเลขทะเบียนและมุมจัดเก็บ${A ? ' แล้วกด <b>ส่งร่างให้ครูตรวจ</b>' : ' แล้วกด <b>บันทึกและพิมพ์ป้าย</b>'}</li></ol><p>หนังสือไม่มี ISBN: กด "กรอกข้อมูลเอง" พิมพ์ชื่อเรื่องและคำสำคัญ ระบบจะแนะนำเลขหมู่ 2–3 ตัวเลือกพร้อมเหตุผล</p>`],
    ['ddc', 'เลขหมู่และเลขเรียกหนังสือคืออะไร', `<p><b>เลขหมู่</b> (ระบบทศนิยมดิวอี้ หรือ DDC) คือตัวเลขบอกหมวดของหนังสือ เช่น 510 คณิตศาสตร์ 530 ฟิสิกส์ 895.913 นวนิยายไทย หนังสือเรื่องเดียวกันจึงอยู่ใกล้กันบนชั้น</p><p><b>เลขเรียกหนังสือ</b> คือเลขหมู่ ตามด้วยอักษรตัวแรกของชื่อผู้แต่ง และอักษรตัวแรกของชื่อเรื่อง เช่น ${spine('895.913 ศ ข', 'sm')} พิมพ์บนป้ายสันหนังสือ วางหนังสือบนชั้นเรียงตามเลขนี้จากน้อยไปมาก</p>`]
  ];
  if (!A) T.push(['report', 'ออกรายงานรายเดือน', '<ol><li>เปิดเมนู รายงาน แล้วเลือกเดือน</li><li>กด <b>ดาวน์โหลด PDF</b> ในหน้าพิมพ์ให้เลือก "บันทึกเป็น PDF"</li><li>ถ้าต้องการตัวเลขไปทำต่อ กด <b>ดาวน์โหลด Excel</b></li></ol>'], ['offline', 'เมื่ออินเทอร์เน็ตขัดข้อง', '<p>หน้า kiosk และหน้ายืม-คืนใช้งานต่อได้ ระบบเก็บรายการไว้ในเครื่องและแสดงแถบสีเหลืองบอกจำนวนรายการที่รอส่ง เมื่ออินเทอร์เน็ตกลับมา ระบบส่งเองโดยไม่ต้องกดอะไร อย่าปิดหน้าเว็บจนกว่าแถบสีเหลืองจะหายไป</p>'], ['handover', 'เปลี่ยนครูผู้รับผิดชอบ', '<p>เปิดเมนู ผู้ใช้และสิทธิ์ แล้วกด <b>โอนสิทธิ์ผู้ดูแล</b> ข้อมูลทั้งหมดอยู่ครบ ควรดาวน์โหลดข้อมูลเก็บไว้ที่เมนู ส่งออกข้อมูลก่อนโอนด้วย</p>']);
  return {
    title: A ? 'คู่มือยุวบรรณารักษ์' : 'คู่มือการใช้งาน',
    actions: `<button class="btn" data-feedback>${ICON.chat}แจ้งปัญหา</button><button class="btn primary" data-survey>ทำแบบประเมิน</button>`,
    body: `<section class="panel help"><p class="muted" style="margin-bottom:12px">${A ? 'สิ่งที่ยุวบรรณารักษ์ทำได้: ยืม-คืน เปิด kiosk และลงหนังสือใหม่เป็นร่างให้ครูตรวจ' : 'คำอธิบายสั้น ๆ ของงานที่ทำบ่อย ทุกหน้ามีไอคอน i อธิบายคำเฉพาะด้วย'}</p>
      ${T.map(([id, h, b], i) => `<details id="${id}" ${i === 0 || location.hash.endsWith(id) ? 'open' : ''}><summary><h2 style="display:inline;font-size:1.05rem">${h}</h2></summary><div class="help-b">${b}</div></details>`).join('')}</section>`,
    mount(root) { const t = location.hash.split('#')[2]; if (t) { const d = $('#' + t, root); if (d) { d.open = true; d.scrollIntoView(); } } }
  };
}

/* ---------- Feedback & survey (FR-M12-04, M12-05) ---------- */
function feedbackDialog() {
  openDialog(`<h2 id="dlg-h">แจ้งปัญหาหรือข้อเสนอแนะ</h2><p class="muted">ข้อความจะส่งถึงทีมพัฒนาปันอ่าน พร้อมชื่อหน้าจอที่คุณเปิดอยู่</p>
    <form data-fb class="stack" style="margin-top:14px"><label class="field"><span>เรื่อง</span><select class="input" name="k"><option>ใช้งานไม่ได้หรือผิดพลาด</option><option>ไม่เข้าใจวิธีใช้</option><option>อยากให้เพิ่มความสามารถ</option><option>อื่น ๆ</option></select></label>
    <label class="field"><span>รายละเอียด</span><textarea class="input" name="t" required data-autofocus placeholder="เกิดอะไรขึ้น หรืออยากให้ปรับอะไร"></textarea></label>
    <div class="acts"><button type="button" class="btn" data-close>ยกเลิก</button><button class="btn primary">ส่งข้อความ</button></div></form>`, d => {
    $('[data-fb]', d).addEventListener('submit', e => { e.preventDefault(); if (!e.target.t.value.trim()) return e.target.t.focus(); closeDialog(); toast('ส่งข้อความถึงทีมพัฒนาแล้ว จะตอบกลับทางอีเมลภายใน 3 วันทำการ'); });
  });
}
function surveyDialog() {
  const Q = ['ระบบนี้ใช้งานง่าย', 'ทำงานประจำวันของห้องสมุดได้เร็วขึ้น', 'คำและข้อความบนหน้าจอเข้าใจง่าย', 'อยากใช้ระบบนี้ต่อไป', 'จะแนะนำให้ครูโรงเรียนอื่นใช้'];
  openDialog(`<h2 id="dlg-h">แบบประเมินความพึงพอใจ</h2><p class="muted">ใช้ในการวิจัยโครงการปันอ่าน ใช้เวลาประมาณ 2 นาที คำตอบไม่ระบุชื่อ</p>
    <form data-sv style="margin-top:12px">${Q.map((q, i) => `<fieldset style="border:0;padding:10px 0;margin:0;border-top:1px solid var(--line-2)"><legend style="font-weight:500;padding:0">${i + 1}. ${q}</legend><div class="row wrap" style="gap:6px;margin-top:6px">${['ไม่เห็นด้วยอย่างยิ่ง', 'ไม่เห็นด้วย', 'เฉย ๆ', 'เห็นด้วย', 'เห็นด้วยอย่างยิ่ง'].map((l, j) => `<label class="chip"><input type="radio" name="q${i}" value="${j + 1}" required> ${l}</label>`).join('')}</div></fieldset>`).join('')}
    <label class="field" style="margin-top:10px"><span>ข้อเสนอแนะเพิ่มเติม <em>(ถ้ามี)</em></span><textarea class="input" name="c"></textarea></label>
    <div class="acts"><button type="button" class="btn" data-close>ทำภายหลัง</button><button class="btn primary">ส่งแบบประเมิน</button></div></form>`, d => {
    $('[data-sv]', d).addEventListener('submit', e => { e.preventDefault(); closeDialog(); toast('ส่งแบบประเมินแล้ว ขอบคุณที่ช่วยพัฒนาระบบ'); });
  });
}
