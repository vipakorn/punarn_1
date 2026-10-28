/* ================= Teacher / student assistant (desktop) ================= */
const isA = () => S.role === 'assistant';
const base = () => isA() ? '#/a/' : '#/t/';
const ME = () => isA() ? { name: fullName(SBY['43105']), sub: cls(SBY['43105']), badge: 'ยุวบรรณารักษ์' } : { name: 'ครูวิไลวรรณ ทองคำ', sub: 'ครูผู้รับผิดชอบห้องสมุด', badge: 'ผู้ดูแลระดับโรงเรียน' };
function tNav() {
  if (isA()) return [{ items: [['circ', 'ยืม-คืน', 'circ'], ['catalog', 'ลงหนังสือใหม่ (ร่าง)', 'catalog'], ['#/k', 'เปิด kiosk', 'kiosk'], ['help', 'คู่มือยุวบรรณารักษ์', 'help']] }];
  return [
    { items: [['today', 'วันนี้', 'today'], ['circ', 'ยืม-คืน', 'circ'], ['catalog', 'ลงหนังสือใหม่', 'catalog'], ['labels', 'พิมพ์ป้าย', 'labels'], ['items', 'ทรัพยากรทั้งหมด', 'items'], ['visits', 'การเข้าใช้พื้นที่', 'visits'], ['reports', 'รายงาน', 'report'], ['#/k', 'เปิด kiosk', 'kiosk']] },
    { grp: 'ตั้งค่าโรงเรียน', items: [['admin/import', 'นำเข้านักเรียน', 'import'], ['admin/users', 'ผู้ใช้และสิทธิ์', 'users'], ['admin/settings', 'ตั้งค่าโรงเรียน', 'settings'], ['admin/export', 'ส่งออกข้อมูล', 'export']] },
    { grp: 'ช่วยเหลือ', items: [['help', 'คู่มือการใช้งาน', 'help']] }
  ];
}
function tShell(page, title, body, actions = '') {
  const nav = tNav().map(g => `${g.grp ? `<div class="grp">${g.grp}</div>` : ''}${g.items.map(([k, l, ic]) => {
    const href = k.startsWith('#') ? k : base() + k;
    return `<a href="${href}" ${k === page ? 'aria-current="page"' : ''}>${ICON[ic]}<span>${l}</span>${k === 'today' && S.drafts.length ? `<span class="sr"> มีร่างรอตรวจ</span>` : ''}</a>`;
  }).join('')}`).join('');
  const me = ME();
  return `<div class="t-shell"><aside class="t-side noprint">${schoolMark('ห้องสมุด บนระบบปันอ่าน')}<nav aria-label="เมนูห้องสมุด">${nav}</nav>
    <div class="me"><b>${esc(me.name)}</b><span class="muted">${esc(me.sub)}</span><br><span class="badge">${me.badge}</span>
    <button type="button" class="linkbtn" data-feedback style="display:block;margin-top:8px">แจ้งปัญหาหรือข้อเสนอแนะ</button></div></aside>
    <div class="t-main"><header class="t-top"><h1 tabindex="-1">${title}</h1>${actions}${fszControl()}</header>${offlineBar()}<main class="t-body">${body}</main></div></div>`;
}
document.addEventListener('click', e => { if (e.target.closest('[data-feedback]')) feedbackDialog(); if (e.target.closest('[data-survey]')) surveyDialog(); });

function viewTeacher(p, q) {
  const page = p.join('/') || (isA() ? 'circ' : 'today');
  if (isA() && !['circ', 'catalog', 'help'].includes(page)) {
    return { title: 'ไม่มีสิทธิ์', html: tShell('', 'หน้านี้สำหรับครู', `<div class="panel"><h2>หน้านี้สำหรับครูผู้รับผิดชอบห้องสมุด</h2><p class="muted" style="margin-top:6px">ยุวบรรณารักษ์ใช้ได้เฉพาะยืม-คืน ลงรายการเป็นร่าง และเปิด kiosk</p><p style="margin-top:16px"><a class="btn primary" href="#/a/circ">ไปหน้ายืม-คืน</a></p></div>`) };
  }
  const V = { today: tToday, circ: tCirc, catalog: tCatalog, labels: tLabels, items: tItems, visits: tVisits, reports: tReports, 'admin/import': tImport, 'admin/users': tUsers, 'admin/settings': tSettings, 'admin/export': tExport, help: tHelp }[page];
  if (!V) return { html: tShell('', 'ไม่พบหน้านี้', `<div class="panel"><p>ไม่พบหน้าที่ต้องการ</p><p style="margin-top:12px"><a class="btn" href="${base()}${isA() ? 'circ' : 'today'}">กลับหน้าแรก</a></p></div>`) };
  const v = V(q);
  return { title: v.title, html: tShell(page, v.title, v.body, v.actions || ''), mount: v.mount };
}

