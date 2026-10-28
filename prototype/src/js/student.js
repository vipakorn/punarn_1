/* ================= Student (mobile first) ================= */
const EXAMS = ['TGAT', 'TPAT', 'A-Level', 'O-NET', 'สอบเข้า ม.4', 'สอบเข้ามหาวิทยาลัย', 'สอวน.', 'IELTS/TOEFL/SAT'];
const EXAM_NOTE = { 'TGAT': 'ความถนัดทั่วไป', 'TPAT': 'ความถนัดวิชาชีพ', 'A-Level': 'วิชาการ ม.6', 'O-NET': 'ม.3 และ ม.6', 'สอบเข้า ม.4': 'สำหรับ ม.3', 'สอบเข้ามหาวิทยาลัย': 'รวมหลายสนาม', 'สอวน.': 'โอลิมปิกวิชาการ', 'IELTS/TOEFL/SAT': 'สอบภาษาต่างประเทศ' };
const examBooks = e => BOOKS.filter(b => visible(b) && b.exam.includes(e));

function tile(b) {
  return `<a class="tile" href="#/s/book/${b.bc}"><div class="shelfline">${cover(b)}<div class="rail"></div></div><div class="t">${esc(shortTitle(b.t))}</div><div class="a">${esc(String(b.a).split(',')[0])}</div></a>`;
}
const shelf = (list, label) => `<div class="shelf" role="list" aria-label="${esc(label)}">${list.map(b => tile(b).replace('<a ', '<a role="listitem" ')).join('')}</div>`;
function sec(h, list, more) {
  if (!list.length) return '';
  return `<section class="sec"><div class="sec-h"><h2>${h}</h2>${more ? `<a href="${more}">ดูทั้งหมด</a>` : ''}</div>${shelf(list, h)}</section>`;
}
function resultRow(b) {
  return `<a class="result" href="#/s/book/${b.bc}">${cover(b)}<div><h3>${esc(b.t)}</h3><div class="meta">${esc(b.a)} พ.ศ. ${b.ybe}</div>${statusPill(b, true)}</div>${spine(b.call, 'sm')}</a>`;
}
function sNav(tab) {
  const it = (k, href, ico, label) => `<a href="${href}" ${tab === k ? 'aria-current="page"' : ''}>${ico}<span>${label}</span></a>`;
  return `<nav class="s-nav" aria-label="เมนูหลัก">${it('home', '#/s', ICON.home, 'หน้าแรก')}${it('search', '#/s/search', ICON.search, 'ค้นหา')}${it('exam', '#/s/exam', ICON.exam, 'เตรียมสอบ')}${it('me', '#/s/me', ICON.me, 'ของฉัน')}</nav>`;
}
const sWrap = (inner, tab) => `<div class="s-wrap">${offlineBar()}<main>${inner}</main>${sNav(tab)}</div>`;
const sHead = (title, backTo) => `<div class="s-head"><a class="back" href="${backTo || '#/s'}" aria-label="ย้อนกลับ" onclick="if(history.length>1){history.back();return false}">${ICON.back}</a><h1 tabindex="-1" style="font-size:1.15rem">${title}</h1></div>`;

function viewStudent(p, q) {
  const page = p[0] || 'home';
  if (page === 'search') return sSearch(q);
  if (page === 'book') return sBook(p[1]);
  if (page === 'exam') return sExam(q);
  if (page === 'me') return sMe();
  return sHome();
}

