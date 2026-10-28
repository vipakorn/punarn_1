/* ================= Kiosk at the entrance (FR-M5-01, M5-02, M5-06) ================= */
function viewKiosk() {
  S.kioskOpened = true;
  let code = '', over = null, overT = null, msgT = null;
  const html = `<div class="kiosk">
    <section class="k-left" aria-label="ข้อมูลวันนี้">
      ${schoolMark('ห้องสมุด')}
      <div class="k-time num" id="k-time" aria-hidden="true">${hhmm(now())}</div>
      <div class="k-date">${thDay(TODAY)}</div>
      <div class="k-count" aria-live="polite">วันนี้มาห้องสมุดแล้ว <b class="num" id="k-n">${todayVisits().length}</b> คน</div>
    </section>
    <section class="k-right">
      ${offlineBar()}
      <h1 tabindex="-1">บันทึกการเข้าห้องสมุด</h1>
      <p class="hint">สแกนบัตรนักเรียน หรือพิมพ์รหัสประจำตัว 5 หลัก แล้วกดตกลง</p>
      <div class="k-display empty" id="k-disp" role="status" aria-live="polite">รหัสประจำตัว</div>
      <div id="k-msg" aria-live="assertive"></div>
      <div class="k-pad" role="group" aria-label="แป้นตัวเลข">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}
        <button type="button" class="del" data-k="del" aria-label="ลบตัวเลข">ลบ</button>
        <button type="button" data-k="0">0</button>
        <button type="button" class="go" data-k="go">ตกลง</button>
      </div>
      <div class="try noprint"><span>ทดลอง:</span>
        <button type="button" data-try="41208">41208 มาครั้งแรกวันนี้</button>
        <button type="button" data-try="40115">40115 สแกนไปแล้ว 10:31</button>
        <button type="button" data-try="12345">12345 ไม่มีในโรงเรียน</button>
      </div>
      <button type="button" class="k-exit" id="k-exit">ออกจากโหมด kiosk (ครูกดค้าง 1 วินาที)</button>
    </section>
  </div>`;
  function show() {
    const d = $('#k-disp'); if (!d) return;
    d.classList.toggle('empty', !code);
    d.textContent = code ? code.split('').join(' ') : 'รหัสประจำตัว';
    d.setAttribute('aria-label', code ? 'รหัส ' + code : 'ยังไม่ได้พิมพ์รหัส');
  }
  function msg(t) { const m = $('#k-msg'); m.innerHTML = t ? `<div class="msg err" role="alert" style="font-size:1rem;margin:-4px 0 14px">${t}</div>` : ''; clearTimeout(msgT); if (t) msgT = later(() => msg(''), 5000); }
  function closeOver() { if (over) { over.remove(); over = null; clearTimeout(overT); } }
  function card(html, warn) {
    closeOver();
    over = document.createElement('div'); over.className = 'k-over'; over.setAttribute('role', 'alert');
    over.innerHTML = `<div class="k-card${warn ? ' warn' : ''}">${html}<div class="k-ring"><i></i></div></div>`;
    over.addEventListener('click', closeOver);
    app.appendChild(over); overT = later(closeOver, 3000);
  }
  function submit() {
    if (!code) return msg('พิมพ์รหัสประจำตัว 5 หลักก่อน แล้วกดตกลง');
    const id = code; code = ''; show();
    const st = SBY[id];
    if (!st) return msg(`ไม่พบรหัส ${esc(id)} ในโรงเรียนนี้ ตรวจรหัสบนบัตรอีกครั้ง หรือแจ้งครูที่เคาน์เตอร์`);
    const t = now();
    const prev = [...S.visits].reverse().find(v => v.sid === id && (t - v.t) < 30 * 60e3);
    if (prev) {
      return card(`<span class="badge" aria-hidden="true">!</span><h2>${esc(st.nick)} บันทึกไว้แล้ว</h2><p class="cls">${cls(st)} บันทึกเมื่อ ${hhmm(prev.t)} น. ครั้งนี้ไม่นับซ้ำ เข้าห้องสมุดได้เลย</p>`, true);
    }
    S.visits.push({ sid: id, t, src: 'kiosk' }); enqueue({ type: 'visit', sid: id });
    const month = st.mv + S.visits.filter(v => v.sid === id).length;
    $('#k-n').textContent = todayVisits().length;
    if (S.offline) { const ob = $('.offline-bar'); ob && (ob.textContent = `ออฟไลน์ บันทึกไว้ในเครื่อง ${S.queue.length} รายการ ระบบจะส่งเองเมื่อกลับมาเชื่อมต่อ`); }
    card(`<span class="badge" aria-hidden="true">${esc(firstCons(st.nick))}</span><h2>สวัสดี ${esc(st.nick)}</h2><p class="cls">${cls(st)}</p><p class="visits">เดือนนี้มาห้องสมุดแล้ว <b class="num">${month}</b> ครั้ง</p>`);
  }
  function key(k) {
    if (over) { closeOver(); if (k !== 'go') { /* let the next scan start immediately */ } else return; }
    if (k === 'del') code = code.slice(0, -1);
    else if (k === 'go') return submit();
    else if (code.length < 5) code += k;
    msg(''); show();
  }
  return {
    title: 'Kiosk', html,
    mount(root) {
      every(() => { const el = $('#k-time'); el && (el.textContent = hhmm(now())); }, 5000);
      $$('[data-k]', root).forEach(b => b.addEventListener('click', () => key(b.dataset.k)));
      $$('[data-try]', root).forEach(b => b.addEventListener('click', () => { code = b.dataset.try; show(); later(submit, 250); }));
      KEY = e => {
        if (e.target.closest && e.target.closest('input,textarea')) return;
        if (/^\d$/.test(e.key)) { key(e.key); e.preventDefault(); }
        else if (e.key === 'Backspace') { key('del'); e.preventDefault(); }
        else if (e.key === 'Enter' && !e.target.closest('button')) { key('go'); e.preventDefault(); }
      };
      const ex = $('#k-exit', root); let hold;
      const askPin = () => openDialog(`<h2 id="dlg-h">ออกจากโหมด kiosk</h2><p class="muted">ใส่ PIN ของครูผู้รับผิดชอบห้องสมุด (ทดลอง: 1234)</p>
        <form data-pin style="margin-top:14px"><label class="field"><span>PIN</span><input class="input" name="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" data-autofocus></label><div id="pin-msg" aria-live="assertive"></div>
        <div class="acts"><button type="button" class="btn" data-close>กลับไปหน้า kiosk</button><button class="btn primary">ออกจากโหมด kiosk</button></div></form>`, d => {
        $('[data-pin]', d).addEventListener('submit', e => { e.preventDefault(); if (e.target.pin.value === S.pin) { closeDialog(); go(S.role === 'assistant' ? '#/a/circ' : '#/t/today'); } else { $('#pin-msg').innerHTML = '<div class="msg err" role="alert">PIN ไม่ถูกต้อง ลองอีกครั้ง</div>'; e.target.pin.select(); } });
      });
      ex.addEventListener('pointerdown', () => { hold = setTimeout(askPin, 1000); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => ex.addEventListener(t, () => clearTimeout(hold)));
      ex.addEventListener('click', e => { if (e.detail === 0) askPin(); });
    }
  };
}