/* ---------- Today ---------- */
function tToday() {
  const v = todayVisits().length, b = todayLog('borrow').length, r = todayLog('return').length, od = overdue();
  const steps = [['ตั้งชื่อและตราโรงเรียน', true, 'admin/settings'], [`นำเข้ารายชื่อนักเรียน ${fmt(STUDENTS.length)} คน`, true, 'admin/import'], ['ลงหนังสือเล่มแรกและพิมพ์ป้าย', BOOKS.length > 0, 'catalog'], ['เปิด kiosk ที่ทางเข้าห้องสมุด', S.kioskOpened, '#/k']];
  const done = steps.filter(s => s[1]).length;
  const tool = (href, ic, t, s, kbd) => `<a class="tool" href="${href}">${ICON[ic]}<b>${t}</b><small>${s}${kbd ? ` <kbd>${kbd}</kbd>` : ''}</small></a>`;
  const recent = [...S.log].filter(x => diffDays(x.t, TODAY) === 0).sort((a, b) => b.t - a.t).slice(0, 6);
  return {
    title: 'วันนี้',
    actions: `<span class="small muted">${thDay(TODAY)}</span>`,
    body: `<p class="muted">สวัสดี ครูวิไลวรรณ</p>
    <p class="today-lead" style="margin-top:4px">วันนี้มีนักเรียนเข้าห้องสมุดแล้ว <b>${v}&nbsp;คน</b> ยืมหนังสือไป <b>${b}&nbsp;เล่ม</b> รับคืน <b>${r}&nbsp;เล่ม</b> ${od.length ? `และมีหนังสือเกินกำหนดคืน <b class="warn">${od.length}&nbsp;เล่ม</b>` : 'และไม่มีหนังสือเกินกำหนดคืน'}</p>
    <div class="tools">
      ${tool('#/t/circ', 'circ', 'ยืม-คืน', 'สแกนบัตร แล้วสแกนหนังสือ', 'F2')}
      ${tool('#/t/catalog', 'catalog', 'ลงหนังสือใหม่', 'เริ่มจากเลข ISBN ที่ปกหลัง')}
      ${tool('#/k', 'kiosk', 'เปิด kiosk', 'หน้าจอบันทึกการเข้าใช้ที่ทางเข้า')}
      ${tool('#/t/reports', 'report', 'รายงานเดือนนี้', 'ดาวน์โหลด PDF ส่งผู้บริหาร')}
    </div>
    <div class="two">
      <div>
        <section class="panel" aria-labelledby="od-h"><div class="panel-h"><h2 id="od-h">เกินกำหนดคืน ${od.length} เล่ม</h2>${od.length ? `<button class="btn sm" data-copy>${ICON.copy}คัดลอกรายชื่อ</button>` : ''}</div>
          ${od.length ? `<table class="tbl"><thead><tr><th>ผู้ยืม</th><th>ชั้น</th><th>หนังสือ</th><th class="num">เกินกำหนด</th></tr></thead><tbody>
          ${od.map(l => { const s = SBY[l.sid], bk = BY[l.bc]; return `<tr><td>${esc(fullName(s))}</td><td>${cls(s)}</td><td class="t">${esc(shortTitle(bk.t))}</td><td class="num"><span class="pill late">${-diffDays(l.due, TODAY)} วัน</span></td></tr>`; }).join('')}
          </tbody></table><p class="small muted" style="margin-top:10px">นักเรียนเห็นวันครบกำหนดในหน้า "ของฉัน" ของตัวเองด้วย</p>` : '<p class="muted">ไม่มีหนังสือเกินกำหนด</p>'}
        </section>
        <section class="panel" aria-labelledby="dr-h"><div class="panel-h"><h2 id="dr-h">ร่างจากยุวบรรณารักษ์รอตรวจ ${S.drafts.length} รายการ</h2></div>
          ${S.drafts.length ? `<table class="tbl"><tbody>${S.drafts.map(d => `<tr><td style="width:48px">${cover(d)}</td><td><div class="t">${esc(shortTitle(d.t))}</div><div class="small muted">ลงโดย ${esc(SBY[d.by].first)} (${cls(SBY[d.by])}) เวลา ${hhmm(d.at)} น.</div></td><td class="num"><button class="btn sm" data-draft="${d.id}">ตรวจร่าง</button></td></tr>`).join('')}</tbody></table>` : '<p class="muted">ไม่มีร่างรอตรวจ</p>'}
        </section>
      </div>
      <div>
        <section class="panel" aria-labelledby="cl-h"><h2 id="cl-h">เริ่มต้นใช้งาน</h2>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="${done}" aria-label="ความคืบหน้า"><i style="width:${done * 25}%"></i></div>
          <p class="small muted">ทำแล้ว ${done} จาก 4 ขั้น</p>
          <ol class="checklist">${steps.map(([t, ok, h]) => `<li class="${ok ? 'done' : ''}"><span class="tick" aria-hidden="true">${ok ? ICON.check.replace('width="24" height="24"', 'width="14" height="14"') : ''}</span><span class="lbl">${t}<span class="sr">${ok ? ' (ทำแล้ว)' : ' (ยังไม่ได้ทำ)'}</span></span>${ok ? '' : `<a class="btn sm primary" href="${h.startsWith('#') ? h : '#/t/' + h}">เริ่ม</a>`}</li>`).join('')}</ol>
        </section>
        <section class="panel" aria-labelledby="rc-h"><h2 id="rc-h" style="margin-bottom:10px">ยืม-คืนล่าสุดวันนี้</h2>
          <table class="tbl"><tbody>${recent.map(x => `<tr><td class="num" style="text-align:left;width:56px">${hhmm(x.t)}</td><td>${x.type === 'borrow' ? '<span class="pill out">ยืม</span>' : '<span class="pill on-shelf">คืน</span>'}</td><td class="t">${esc(shortTitle(BY[x.bc].t))}</td></tr>`).join('') || '<tr><td class="muted">ยังไม่มีรายการ</td></tr>'}</tbody></table>
        </section>
      </div>
    </div>`,
    mount(root) {
      KEY = e => { if (e.key === 'F2') { e.preventDefault(); go('#/t/circ'); } };
      $('[data-copy]', root)?.addEventListener('click', () => {
        const txt = 'รายชื่อหนังสือเกินกำหนดคืน ' + thDate(TODAY) + '\n' + overdue().map(l => `${fullName(SBY[l.sid])} ${cls(SBY[l.sid])} ${shortTitle(BY[l.bc].t)} (เกิน ${-diffDays(l.due, TODAY)} วัน)`).join('\n');
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('คัดลอกรายชื่อแล้ว วางในกลุ่มไลน์ครูประจำชั้นได้เลย'), () => toast('คัดลอกไม่ได้ในเบราว์เซอร์นี้'));
      });
      $$('[data-draft]', root).forEach(b => b.addEventListener('click', () => draftDialog(S.drafts.find(d => d.id === b.dataset.draft))));
    }
  };
}
function bookFromRecord(r, item) {
  const bc = item.bc || nextBarcode();
  return addBook({ bc, isbn: r.isbn || '', t: r.t, ed: r.ed || '', a: r.a || '', p: r.p || '', y: r.y || '', pg: item.pg || r.pg || '', lang: r.lang || 'ไทย', type: r.type, cls: r.cls || DDC_CLASS[String(r.ddc)[0]], ddc: r.ddc, call: item.call || r.call || callNo(r.ddc, r.a, r.t), subj: r.subj || '', lvl: r.lvl || 'ม.1-6', loc: item.loc || r.loc || locFor(r.type, r.lang), st: 'พร้อมให้ยืม', cv: r.cv || '', src: r.src || '', note: item.note || '', s: 'on' });
}
function draftDialog(d) {
  if (!d) return;
  const kv = [['ผู้แต่ง', d.a], ['สำนักพิมพ์', d.p], ['ปีที่พิมพ์', d.y], ['ISBN', d.isbn || 'ไม่มี'], ['เลขหมู่ (DDC)', d.ddc], ['เลขเรียกหนังสือ', d.call], ['มุมจัดเก็บ', d.loc], ['ได้มาโดย', d.from + (d.donor ? ` (${d.donor})` : '')]].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
  openDialog(`<h2 id="dlg-h">ตรวจร่างรายการ</h2><p class="small muted">ลงโดย ${esc(fullName(SBY[d.by]))} ยุวบรรณารักษ์ ${cls(SBY[d.by])}</p>
    <div class="found" style="margin-top:14px">${cover(d)}<div><h3 style="font-family:var(--read)">${esc(d.t)}</h3><dl class="kv" style="margin-top:8px">${kv}</dl></div></div>
    <p class="small muted">ตรวจเลขหมู่และมุมจัดเก็บ ถ้าถูกต้องให้อนุมัติ ระบบจะออกเลขทะเบียนและใส่ในคิวพิมพ์ป้าย</p>
    <div class="acts"><button class="btn" data-back>ส่งกลับให้แก้ไข</button><button class="btn primary" data-ok>อนุมัติและเพิ่มเข้าห้องสมุด</button></div>`, dlg => {
    $('[data-ok]', dlg).addEventListener('click', () => {
      const b = bookFromRecord(d, {}); S.labelQueue.push(b.bc); S.drafts = S.drafts.filter(x => x !== d);
      S.audit.unshift({ t: now(), who: 'ครูวิไลวรรณ ทองคำ', what: `อนุมัติร่าง "${shortTitle(d.t)}" เลขทะเบียน ${b.bc}` });
      closeDialog(); toast(`อนุมัติแล้ว เลขทะเบียน ${b.bc} รอพิมพ์ป้าย`); refresh();
    });
    $('[data-back]', dlg).addEventListener('click', () => { S.drafts = S.drafts.filter(x => x !== d); closeDialog(); toast(`ส่งร่างกลับให้ ${SBY[d.by].first} แก้ไขแล้ว`); refresh(); });
  });
}