function sHome() {
  const vis = BOOKS.filter(visible);
  const fresh = [...vis].filter(b => b.g !== 'ref').sort((a, b) => b.yce - a.yce || (+b.bc) - (+a.bc)).slice(0, 14);
  const hot = [...vis].filter(b => b.g !== 'ref').sort((a, b) => b.pop - a.pop).slice(0, 12);
  const junior = vis.filter(b => ['lit', 'nf', 'comic'].includes(b.g) && lvlRange(b.lvl)[1] <= 3).sort((a, b) => b.pop - a.pop).slice(0, 12);
  const senior = vis.filter(b => ['lit', 'nf'].includes(b.g) && lvlRange(b.lvl)[0] >= 4 && b.lang === 'ไทย').sort((a, b) => b.pop - a.pop).slice(0, 12);
  const thai = vis.filter(b => b.type === 'วรรณกรรมไทย' || b.type === 'วรรณคดีไทย').slice(0, 12);
  const eng = vis.filter(b => b.type === 'วรรณกรรมภาษาอังกฤษ').sort((a, b) => b.pop - a.pop).slice(0, 12);
  const chips = [['A-Level', '#/s/exam?e=A-Level'], ['นิยาย', '#/s/search?type=lit'], ['ฟิสิกส์', '#/s/search?q=ฟิสิกส์'], ['Harry Potter', '#/s/search?q=แฮร์รี่'], ['ประวัติศาสตร์', '#/s/search?q=ประวัติศาสตร์'], ['การ์ตูนความรู้', '#/s/search?type=comic']];
  const ex = EXAMS.slice(0, 6).map(e => `<a class="exam" href="#/s/exam?e=${encodeURIComponent(e)}">${esc(e)}<small>${examBooks(e).length} เล่ม</small></a>`).join('');
  return {
    title: 'ห้องสมุด', html: sWrap(`
    <header class="s-top">${schoolMark()}</header>
    <section class="s-hero">
      <h1 tabindex="-1">วันนี้อยากอ่านเล่มไหน</h1>
      <p>หนังสือ ${vis.length} เล่ม ค้นได้เลยโดยไม่ต้องเข้าสู่ระบบ</p>
      <form class="search" role="search" data-search>
        <label class="sr" for="hq">ค้นหาหนังสือ</label>
        <input id="hq" name="q" type="search" placeholder="ชื่อหนังสือ ผู้แต่ง หรือวิชา" autocomplete="off" enterkeyhint="search">
        <button aria-label="ค้นหา">${ICON.search}</button>
      </form>
      <div class="chips">${chips.map(([l, h]) => `<a class="chip" href="${h}">${esc(l)}</a>`).join('')}</div>
      <h2 class="hero-shelf-h">มาใหม่ในห้องสมุด</h2>
      ${shelf(fresh, 'มาใหม่ในห้องสมุด')}
    </section>
    ${sec('ยืมกันมากเดือนนี้', hot)}
    <section class="sec"><div class="sec-h"><h2>มุมเตรียมสอบ</h2><a href="#/s/exam">ทุกสนามสอบ</a></div><div class="exam-grid">${ex}</div></section>
    ${sec('เหมาะกับ ม.ต้น', junior, '#/s/search?lv=low')}
    ${sec('เหมาะกับ ม.ปลาย', senior, '#/s/search?lv=high')}
    ${sec('วรรณกรรมและวรรณคดีไทย', thai, '#/s/search?type=lit&lang=th')}
    ${sec('อ่านภาษาอังกฤษ', eng, '#/s/search?type=lit&lang=en')}
    <p class="small muted" style="padding:20px 16px 8px">ห้องสมุดเปิด 07:00–16:30 น. วันจันทร์ถึงศุกร์</p>`, 'home'),
    mount(root) { $('[data-search]', root).addEventListener('submit', e => { e.preventDefault(); const v = e.target.q.value.trim(); go('#/s/search' + (v ? '?q=' + encodeURIComponent(v) : '')); }); }
  };
}

/* ---------- search (FR-M4-01, M4-05) ---------- */
function searchBooks(q) {
  const tk = norm(q).split(/\s+/).filter(Boolean);
  return BOOKS.filter(b => visible(b) && tk.every(t => b._idx.includes(t)));
}
function filterBooks(q) {
  let list = searchBooks(q.q || '');
  if (q.type) list = list.filter(b => b.g === q.type);
  if (q.cls) list = list.filter(b => b.cls.startsWith(q.cls));
  if (q.yr === 'new') list = list.filter(b => b.yce >= 2023);
  if (q.yr === 'mid') list = list.filter(b => b.yce >= 2013 && b.yce < 2023);
  if (q.yr === 'old') list = list.filter(b => b.yce < 2013);
  if (q.st === 'on') list = list.filter(b => b.s === 'on');
  if (q.lang === 'th') list = list.filter(b => b.lang === 'ไทย');
  if (q.lang === 'en') list = list.filter(b => b.lang === 'อังกฤษ');
  if (q.lv === 'low') list = list.filter(b => lvlRange(b.lvl)[1] <= 3);
  if (q.lv === 'high') list = list.filter(b => lvlRange(b.lvl)[0] >= 4);
  if (q.q) list.sort((a, b) => (norm(b.t).includes(norm(q.q)) - norm(a.t).includes(norm(q.q))));
  return list;
}
function sSearch(q) {
  const sel = (name, label, opts) => `<label class="sr" for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${opts.map(([v, t]) => `<option value="${v}" ${(q[name] || '') === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  const filters = sel('type', 'ประเภท', [['', 'ทุกประเภท'], ...Object.entries(TYPE_LABEL)])
    + sel('cls', 'หมวด', [['', 'ทุกหมวด'], ...Object.values(DDC_CLASS).map(c => [c.slice(0, 3), 'หมวด ' + c])])
    + sel('yr', 'ปีที่พิมพ์', [['', 'ทุกปีที่พิมพ์'], ['new', 'พ.ศ. 2566 ขึ้นไป'], ['mid', 'พ.ศ. 2556–2565'], ['old', 'ก่อน พ.ศ. 2556']])
    + sel('st', 'สถานะ', [['', 'ทุกสถานะ'], ['on', 'อยู่บนชั้น ยืมได้']]);
  const keep = ['lang', 'lv'].filter(k => q[k]).map(k => `<input type="hidden" name="${k}" value="${esc(q[k])}">`).join('');
  return {
    title: 'ค้นหา', html: sWrap(`
    <div class="s-head"><h1 class="sr" tabindex="-1">ค้นหาหนังสือ</h1>
      <form class="search grow" role="search" style="margin:0" data-sform>
        <label class="sr" for="sq">ค้นหาหนังสือ</label>
        <input id="sq" name="q" type="search" value="${esc(q.q || '')}" placeholder="ชื่อหนังสือ ผู้แต่ง หรือวิชา" autocomplete="off" enterkeyhint="search" style="border:1px solid var(--line)" ${q.q || q.type || q.lang || q.lv ? '' : 'data-autofocus'}>
        <button aria-label="ค้นหา">${ICON.search}</button>
      </form></div>
    <form class="filters" data-filters aria-label="กรองผลการค้นหา">${filters}${keep}</form>
    <div id="res" aria-live="polite"></div>`, 'search'),
    mount(root) {
      const res = $('#res', root), form = $('[data-sform]', root), ff = $('[data-filters]', root);
      const read = () => { const o = { q: form.q.value.trim() }; new FormData(ff).forEach((v, k) => { if (v) o[k] = v; }); return o; };
      const draw = () => {
        const o = read(); const list = filterBooks(o);
        const qs = new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();
        history.replaceState(null, '', '#/s/search' + (qs ? '?' + qs : ''));
        const anyFilter = Object.keys(o).some(k => k !== 'q' && o[k]);
        res.innerHTML = list.length
          ? `<p class="small muted" style="padding:0 16px 6px">พบ ${list.length} เล่ม${o.q ? ` สำหรับ “${esc(o.q)}”` : ''}</p>${list.slice(0, 60).map(resultRow).join('')}${list.length > 60 ? `<p class="small muted" style="padding:14px 16px">แสดง 60 เล่มแรก พิมพ์คำค้นเพิ่มเพื่อให้แคบลง</p>` : ''}`
          : `<div class="empty"><h2>ไม่พบหนังสือที่ตรงกับ “${esc(o.q)}”</h2><p>ลองใช้คำที่สั้นลง ค้นด้วยชื่อผู้แต่ง หรือ${anyFilter ? 'ล้างตัวกรองด้านบน' : 'เลือกจากหัวข้อด้านล่าง'}</p>
             <div class="subjects" style="margin-top:14px">${['นิยาย', 'คณิตศาสตร์', 'ภาษาอังกฤษ', 'ประวัติศาสตร์', 'วิทยาศาสตร์'].map(t => `<a class="chip" href="#/s/search?q=${encodeURIComponent(t)}">${t}</a>`).join('')}</div></div>`;
      };
      form.addEventListener('submit', e => { e.preventDefault(); form.q.blur(); draw(); });
      form.q.addEventListener('input', () => { clearTimeout(form._t); form._t = setTimeout(draw, 160); });
      ff.addEventListener('change', draw);
      draw();
    }
  };
}

/* ---------- book detail (FR-M4-02, US-04) ---------- */
function sBook(bc) {
  const b = BY[bc];
  if (!b) return { html: sWrap(`${sHead('ไม่พบหนังสือ')}<div class="empty"><h2>ไม่พบหนังสือเลขทะเบียน ${esc(bc)}</h2><p>หนังสืออาจถูกจำหน่ายออกแล้ว ลองค้นหาจากชื่อเรื่อง</p><p style="margin-top:14px"><a class="btn primary" href="#/s/search">ไปหน้าค้นหา</a></p></div>`, 'search') };
  const l = loanOf(bc);
  const [corner, floor] = String(b.loc).replace(')', '').split(' (');
  const related = BOOKS.filter(x => x !== b && visible(x) && (x.sub && x.sub === b.sub || x.ddc.slice(0, 3) === b.ddc.slice(0, 3))).sort((a, c) => c.pop - a.pop).slice(0, 10);
  let state;
  if (b.s === 'on') state = `<p class="small" style="margin-top:6px">ยืมได้ ${S.policy.days} วัน ไปหยิบที่ชั้นแล้วนำมาที่เคาน์เตอร์</p>`;
  else if (b.s === 'out' && l) { const d = diffDays(l.due, TODAY); state = `<p class="small" style="margin-top:6px">${d < 0 ? 'ผู้ยืมยังไม่ได้นำมาคืน' : `กำหนดคืน ${thDate(l.due)}`}</p>`; }
  else if (b.s === 'ref') state = `<p class="small" style="margin-top:6px">หนังสืออ้างอิง อ่านได้ในห้องสมุด ยืมออกไม่ได้</p>`;
  else state = '';
  const kv = [['ผู้แต่ง', b.a], ['สำนักพิมพ์', b.p], ['ปีที่พิมพ์', b.lang === 'อังกฤษ' ? `พ.ศ. ${b.ybe} (ค.ศ. ${b.yce})` : `พ.ศ. ${b.ybe}`], ['ฉบับพิมพ์', b.ed], ['จำนวนหน้า', b.pg ? b.pg + ' หน้า' : ''], ['ภาษา', b.lang], ['เหมาะกับ', b.lvl], ['ISBN', b.isbn], ['เลขทะเบียน', b.bc]]
    .filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
  const subj = String(b.subj || '').split(';').map(s => s.trim()).filter(Boolean);
  return {
    title: shortTitle(b.t), html: sWrap(`
    ${sHead('รายละเอียดหนังสือ', '#/s/search')}
    <div class="book-top">${cover(b, { big: true, eager: true })}<div>
      <h1 tabindex="-1">${esc(b.t)}</h1><p class="small muted" style="margin-top:4px">${esc(b.a)}</p>
      <div style="margin-top:10px">${statusPill(b, true)}</div>${state}
    </div></div>
    <section class="where" aria-labelledby="where-h">${spine(b.call, 'xl')}<div><h2 id="where-h">อยู่ที่${esc(corner)}</h2><p>${esc(floor || '')} มองหาป้ายนี้ที่สันหนังสือ เล่มบนชั้นเรียงตามตัวเลขจากน้อยไปมาก</p></div></section>
    <section class="sec" style="padding-top:6px"><dl class="kv">${kv}</dl></section>
    ${subj.length ? `<section class="sec"><h2 style="font-size:1rem;margin-bottom:10px">หัวเรื่อง</h2><div class="subjects">${subj.map(s => `<a class="chip" href="#/s/search?q=${encodeURIComponent(s.split(' -- ')[0])}">${esc(s)}</a>`).join('')}</div></section>` : ''}
    ${sec('เล่มอื่นในหมวดเดียวกัน', related)}`, 'search')
  };
}

/* ---------- exam corner ---------- */
function sExam(q) {
  const e = q.e && EXAMS.includes(q.e) ? q.e : '';
  const grid = EXAMS.map(x => `<a class="exam${x === e ? ' on' : ''}" href="#/s/exam?e=${encodeURIComponent(x)}" ${x === e ? 'aria-current="true"' : ''}><span>${esc(x)}<br><small style="font-weight:400">${EXAM_NOTE[x]}</small></span><small>${examBooks(x).length} เล่ม</small></a>`).join('');
  let body = '';
  if (e) {
    const list = examBooks(e);
    const subs = [...new Set(list.map(b => b.sub).filter(Boolean))];
    const s = q.sub && subs.includes(q.sub) ? q.sub : '';
    const shown = s ? list.filter(b => b.sub === s) : list;
    body = `<section class="sec"><div class="sec-h"><h2>${esc(e)} มี ${list.length} เล่ม</h2></div>
      ${subs.length > 1 ? `<div class="subjects" role="group" aria-label="กรองตามวิชา"><a class="chip${s ? '' : ' on'}" href="#/s/exam?e=${encodeURIComponent(e)}">ทุกวิชา</a>${subs.map(x => `<a class="chip${x === s ? ' on' : ''}" href="#/s/exam?e=${encodeURIComponent(e)}&sub=${encodeURIComponent(x)}">${esc(x)} <span class="n">${list.filter(b => b.sub === x).length}</span></a>`).join('')}</div>` : ''}
    </section><div style="margin-top:6px">${shown.map(resultRow).join('')}</div>`;
  }
  const g = +(q.g || 0);
  const texts = BOOKS.filter(b => visible(b) && b.g === 'text' && (!g || fitsGrade(b, g)));
  return {
    title: 'มุมเตรียมสอบ', html: sWrap(`
    <div class="s-head" style="padding:16px 16px 4px"><h1 tabindex="-1">มุมเตรียมสอบ</h1></div>
    <p class="small muted" style="padding:0 16px">เลือกสนามสอบ แล้วกรองตามวิชาที่ต้องการ</p>
    <section class="sec" style="padding-top:14px"><div class="exam-grid">${grid}</div></section>
    ${body}
    <section class="sec"><div class="sec-h"><h2>หนังสือเรียนและคู่มือตามชั้น</h2></div>
      <div class="seg" role="group" aria-label="เลือกชั้น">${[0, 1, 2, 3, 4, 5, 6].map(x => `<button type="button" data-g="${x}" aria-pressed="${g === x}">${x ? 'ม.' + x : 'ทุกชั้น'}</button>`).join('')}</div>
    </section>
    <div>${texts.map(resultRow).join('') || '<div class="empty"><p>ยังไม่มีหนังสือเรียนของชั้นนี้</p></div>'}</div>`, 'exam'),
    mount(root) { $$('[data-g]', root).forEach(b => b.addEventListener('click', () => { const o = { ...q, g: b.dataset.g }; if (o.g === '0') delete o.g; history.replaceState(null, '', '#/s/exam?' + new URLSearchParams(o)); refresh(); })); }
  };
}

/* ---------- my account (FR-M1-03, FR-M3-05, US-05) ---------- */
function sMe() {
  const st = S.student && SBY[S.student];
  if (!st) {
    return {
      title: 'ของฉัน', html: sWrap(`
      <div class="s-head" style="padding:16px 16px 4px"><h1 tabindex="-1">ของฉัน</h1></div>
      <form class="sec stack" data-login style="padding-top:8px" novalidate>
        <p class="muted small">เข้าสู่ระบบเพื่อดูหนังสือที่ยืมอยู่และวันที่ต้องคืน</p>
        <label class="field"><span>รหัสประจำตัวนักเรียน</span><input class="input" id="lid" name="id" inputmode="numeric" autocomplete="username" maxlength="5" data-autofocus></label>
        <label class="field"><span>รหัสผ่าน</span><input class="input" id="lpw" name="pw" type="password" autocomplete="current-password"></label>
        <div id="lmsg" aria-live="polite"></div>
        <button class="btn primary" style="width:100%">เข้าสู่ระบบ</button>
        <p class="small muted">ทดลองใช้: รหัส 41208 รหัสผ่าน 1234 ลืมรหัสผ่านให้แจ้งครูที่ห้องสมุด</p>
      </form>`, 'me'),
      mount(root) {
        $('[data-login]', root).addEventListener('submit', e => {
          e.preventDefault(); const f = e.target, id = f.id.value.trim();
          const msg = t => { $('#lmsg').innerHTML = `<div class="msg err" role="alert">${t}</div>`; };
          if (!SBY[id]) return msg(`ไม่พบรหัส ${esc(id) || '(ว่าง)'} ตรวจรหัส 5 หลักบนบัตรนักเรียนอีกครั้ง`);
          if (f.pw.value !== '1234') return msg('รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง หรือแจ้งครูที่ห้องสมุดเพื่อตั้งรหัสใหม่');
          S.student = id; refresh();
        });
      }
    };
  }
  const my = loansOf(st.id).sort((a, b) => a.due - b.due);
  const visits = st.mv + todayVisits().filter(v => v.sid === st.id).length;
  const sticker = (on, sym, t) => `<span class="sticker${on ? '' : ' locked'}"><i aria-hidden="true">${sym}</i>${t}${on ? '' : '<span class="sr"> (ยังไม่ได้)</span>'}</span>`;
  const loanCard = l => { const b = BY[l.bc], d = dueText(l.due); return `<a class="loan${d.soon ? ' soon' : ''}" href="#/s/book/${b.bc}">${cover(b)}<div><div style="font-weight:500;line-height:1.4">${esc(shortTitle(b.t))}</div><div class="due">${d.txt}</div><div class="small muted">ยืมเมื่อ ${thShort(l.out)} คืนที่เคาน์เตอร์ห้องสมุด</div></div></a>`; };
  return {
    title: 'ของฉัน', html: sWrap(`
    <div class="s-head" style="padding:16px 16px 4px;justify-content:space-between"><h1 tabindex="-1">สวัสดี ${esc(st.nick)}</h1><button class="btn ghost sm" data-logout>ออกจากระบบ</button></div>
    <p class="small muted" style="padding:0 16px">${esc(fullName(st))} ${cls(st)}</p>
    <section class="sec"><div class="sec-h"><h2>หนังสือที่ยืมอยู่ ${my.length} เล่ม</h2></div>
      <div class="stack">${my.map(loanCard).join('') || '<p class="muted">ตอนนี้ไม่มีหนังสือที่ยืมอยู่</p>'}</div></section>
    <section class="sec"><div class="sec-h"><h2>สถิติของฉัน</h2></div>
      <div class="me-stats"><div><b class="num">${visits}</b><span class="small muted">ครั้งที่มาห้องสมุดเดือนนี้</span></div><div><b class="num">${st.ls}</b><span class="small muted">เล่มที่ยืมภาคเรียนนี้</span></div></div></section>
    <section class="sec"><div class="sec-h"><h2>สติกเกอร์ของฉัน</h2></div>
      <div class="stickers">${sticker(true, '1', 'มาห้องสมุดครั้งแรก')}${sticker(st.ls >= 5, '5', 'ยืมครบ 5 เล่ม')}${sticker(visits >= 10, '10', 'มาครบ 10 ครั้งในเดือน')}${sticker(st.ls >= 10, '3', 'อ่านครบ 3 หมวด')}</div>
      <p class="small muted" style="margin-top:10px">สติกเกอร์ได้จากการมาห้องสมุดและการยืมของตัวเอง ไม่มีการจัดอันดับกับเพื่อน</p></section>
    <section class="sec"><div class="sec-h"><h2>ขนาดตัวอักษร</h2></div>${fszControl()}</section>`, 'me'),
    mount(root) { $('[data-logout]', root).addEventListener('click', () => { S.student = null; refresh(); }); }
  };
}