/* ---------- Circulation (FR-M3-01..04, NFR-02, NFR-05) ---------- */
function tCirc() {
  const C = S.circ || (S.circ = { mode: 'borrow', patron: null, basket: [], msg: null, returned: [] });
  return {
    title: 'ยืม-คืน',
    body: `<div class="tabs" role="tablist" aria-label="เลือกงาน">
        <button role="tab" id="tab-b" class="borrow" aria-selected="${C.mode === 'borrow'}" aria-controls="circ" data-mode="borrow">ยืม <kbd>F2</kbd></button>
        <button role="tab" id="tab-r" class="return" aria-selected="${C.mode === 'return'}" aria-controls="circ" data-mode="return">คืน <kbd>F4</kbd></button>
      </div>
      <section class="circ${C.mode === 'return' ? ' mode-return' : ''}" id="circ" role="tabpanel" aria-labelledby="${C.mode === 'return' ? 'tab-r' : 'tab-b'}"></section>`,
    mount(root) {
      const panel = $('#circ', root);
      const setMode = m => { C.mode = m; C.msg = null; refresh(); later(() => $('#scan')?.focus(), 0); };
      $$('[data-mode]', root).forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
      KEY = e => { if (e.key === 'F2') { e.preventDefault(); setMode('borrow'); } if (e.key === 'F4') { e.preventDefault(); setMode('return'); } };
      const quota = st => S.policy.max - loansOf(st.id).length - C.basket.length;
      const msgBox = () => C.msg ? `<div class="msg ${C.msg.k}${C.msg.k === 'ok' ? ' saved' : ''}" role="${C.msg.k === 'err' ? 'alert' : 'status'}"><div>${C.msg.h}${C.msg.act ? `<div style="margin-top:8px"><button class="btn sm" data-act>${C.msg.act[0]}</button></div>` : ''}</div></div>` : '';
      function drawBorrow() {
        const st = C.patron && SBY[C.patron];
        const step = st ? (C.basket.length ? 3 : 2) : 1;
        const stp = (n, t) => `<span class="${n < step ? 'done' : n === step ? 'on' : ''}"><i>${n < step ? '&#10003;' : n}</i>${t}</span>`;
        const due = nextSchoolDay(addDays(TODAY, S.policy.days));
        const tries = st ? BOOKS.filter(b => b.s === 'on' && !C.basket.includes(b.bc)).filter((b, i) => i % 37 === 3).slice(0, 4).map(b => b.bc).concat(['1000013', '1000999']) : ['41208', '40115', '45301', '1000013'];
        let pcard = '';
        if (st) {
          const my = loansOf(st.id), od = my.filter(l => diffDays(l.due, TODAY) < 0);
          pcard = `<div class="patron"><span class="avatar" aria-hidden="true">${esc(st.first[0])}</span><div><h3>${esc(fullName(st))}</h3><p class="small">${cls(st)} รหัส ${st.id}${isA() ? '' : ` ยืมอยู่ ${my.length} เล่ม`}</p>
            ${!isA() && my.length ? `<p class="small muted" style="margin-top:4px">${my.map(l => `${esc(shortTitle(BY[l.bc].t))} (${dueText(l.due).txt})`).join('<br>')}</p>` : ''}</div>
            <div class="quota num">${Math.max(0, quota(st))}<small>เล่มที่ยืมได้อีก</small></div></div>
            ${od.length ? `<div class="msg warn" role="status"><b>มีหนังสือเกินกำหนด ${od.length} เล่ม</b>&nbsp;${S.policy.block ? 'ตามนโยบายโรงเรียน ต้องคืนก่อนจึงยืมใหม่ได้' : 'เตือนให้นำมาคืน ยืมเล่มใหม่ได้ตามปกติ'}</div>` : ''}`;
        }
        panel.innerHTML = `<div class="stepper" aria-label="ขั้นตอน">${stp(1, 'ผู้ยืม')}${stp(2, 'หนังสือ')}${stp(3, 'บันทึก')}</div>
          <label class="field" for="scan"><span>${st ? 'สแกนบาร์โค้ดหนังสือ หรือพิมพ์เลขทะเบียน' : 'สแกนบัตรนักเรียน หรือพิมพ์รหัสประจำตัว'}</span></label>
          <form class="scan" data-scan><input class="input" id="scan" autocomplete="off" inputmode="numeric" placeholder="${st ? 'เลขทะเบียน 7 หลัก' : 'รหัส 5 หลัก'}" data-autofocus>
            <button class="btn">ตกลง</button><button type="button" class="btn" data-cam>${ICON.camera}ใช้กล้องมือถือ</button></form>
          <div class="try noprint"><span>ทดลอง:</span>${tries.map(t => `<button type="button" data-try="${t}">${t}</button>`).join('')}</div>
          ${msgBox()}${pcard}
          ${C.basket.length ? `<div class="basket" aria-label="หนังสือที่จะยืม">${C.basket.map(bc => { const b = BY[bc]; return `<div class="item">${cover(b)}<div><div class="t" style="font-weight:500">${esc(shortTitle(b.t))}</div><div class="small muted">${esc(b.call)} เลขทะเบียน ${bc}</div></div><div class="small">คืนภายใน ${thShort(due)}</div><button type="button" class="btn ghost sm" data-rm="${bc}" aria-label="นำ ${esc(shortTitle(b.t))} ออก">นำออก</button></div>`; }).join('')}</div>` : ''}
          ${st ? `<div class="row" style="justify-content:flex-end;margin-top:18px"><button type="button" class="btn" data-cancel>ยกเลิก</button><button type="button" class="btn primary" data-save ${C.basket.length ? '' : 'disabled'}>บันทึกการยืม ${C.basket.length || ''} เล่ม</button></div>
          <p class="small muted" style="text-align:right;margin-top:6px">กด Enter ที่ช่องว่างเพื่อบันทึกได้เลย</p>` : ''}`;
        bind();
      }
      function drawReturn() {
        const tries = S.loans.slice(0, 5).map(l => l.bc).concat(['1000002']);
        panel.innerHTML = `<label class="field" for="scan"><span>สแกนบาร์โค้ดหนังสือที่คืน หรือพิมพ์เลขทะเบียน</span></label>
          <form class="scan" data-scan><input class="input" id="scan" autocomplete="off" inputmode="numeric" placeholder="เลขทะเบียน 7 หลัก" data-autofocus>
            <button class="btn">ตกลง</button><button type="button" class="btn" data-cam>${ICON.camera}ใช้กล้องมือถือ</button></form>
          <div class="try noprint"><span>ทดลอง:</span>${tries.map(t => `<button type="button" data-try="${t}">${t}</button>`).join('')}</div>
          ${msgBox()}
          ${C.returned.length ? `<h2 style="font-size:1rem;margin:20px 0 4px">คืนแล้วรอบนี้ ${C.returned.length} เล่ม</h2><div class="basket">${C.returned.map(x => { const b = BY[x.bc], s = SBY[x.sid]; return `<div class="item">${cover(b)}<div><div style="font-weight:500">${esc(shortTitle(b.t))}</div><div class="small muted">${esc(fullName(s))} ${cls(s)}</div><div class="small">วางกลับที่${esc(b.loc)}</div></div>${x.late ? `<span class="pill late">เกินกำหนด ${x.late} วัน</span>` : '<span class="pill ok">คืนตรงเวลา</span>'}${spine(b.call, 'sm')}</div>`; }).join('')}</div>` : '<p class="small muted" style="margin-top:16px">สแกนทีละเล่มได้ต่อเนื่อง ระบบบันทึกการคืนทันทีที่สแกน</p>'}`;
        bind();
      }
      const draw = () => (C.mode === 'borrow' ? drawBorrow() : drawReturn());
      function doReturn(bc) {
        const l = loanOf(bc), b = BY[bc]; const late = Math.max(0, -diffDays(l.due, TODAY));
        S.loans = S.loans.filter(x => x !== l); b.s = 'on';
        S.log.push({ type: 'return', bc, sid: l.sid, t: now(), late }); enqueue({ type: 'return', bc });
        return { bc, sid: l.sid, late };
      }
      function scan(val) {
        val = val.trim(); if (!val) { if (C.mode === 'borrow' && C.basket.length) save(); return; }
        const b = BY[val], st = SBY[val];
        if (C.mode === 'return') {
          if (!b) C.msg = { k: 'err', h: `ไม่พบเลขทะเบียน ${esc(val)} ในห้องสมุดนี้ ตรวจเลขบนบาร์โค้ดอีกครั้ง` };
          else if (!loanOf(val)) C.msg = { k: 'warn', h: `<b>${esc(shortTitle(b.t))}</b> ไม่มีรายการยืมค้าง เล่มนี้อยู่ในสถานะ "${STATUS[b.s]}" อยู่แล้ว ถ้าต้องการยืม ให้สลับไปแท็บยืม` };
          else { const r = doReturn(val); C.returned.unshift(r); C.msg = { k: 'ok', h: `<b>บันทึกการคืนแล้ว</b>&nbsp;${esc(shortTitle(b.t))} ${r.late ? `เกินกำหนด ${r.late} วัน` : 'คืนตรงเวลา'}${S.offline ? ' (เก็บไว้ในเครื่อง รอส่ง)' : ''}` }; }
          return draw();
        }
        if (!C.patron) {
          if (st) { C.patron = val; C.msg = null; }
          else if (b) C.msg = { k: 'warn', h: `${esc(val)} เป็นเลขทะเบียนหนังสือ สแกนบัตรนักเรียนก่อน แล้วจึงสแกนหนังสือ` };
          else C.msg = { k: 'err', h: `ไม่พบรหัสนักเรียน ${esc(val)} ในโรงเรียนนี้ ตรวจรหัสบนบัตรอีกครั้ง` };
          return draw();
        }
        const me = SBY[C.patron];
        if (st && !b) { if (C.basket.length) C.msg = { k: 'warn', h: `ยังไม่ได้บันทึกการยืมของ ${esc(me.first)} กดบันทึกหรือยกเลิกก่อนเปลี่ยนผู้ยืม` }; else { C.patron = val; C.msg = null; } return draw(); }
        if (!b) C.msg = { k: 'err', h: `ไม่พบเลขทะเบียน ${esc(val)} ในห้องสมุดนี้ ตรวจเลขบนบาร์โค้ดอีกครั้ง` };
        else if (C.basket.includes(val)) C.msg = { k: 'warn', h: `${esc(shortTitle(b.t))} อยู่ในรายการแล้ว` };
        else if (b.s === 'out') { const l = loanOf(val), who = SBY[l.sid]; C.msg = { k: 'warn', h: `<b>${esc(shortTitle(b.t))} ยังมีรายการยืมค้างอยู่</b> ยืมโดย ${esc(isA() ? who.first + ' ' + cls(who) : fullName(who) + ' ' + cls(who))} ถ้าหนังสืออยู่ที่เคาน์เตอร์ แปลว่ายังไม่ได้รับคืนในระบบ`, act: ['รับคืนเล่มนี้ แล้วยืมต่อ', () => { doReturn(val); scan(val); if (C.basket.includes(val)) { C.msg = { k: 'ok', h: `รับคืน ${esc(shortTitle(b.t))} แล้ว และเพิ่มในรายการยืม` }; draw(); } }] }; }
        else if (b.s !== 'on') C.msg = { k: 'err', h: b.s === 'ref' ? `${esc(shortTitle(b.t))} เป็นหนังสืออ้างอิง อ่านในห้องสมุดเท่านั้น ยืมออกไม่ได้` : `${esc(shortTitle(b.t))} มีสถานะ "${STATUS[b.s]}" แก้สถานะในหน้าทรัพยากรก่อนให้ยืม` };
        else if (S.policy.block && loansOf(me.id).some(l => diffDays(l.due, TODAY) < 0)) C.msg = { k: 'err', h: 'นักเรียนมีหนังสือเกินกำหนด ต้องคืนก่อนจึงยืมใหม่ได้ (ตั้งค่าได้ที่ ตั้งค่าโรงเรียน)' };
        else if (quota(me) <= 0) C.msg = { k: 'err', h: `ยืมได้สูงสุด ${S.policy.max} เล่ม ตอนนี้ ${esc(me.first)} ยืมอยู่ ${loansOf(me.id).length} เล่ม และอยู่ในรายการ ${C.basket.length} เล่ม` };
        else { C.basket.push(val); C.msg = null; }
        draw();
      }
      function save() {
        const me = SBY[C.patron], due = nextSchoolDay(addDays(TODAY, S.policy.days)), n = C.basket.length;
        C.basket.forEach(bc => { S.loans.push({ bc, sid: me.id, out: now(), due }); BY[bc].s = 'out'; S.log.push({ type: 'borrow', bc, sid: me.id, t: now() }); enqueue({ type: 'borrow', bc }); });
        C.msg = { k: 'ok', h: `<b>บันทึกการยืมแล้ว ${n} เล่ม</b>&nbsp;ให้ ${esc(me.first)} ${cls(me)} คืนภายใน ${thDate(due)}${S.offline ? ' (เก็บไว้ในเครื่อง รอส่ง)' : ''}` };
        C.patron = null; C.basket = []; refresh();
      }
      function bind() {
        const inp = $('#scan', panel);
        $('[data-scan]', panel).addEventListener('submit', e => { e.preventDefault(); const v = inp.value; inp.value = ''; scan(v); $('#scan', panel)?.focus(); });
        $$('[data-try]', panel).forEach(b => b.addEventListener('click', () => { scan(b.dataset.try); $('#scan', panel)?.focus(); }));
        $$('[data-rm]', panel).forEach(b => b.addEventListener('click', () => { C.basket = C.basket.filter(x => x !== b.dataset.rm); draw(); $('#scan', panel).focus(); }));
        $('[data-cancel]', panel)?.addEventListener('click', () => { C.patron = null; C.basket = []; C.msg = null; draw(); $('#scan', panel).focus(); });
        $('[data-save]', panel)?.addEventListener('click', save);
        $('[data-act]', panel)?.addEventListener('click', () => C.msg.act[1]());
        $('[data-cam]', panel).addEventListener('click', () => cameraDialog(v => { scan(v); }));
      }
      draw();
    }
  };
}
function fakeQR(seed) {
  const r = mulberry32(seed), n = 21; let s = '';
  const finder = (x, y) => x < 7 && y < 7 || x > 13 && y < 7 || x < 7 && y > 13;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on;
    if (finder(x, y)) { const fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y; on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5); }
    else on = r() < 0.48;
    if (on) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-1 -1 23 23" width="150" height="150" fill="#16302E" role="img" aria-label="คิวอาร์โค้ดสำหรับเปิดบนมือถือ">${s}</svg>`;
}
function cameraDialog(onScan) {
  openDialog(`<h2 id="dlg-h">สแกนด้วยกล้องมือถือ</h2>
    <p class="muted">ใช้เมื่อโรงเรียนไม่มีเครื่องอ่านบาร์โค้ด เปิดกล้องมือถือส่องคิวอาร์นี้ แล้วส่องบาร์โค้ดหนังสือหรือบัตร ผลจะขึ้นที่ช่องสแกนบนคอมพิวเตอร์เอง</p>
    <div class="row" style="margin-top:16px;align-items:flex-start">${fakeQR(7)}<ol class="small" style="margin:0;padding-left:18px"><li>มือถือต้องเข้าสู่ระบบบัญชีเดียวกัน</li><li>อนุญาตให้เว็บใช้กล้อง</li><li>ส่องบาร์โค้ดให้อยู่ในกรอบ</li></ol></div>
    <div class="acts"><button class="btn" data-close>ปิด</button><button class="btn primary" data-sim>จำลองการสแกน 1 ครั้ง</button></div>`, dlg => {
    $('[data-sim]', dlg).addEventListener('click', () => {
      const C = S.circ; let v;
      if (C.mode === 'return') v = S.loans[0]?.bc || '1000002';
      else if (!C.patron) v = '41208';
      else v = BOOKS.find(b => b.s === 'on' && !C.basket.includes(b.bc)).bc;
      closeDialog(); onScan(v); toast(`มือถือส่งรหัส ${v} มาแล้ว`);
    });
  });
}

/* ---------- Catalog wizard (FR-M2-01..05, NFR-01) ---------- */
const DDC_RULES = [
  [/นิยาย|นวนิยาย|เรื่องสั้น/, '895.913', 'นวนิยายและเรื่องสั้นไทย'], [/คณิต/, '510', 'คณิตศาสตร์'], [/ฟิสิกส์/, '530', 'ฟิสิกส์'], [/เคมี/, '540', 'เคมี'],
  [/ชีว/, '570', 'ชีววิทยา'], [/วิทยาศาสตร์/, '500', 'วิทยาศาสตร์ทั่วไป'], [/อังกฤษ|english|grammar|vocabulary/i, '428', 'ภาษาอังกฤษสำหรับผู้เรียน'],
  [/ภาษาไทย|หลักภาษา/, '495.91', 'ภาษาไทย'], [/ประวัติศาสตร์|อยุธยา|สุโขทัย|รัตนโกสินทร์/, '959.3', 'ประวัติศาสตร์ไทย'], [/การ์ตูน/, '741.5', 'การ์ตูน'],
  [/พุทธ|ธรรมะ|ศาสนา/, '294.3', 'พระพุทธศาสนา'], [/คอมพิวเตอร์|โปรแกรม|python|coding|โค้ด/i, '005.1', 'การเขียนโปรแกรมคอมพิวเตอร์'], [/สุขภาพ|สุขศึกษา/, '613', 'สุขภาพและอนามัย'],
  [/อาหาร|ขนม/, '641.5', 'การทำอาหาร'], [/ภูมิศาสตร์|แผนที่/, '910', 'ภูมิศาสตร์'], [/โรงเรียน|ที่ระลึก|ครบรอบ/, '373.593', 'โรงเรียนมัธยมศึกษาในประเทศไทย'],
  [/สังคม/, '300', 'สังคมศาสตร์'], [/จิตวิทยา|พัฒนาตนเอง|ความสุข|ชีวิต/, '158.1', 'จิตวิทยาประยุกต์และการพัฒนาตนเอง']
];
const EXAM_DDC = { '510': '510.76', '530': '530.076', '540': '540.76', '570': '570.76', '428': '428.0076', '495.91': '495.91076', '300': '300.76', '613': '613.076', '500': '507.6' };
function suggestDDC(text) {
  const t = norm(text); if (t.length < 2) return [];
  const exam = /ข้อสอบ|เตรียมสอบ|แนวข้อสอบ|ติวเข้ม|a-level|tgat|o-net|สอบเข้า/.test(t);
  const out = [];
  for (const [re, ddc, name] of DDC_RULES) {
    const m = t.match(re); if (!m) continue;
    const ex = exam && EXAM_DDC[ddc];
    const d = ex || ddc;
    const sim = BOOKS.filter(b => b.ddc === d);
    out.push({ ddc: d, name: name + (ex ? ' (แนวข้อสอบ)' : ''), why: `ชื่อเรื่องหรือคำสำคัญมีคำว่า “${m[0]}”${ex ? ' และเป็นหนังสือแนวข้อสอบ' : ''}${sim.length ? ` ห้องสมุดมีเล่มที่ใช้เลขนี้ ${sim.length} เล่ม เช่น “${shortTitle(sim[0].t)}”` : ''}` });
    const near = BOOKS.filter(b => norm(b.t).includes(m[0].toLowerCase()) && b.ddc !== d);
    if (near.length) {
      const tally = {}; near.forEach(b => tally[b.ddc] = (tally[b.ddc] || 0) + 1);
      const [nd, n] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      const ex2 = near.find(b => b.ddc === nd);
      out.push({ ddc: nd, name: DDC_CLASS[nd[0]].slice(4), why: `หนังสือคล้ายกันในห้องสมุด ${n} เล่มใช้เลขนี้ เช่น “${shortTitle(ex2.t)}”` });
    }
  }
  const seen = new Set(); return out.filter(o => !seen.has(o.ddc) && seen.add(o.ddc)).slice(0, 3);
}
function tCatalog() {
  const K = S.cat || (S.cat = { step: 1, rec: null, dup: null, manual: false, msg: null, t0: null, saved: null, form: {} });
  const A = isA();
  return {
    title: A ? 'ลงหนังสือใหม่ (บันทึกเป็นร่าง)' : 'ลงหนังสือใหม่',
    body: `<div class="wiz"><div class="panel" id="wiz"></div>
      <aside class="panel side-note"><h3>ลงหนังสือใหม่ใน 3 ขั้น</h3><ol><li>สแกนหรือพิมพ์เลข ISBN ที่ปกหลัง ระบบหาข้อมูลจากฐานกลางให้</li><li>ดูว่าข้อมูลตรงกับเล่มในมือ</li><li>ใส่ข้อมูลของเล่มนี้ แล้ว${A ? 'ส่งให้ครูตรวจ' : 'พิมพ์ป้าย'}</li></ol>
      <p class="small muted" style="margin-top:12px">หนังสือไม่มี ISBN ก็ลงได้ ระบบจะแนะนำเลขหมู่ให้เลือก</p>
      <p style="margin-top:10px"><a class="small" href="${base()}help#ddc">เลขหมู่คืออะไร</a></p></aside></div>`,
    mount(root) {
      const W = $('#wiz', root);
      const start = () => { if (!K.t0) K.t0 = Date.now(); };
      const stepper = () => { const n = K.step; const s = (i, t) => `<span class="${i < n ? 'done' : i === n ? 'on' : ''}"><i>${i < n ? '&#10003;' : i}</i>${t}</span>`; return `<div class="stepper">${s(1, 'หาข้อมูลหนังสือ')}${s(2, 'ตรวจข้อมูล')}${s(3, 'ข้อมูลของเล่มนี้')}</div>`; };
      const msg = () => K.msg ? `<div class="msg ${K.msg.k}" role="${K.msg.k === 'err' ? 'alert' : 'status'}"><div>${K.msg.h}</div></div>` : '';
      const reset = () => { Object.assign(K, { step: 1, rec: null, dup: null, manual: false, msg: null, t0: null, saved: null, form: {} }); draw(); $('#isbn')?.focus(); };
      function draw() {
        if (K.saved) return drawDone();
        if (K.step === 1) return draw1();
        if (K.step === 2) return K.manual ? drawManual() : draw2();
        return draw3();
      }
      function draw1() {
        const tries = [['9789744723635', 'แฮร์รี่ พอตเตอร์ ภาค 2'], ['9780761169253', 'Steal Like an Artist'], ['9786160470747', 'เล่มที่ห้องสมุดมีแล้ว'], ['9786160470748', 'เลขผิด']];
        W.innerHTML = `${stepper()}<h2>สแกนหรือพิมพ์เลข ISBN ที่ปกหลัง</h2>
          <p class="muted" style="margin:6px 0 14px">ระบบจะหาข้อมูลจากฐานข้อมูลบรรณานุกรมกลาง (union catalog) ${info('ฐานข้อมูลรายชื่อหนังสือที่โรงเรียนในเครือข่ายปันอ่านใช้ร่วมกัน ถ้าโรงเรียนอื่นลงหนังสือเล่มนี้ไว้แล้ว เราคัดลอกมาใช้ได้ทันที')} ค้นด้วยชื่อเรื่องก็ได้</p>
          <form class="scan" data-f1><label class="sr" for="isbn">เลข ISBN หรือชื่อเรื่อง</label><input class="input" id="isbn" autocomplete="off" placeholder="เช่น 9789744723635" data-autofocus><button class="btn primary">ค้นหา</button></form>
          <div class="try noprint"><span>ทดลอง:</span>${tries.map(([v, l]) => `<button type="button" data-try="${v}">${l}</button>`).join('')}</div>
          ${msg()}<div id="pick"></div>
          <p style="margin-top:18px"><button type="button" class="linkbtn" data-manual>หนังสือไม่มี ISBN หรือหาไม่พบ กรอกข้อมูลเอง</button></p>`;
        const f = $('[data-f1]', W);
        f.addEventListener('submit', e => { e.preventDefault(); lookup(f.isbn.value); });
        $$('[data-try]', W).forEach(b => b.addEventListener('click', () => { f.isbn.value = b.dataset.try; lookup(b.dataset.try); }));
        $('[data-manual]', W).addEventListener('click', () => { start(); K.manual = true; K.step = 2; K.msg = null; K.form = {}; draw(); });
        f.isbn.addEventListener('input', start);
      }
      function lookup(v) {
        start(); v = String(v).trim(); const digits = v.replace(/[-\s]/g, '');
        if (!v) { K.msg = { k: 'err', h: 'พิมพ์เลข ISBN หรือชื่อเรื่องก่อน' }; return draw(); }
        if (/^[\dXx]{10,13}$/.test(digits)) {
          if (!isbnOk(digits)) { K.msg = { k: 'err', h: `เลข ${esc(digits)} ไม่ใช่ ISBN ที่ถูกต้อง (หลักสุดท้ายไม่ตรง) ตรวจตัวเลขอีกครั้ง หรือกรอกข้อมูลเอง` }; return draw(); }
          const own = BOOKS.filter(b => b.isbn === digits), uc = UNION.find(u => u.isbn === digits);
          if (own.length) { K.rec = { ...own[0], used: 12 }; K.dup = own; }
          else if (uc) { K.rec = { ...uc }; K.dup = null; }
          else { K.msg = { k: 'warn', h: `ไม่พบ ISBN ${esc(digits)} ในฐานข้อมูลกลาง กรอกข้อมูลเองได้ ระบบจะช่วยแนะนำเลขหมู่` }; K.form = { isbn: digits }; draw(); return; }
          K.step = 2; K.msg = null; return draw();
        }
        const hits = [...UNION, ...BOOKS].filter(b => norm(b.t).includes(norm(v))).slice(0, 5);
        if (!hits.length) { K.msg = { k: 'warn', h: `ไม่พบชื่อเรื่อง “${esc(v)}” ในฐานข้อมูลกลาง ลองคำที่สั้นลง หรือกรอกข้อมูลเอง` }; return draw(); }
        K.msg = null; draw();
        $('#pick', W).innerHTML = `<p class="small muted" style="margin-top:14px">พบ ${hits.length} รายการ เลือกเล่มที่ตรงกับในมือ</p><div class="basket">${hits.map((h, i) => `<div class="item">${cover(h)}<div><div style="font-weight:500">${esc(h.t)}</div><div class="small muted">${esc(h.a)} ${esc(h.p)} ${esc(h.y)}</div></div><span></span><button class="btn sm" data-h="${i}">เลือก</button></div>`).join('')}</div>`;
        $$('[data-h]', W).forEach(b => b.addEventListener('click', () => { const h = hits[+b.dataset.h]; K.rec = { ...h, used: h.used || 9 }; K.dup = BOOKS.filter(x => x.isbn && x.isbn === h.isbn); if (!K.dup.length) K.dup = null; K.step = 2; draw(); }));
      }
      function draw2() {
        const r = K.rec;
        const kv = [['ผู้แต่ง', r.a], ['สำนักพิมพ์', r.p], ['ปีที่พิมพ์', r.y], ['จำนวนหน้า', r.pg || 'ไม่มีในระเบียนกลาง เพิ่มได้ในขั้นถัดไป'], ['ISBN', r.isbn], ['เลขหมู่', r.ddc + ' ' + (DDC_CLASS[r.ddc[0]] || '').slice(4)]].map(([k, v]) => `<dt>${k}${k === 'เลขหมู่' ? info('ตัวเลขบอกหมวดของหนังสือตามระบบทศนิยมดิวอี้ (DDC) ใช้จัดเรียงบนชั้น หนังสือเรื่องเดียวกันจะอยู่ใกล้กัน') : ''}</dt><dd>${esc(v)}</dd>`).join('');
        W.innerHTML = `${stepper()}<h2>ใช่เล่มนี้หรือไม่</h2>
          <div class="found" style="margin-top:14px">${cover(r, { eager: true })}<div><p class="small" style="color:var(--teal);font-weight:500">พบในฐานข้อมูลกลาง มีโรงเรียนใช้ระเบียนนี้ ${r.used || 1} แห่ง</p><h3 style="font-family:var(--read);font-size:1.1rem;margin:4px 0 8px">${esc(r.t)}</h3><dl class="kv">${kv}</dl></div></div>
          ${K.dup ? `<div class="msg warn" role="status"><div><b>ห้องสมุดมีเล่มนี้แล้ว ${K.dup.length} เล่ม</b> (เลขทะเบียน ${K.dup.map(d => d.bc).join(', ')} สถานะ ${STATUS[K.dup[0].s]}) ถ้าเป็นเล่มที่ได้มาเพิ่ม กด "ใช่ เล่มนี้" เพื่อเพิ่มเป็นอีกเล่ม (copy) ${info('หนังสือเรื่องเดียวกันหลายเล่มใช้ระเบียนเดียวกัน แต่ละเล่มมีเลขทะเบียนของตัวเอง')}</div></div>` : ''}
          <div class="row wrap" style="justify-content:flex-end;margin-top:18px"><button class="btn ghost" data-back>ย้อนกลับ</button><button class="btn" data-no>ไม่ใช่ กรอกข้อมูลเอง</button><button class="btn primary" data-yes data-autofocus>ใช่ เล่มนี้</button></div>`;
        $('[data-yes]', W).addEventListener('click', () => { K.step = 3; draw(); });
        $('[data-no]', W).addEventListener('click', () => { K.manual = true; K.form = { isbn: r.isbn }; draw(); });
        $('[data-back]', W).addEventListener('click', reset);
        $('[data-yes]', W).focus();
      }
      function drawManual() {
        const F = K.form;
        const types = Object.keys(TYPE_GROUP);
        W.innerHTML = `${stepper()}<h2>กรอกข้อมูลหนังสือ</h2><p class="muted" style="margin:6px 0 16px">ช่องที่มีดอกจันต้องกรอก ช่องอื่นเว้นว่างได้</p>
          <form class="grid2" data-fm>
            <label class="field full"><span>ชื่อเรื่อง *</span><input class="input" name="t" value="${esc(F.t || '')}" required data-autofocus></label>
            <label class="field"><span>ผู้แต่ง</span><input class="input" name="a" value="${esc(F.a || '')}"></label>
            <label class="field"><span>สำนักพิมพ์</span><input class="input" name="p" value="${esc(F.p || '')}"></label>
            <label class="field"><span>ปีที่พิมพ์ <em>(พ.ศ.)</em></span><input class="input" name="y" inputmode="numeric" value="${esc(F.y || '')}"></label>
            <label class="field"><span>ISBN <em>(ถ้ามี)</em></span><input class="input" name="isbn" inputmode="numeric" value="${esc(F.isbn || '')}"></label>
            <label class="field"><span>ประเภท</span><select class="input" name="type">${types.map(t => `<option ${F.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
            <label class="field"><span>ภาษา</span><select class="input" name="lang">${['ไทย', 'อังกฤษ', 'อื่น ๆ'].map(t => `<option ${F.lang === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
            <label class="field full"><span>คำสำคัญหรือหัวเรื่อง ${info('คำที่บอกว่าหนังสือเกี่ยวกับอะไร เช่น ฟิสิกส์ แนวข้อสอบ ระบบใช้คำนี้ช่วยแนะนำเลขหมู่และช่วยนักเรียนค้นหา')} <em>เช่น ฟิสิกส์ แนวข้อสอบ</em></span><input class="input" name="subj" value="${esc(F.subj || '')}"></label>
            <fieldset class="full" style="border:0;padding:0;margin:0"><legend class="ui" style="font-weight:500;font-size:.86rem;margin-bottom:6px">เลขหมู่ที่แนะนำ ${info('เลขหมู่บอกหมวดของหนังสือตามระบบทศนิยมดิวอี้ (DDC) ระบบเดาจากชื่อเรื่องและคำสำคัญ ครูเลือกเองได้เสมอ')}</legend><div class="suggest" id="sug"></div></fieldset>
          </form>${msg()}
          <div class="row" style="justify-content:flex-end;margin-top:18px"><button class="btn ghost" data-back>ย้อนกลับ</button><button class="btn primary" data-next>ถัดไป</button></div>`;
        const fm = $('[data-fm]', W), sug = $('#sug', W);
        const drawSug = () => {
          const list = suggestDDC(fm.t.value + ' ' + fm.subj.value);
          const cur = F.ddc;
          sug.innerHTML = (list.length ? list.map((s, i) => `<label><input type="radio" name="ddc" value="${s.ddc}" ${cur ? cur === s.ddc ? 'checked' : '' : i === 0 ? 'checked' : ''}><b>${s.ddc}</b><span>${esc(s.name)}<br><span class="small muted">${esc(s.why)}</span></span></label>`).join('') : `<p class="small muted">พิมพ์ชื่อเรื่องหรือคำสำคัญ ระบบจะแนะนำเลขหมู่ 2–3 ตัวเลือกพร้อมเหตุผล</p>`)
            + `<label><input type="radio" name="ddc" value="own" ${cur === 'own' ? 'checked' : ''}><b>อื่น ๆ</b><span>ใส่เลขหมู่เอง <input class="input" name="ddcOwn" value="${esc(F.ddcOwn || '')}" style="margin-top:6px;max-width:200px" inputmode="decimal" aria-label="เลขหมู่ที่ใส่เอง"></span></label>`;
        };
        drawSug();
        let tm; fm.addEventListener('input', e => { if (e.target.name === 't' || e.target.name === 'subj') { clearTimeout(tm); tm = setTimeout(() => { const keep = new FormData(fm); F.ddc = keep.get('ddc'); F.ddcOwn = keep.get('ddcOwn'); drawSug(); }, 250); } });
        $('[data-back]', W).addEventListener('click', reset);
        $('[data-next]', W).addEventListener('click', () => {
          const d = Object.fromEntries(new FormData(fm)); Object.assign(F, d);
          if (!d.t.trim()) { K.msg = { k: 'err', h: 'กรอกชื่อเรื่องก่อน' }; drawManual(); fm.t?.focus(); return; }
          let ddc = d.ddc === 'own' ? (d.ddcOwn || '').trim() : d.ddc;
          if (!ddc || !/^\d{3}(\.\d+)?$/.test(ddc)) { K.msg = { k: 'err', h: 'เลือกเลขหมู่ที่แนะนำ หรือใส่เลขหมู่เป็นตัวเลข 3 หลัก เช่น 510 หรือ 895.913' }; drawManual(); return; }
          K.rec = { isbn: d.isbn, t: d.t.trim(), a: d.a, p: d.p, y: d.y, pg: '', lang: d.lang, type: d.type, ddc, cls: DDC_CLASS[ddc[0]], subj: d.subj, lvl: 'ม.1-6', cv: '' };
          K.msg = null; K.step = 3; draw();
        });
      }
      function draw3() {
        const r = K.rec, bc = nextBarcode(), call = callNo(r.ddc, r.a, r.t), loc = locFor(r.type, r.lang);
        W.innerHTML = `${stepper()}<h2>ข้อมูลของเล่มนี้</h2>
          <div class="row" style="margin:12px 0 16px">${spine(call, 'sm')}<div><div style="font-weight:500">${esc(shortTitle(r.t))}</div><div class="small muted">${esc(r.a)}</div></div></div>
          <form class="grid2" data-f3>
            <label class="field"><span>เลขทะเบียน (บาร์โค้ด) ${info('เลขประจำตัวของหนังสือเล่มนี้ ระบบออกเลขถัดไปให้ และพิมพ์เป็นบาร์โค้ดติดหนังสือ')}</span><input class="input num" name="bc" value="${bc}" inputmode="numeric"></label>
            <label class="field"><span>เลขเรียกหนังสือ (call number) ${info('เลขหมู่ ตามด้วยอักษรผู้แต่งและอักษรชื่อเรื่อง พิมพ์บนป้ายสันหนังสือ ใช้หาหนังสือบนชั้น')}</span><input class="input" name="call" value="${esc(call)}"></label>
            <label class="field"><span>มุมจัดเก็บ</span><select class="input" name="loc">${LOCS.map(l => `<option ${l === loc ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            <label class="field"><span>ได้มาโดย</span><select class="input" name="from"><option>ซื้อ</option><option>บริจาค</option><option>ได้รับจัดสรร</option></select></label>
            ${r.pg ? '' : '<label class="field"><span>จำนวนหน้า <em>(ถ้าทราบ)</em></span><input class="input" name="pg" inputmode="numeric"></label>'}
            <label class="field"><span>ราคา <em>(บาท ถ้าทราบ)</em></span><input class="input" name="price" inputmode="decimal"></label>
            <label class="field full"><span>หมายเหตุ <em>(ถ้ามี)</em></span><input class="input" name="note" placeholder="เช่น ผู้บริจาค หรือสภาพหนังสือ"></label>
          </form>${msg()}
          <div class="row wrap" style="justify-content:flex-end;margin-top:18px"><button class="btn ghost" data-back>ย้อนกลับ</button>
          ${A ? '<button class="btn primary" data-draft>ส่งร่างให้ครูตรวจ</button>' : '<button class="btn" data-next>บันทึกและลงเล่มต่อไป</button><button class="btn primary" data-print>บันทึกและพิมพ์ป้าย</button>'}</div>`;
        const f3 = $('[data-f3]', W);
        $('[data-back]', W).addEventListener('click', () => { K.step = 2; draw(); });
        const collect = () => { const d = Object.fromEntries(new FormData(f3)); if (BY[d.bc]) { K.msg = { k: 'err', h: `เลขทะเบียน ${esc(d.bc)} มีอยู่แล้ว ใช้เลข ${nextBarcode()} แทน` }; draw3(); return null; } return d; };
        const save = after => {
          const d = collect(); if (!d) return;
          const b = bookFromRecord(r, d); S.labelQueue.push(b.bc);
          S.audit.unshift({ t: now(), who: ME().name, what: `ลงรายการ "${shortTitle(b.t)}" เลขทะเบียน ${b.bc}` });
          const sec = Math.round((Date.now() - (K.t0 || Date.now())) / 1000);
          if (after === 'next') { toast(`บันทึกแล้ว ${shortTitle(b.t)} เลขทะเบียน ${b.bc} ลงเล่มต่อไปได้เลย`); reset(); return; }
          K.saved = { bc: b.bc, sec }; draw();
        };
        $('[data-next]', W)?.addEventListener('click', () => save('next'));
        $('[data-print]', W)?.addEventListener('click', () => save('print'));
        $('[data-draft]', W)?.addEventListener('click', () => {
          const d = Object.fromEntries(new FormData(f3));
          S.drafts.push({ ...r, id: 'd' + Date.now(), by: '43105', at: now(), call: d.call, loc: d.loc, from: d.from, donor: d.note, pg: d.pg || r.pg });
          K.saved = { draft: true, t: r.t }; draw();
        });
      }
      function drawDone() {
        const s = K.saved;
        if (s.draft) {
          W.innerHTML = `<div class="msg ok saved" role="status"><div><b>ส่งร่างให้ครูตรวจแล้ว</b>&nbsp;${esc(shortTitle(s.t))} ครูจะเห็นในหน้า "วันนี้"</div></div><p style="margin-top:18px"><button class="btn primary" data-again data-autofocus>ลงเล่มต่อไป</button></p>`;
        } else {
          const b = BY[s.bc];
          W.innerHTML = `<div class="msg ok saved" role="status"><div><b>บันทึกแล้ว</b>&nbsp;${esc(shortTitle(b.t))} เลขทะเบียน ${b.bc}${s.sec > 5 ? ` ใช้เวลา ${Math.floor(s.sec / 60)} นาที ${s.sec % 60} วินาที` : ''}</div></div>
            <div class="lbl-cell" style="max-width:360px;margin-top:18px;border-style:solid">${spine(b.call, 'sm')}<div>${barcode(b.bc)}<div class="bc">${b.bc}</div><div class="bt">${esc(shortTitle(b.t))}</div></div></div>
            <p class="small muted" style="margin-top:10px">ป้ายรอพิมพ์ ${S.labelQueue.length} ดวง พิมพ์ทีเดียวทั้งแผ่นได้ เพื่อประหยัดกระดาษสติกเกอร์</p>
            <div class="row wrap" style="margin-top:16px"><a class="btn primary" href="#/t/labels?mode=queue">พิมพ์ป้าย</a><button class="btn" data-again>ลงเล่มต่อไป</button><a class="btn ghost" href="#/s/book/${b.bc}">ดูหน้าที่นักเรียนเห็น</a></div>`;
        }
        $('[data-again]', W).addEventListener('click', reset);
      }
      draw();
    }
  };
}

/* ---------- Labels (FR-M2-04) ---------- */
function tLabels(q) {
  const mode = q.mode || (S.labelQueue.length ? 'queue' : 'range');
  const from = q.from || '1000001', to = q.to || '1000024', start = Math.min(24, Math.max(1, +(q.start || 1)));
  const list = (mode === 'queue' ? S.labelQueue.map(bc => BY[bc]) : BOOKS.filter(b => +b.bc >= +from && +b.bc <= +to).sort((a, b) => a.bc - b.bc)).filter(Boolean);
  const cells = Array(start - 1).fill(null).concat(list);
  const sheets = []; for (let i = 0; i < Math.max(1, cells.length); i += 24) sheets.push(cells.slice(i, i + 24));
  const cell = b => b ? `<div class="lbl-cell">${spine(b.call, 'sm')}<div>${barcode(b.bc)}<div class="bc">${b.bc}</div><div class="bt">${esc(shortTitle(b.t))}</div></div></div>` : `<div class="lbl-cell empty" aria-hidden="true"></div>`;
  return {
    title: 'พิมพ์ป้าย',
    actions: `<button class="btn primary noprint" data-printnow ${list.length ? '' : 'disabled'}>${ICON.print}สั่งพิมพ์ ${list.length} ดวง</button>`,
    body: `<form class="panel noprint" data-lf style="margin-bottom:18px">
      <div class="frow" style="margin:0">
        <fieldset style="border:0;padding:0;margin:0"><legend class="sr">เลือกหนังสือที่จะพิมพ์</legend><div class="seg">
          <button type="button" data-m="queue" aria-pressed="${mode === 'queue'}">ลงใหม่ รอพิมพ์ (${S.labelQueue.length})</button>
          <button type="button" data-m="range" aria-pressed="${mode === 'range'}">ตามช่วงเลขทะเบียน</button></div></fieldset>
        ${mode === 'range' ? `<label class="field"><span>ตั้งแต่เลข</span><input class="input num" name="from" value="${esc(from)}" inputmode="numeric"></label><label class="field"><span>ถึงเลข</span><input class="input num" name="to" value="${esc(to)}" inputmode="numeric"></label>` : ''}
        <label class="field"><span>เริ่มพิมพ์ที่ดวงที่ ${info('ใช้แผ่นสติกเกอร์ที่เหลือจากครั้งก่อนได้ เช่น แผ่นนี้ใช้ไปแล้ว 5 ดวง ให้เริ่มที่ดวงที่ 6')}</span><select class="input" name="start">${Array.from({ length: 24 }, (_, i) => `<option ${i + 1 === start ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></label>
        <p class="small muted" style="align-self:center">กระดาษสติกเกอร์ A4 แบบ 3 × 8 ดวง</p>
      </div>
      ${mode === 'queue' && !list.length ? '<p class="muted" style="margin-top:12px">ไม่มีป้ายรอพิมพ์ ลงหนังสือใหม่ หรือเลือกตามช่วงเลขทะเบียน</p>' : ''}
    </form>
    ${list.length ? sheets.map((s, i) => `<p class="small muted noprint" style="margin:${i ? 18 : 0}px 0 8px">แผ่นที่ ${i + 1}</p><div class="sheet">${s.concat(Array(24 - s.length).fill(null)).map(cell).join('')}</div>`).join('') : ''}
    ${mode === 'queue' && list.length ? '<p class="noprint" style="margin-top:14px"><button class="btn" data-clearq>พิมพ์เรียบร้อยแล้ว ล้างคิว</button></p>' : ''}`,
    mount(root) {
      const f = $('[data-lf]', root);
      const upd = o => { const cur = { mode, from, to, start, ...o }; if (cur.mode === 'queue') { delete cur.from; delete cur.to; } history.replaceState(null, '', '#/t/labels?' + new URLSearchParams(cur)); refresh(); };
      $$('[data-m]', root).forEach(b => b.addEventListener('click', () => upd({ mode: b.dataset.m })));
      f.addEventListener('change', () => { const d = Object.fromEntries(new FormData(f)); upd(d); });
      $('[data-printnow]', root)?.addEventListener('click', () => window.print());
      $('[data-clearq]', root)?.addEventListener('click', () => { S.labelQueue = []; toast('ล้างคิวพิมพ์ป้ายแล้ว'); upd({ mode: 'range' }); });
    }
  };
}
