import csv, json, re, sys
from pathlib import Path

D = Path(__file__).parent
OUT = D.parent
OUT.mkdir(parents=True, exist_ok=True)

def read_psv(p):
    lines = [l for l in (D / p).read_text(encoding='utf-8').strip().split('\n')]
    head = lines[0].split('|')
    return [dict(zip(head, l.split('|'))) for l in lines[1:]]

def isbn10_to_13(i10):
    core = '978' + i10[:9]
    s = sum(int(c) * (1 if k % 2 == 0 else 3) for k, c in enumerate(core))
    return core + str((10 - s % 10) % 10)

def valid13(i):
    if not re.fullmatch(r'\d{13}', i):
        return False
    s = sum(int(c) * (1 if k % 2 == 0 else 3) for k, c in enumerate(i[:12]))
    return (10 - s % 10) % 10 == int(i[12])

def valid10(i):
    if not re.fullmatch(r'\d{9}[\dX]', i):
        return False
    s = sum((10 - k) * (10 if c == 'X' else int(c)) for k, c in enumerate(i))
    return s % 11 == 0

DDC_CLASS = {
    '0': '000 เบ็ดเตล็ด/ความรู้ทั่วไป', '1': '100 ปรัชญาและจิตวิทยา', '2': '200 ศาสนา',
    '3': '300 สังคมศาสตร์', '4': '400 ภาษาศาสตร์', '5': '500 วิทยาศาสตร์',
    '6': '600 เทคโนโลยี/วิทยาศาสตร์ประยุกต์', '7': '700 ศิลปะและนันทนาการ',
    '8': '800 วรรณคดี/วรรณกรรม', '9': '900 ประวัติศาสตร์และภูมิศาสตร์',
}

THAI_CONS = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ'

def thai_title_mark(t):
    for ch in t:
        if ch in THAI_CONS:
            return ch
        if ch.isascii() and ch.isalnum():
            return ch.lower()
    return ''

def eng_title_mark(t):
    w = t.split()
    if w and w[0].lower() in ('the', 'a', 'an') and len(w) > 1:
        w = w[1:]
    return w[0][0].lower() if w else ''

NO_ISBN_EAN = {  # items sold without ISBN; retailer product barcode (EAN-13)
    '707510': '8858716704512', '616959': '8858716704338', '683726': '8859663801101',
    '696319': '8859161012382', '569359': '8859099307611', '641603': '8859099309776',
    '686970': '8859161011880',
}
SET_NOTE = {'201553': 'ชุด 4 เล่ม (Box set)', '61298': 'ชุด 2 เล่มจบ', '24362': 'ชุด 2 เล่มจบ',
            '113338': 'ชุดไตรภาค 3 เล่ม (Box set)'}

def location(rtype, lang_is_eng):
    if rtype == 'หนังสืออ้างอิง':
        return 'มุมหนังสืออ้างอิง (ชั้น 1)'
    if rtype in ('หนังสือเรียน/คู่มือเรียน', 'หนังสือเตรียมสอบ'):
        return 'มุมหนังสือเรียนและเตรียมสอบ (ชั้น 2)'
    if lang_is_eng:
        return 'มุมหนังสือภาษาอังกฤษ (ชั้น 2)'
    if rtype == 'การ์ตูนความรู้':
        return 'มุมการ์ตูนความรู้ (ชั้น 1)'
    if rtype in ('วรรณกรรมไทย', 'วรรณคดีไทย', 'วรรณกรรมแปล'):
        return 'มุมวรรณกรรม (ชั้น 1)'
    return 'ชั้นหนังสือทั่วไป (ชั้น 1)'

records, problems = [], []

for r in read_psv('thai.psv'):
    isbn = r['isbn']
    if isbn and not valid13(isbn):
        problems.append(('bad isbn', r['nid'], isbn))
    year = re.search(r'(\d{4})$', r['date']).group(1)
    note = []
    if r['nid'] in NO_ISBN_EAN:
        note.append('ไม่มีเลข ISBN (บาร์โค้ดสินค้า EAN-13: %s)' % NO_ISBN_EAN[r['nid']])
    if r['nid'] in SET_NOTE:
        note.append(SET_NOTE[r['nid']])
    records.append(dict(
        isbn=isbn, title=r['title'], edition=r['edition'], author=r['author'],
        publisher=r['publisher'], year=year, pages=r['pages'], lang=r['lang'],
        rtype=r['type'], ddc=r['ddc'],
        call='%s %s %s' % (r['ddc'], r['amark'], thai_title_mark(r['title'])),
        subjects=r['subjects'], level=r['level'],
        cover='https://storage.naiin.com/system/application/bookstore/resource/product/' + r['cover'],
        source='https://www.naiin.com/product/detail/' + r['nid'],
        note='; '.join(note), eng=False))

for r in read_psv('eng.psv'):
    isbn = r['isbn']
    if len(isbn) == 10:
        if not valid10(isbn):
            problems.append(('bad isbn10', r['title'], isbn))
        isbn = isbn10_to_13(isbn)
    if not valid13(isbn):
        problems.append(('bad isbn', r['title'], isbn))
    records.append(dict(
        isbn=isbn, title=r['title'], edition=r['edition'], author=r['author'],
        publisher=r['publisher'], year=r['year'], pages=r['pages'], lang='อังกฤษ',
        rtype=r['type'], ddc=r['ddc'],
        call='%s %s %s' % (r['ddc'], r['amark'], eng_title_mark(r['title'])),
        subjects=r['subjects'], level=r['level'],
        cover='https://covers.openlibrary.org/b/id/%s-L.jpg' % r['cover'],
        source='https://openlibrary.org' + r['olkey'],
        note='', eng=True))

# shelf-list order: by DDC number, then call number
def ddc_key(rec):
    return (float(rec['ddc']), rec['call'])
records.sort(key=ddc_key)

HEAD = ['ลำดับ (No.)', 'บาร์โค้ด (Barcode)', 'ISBN', 'ชื่อเรื่อง (Title)', 'ฉบับพิมพ์ (Edition)',
        'ผู้แต่ง (Author)', 'สำนักพิมพ์ (Publisher)', 'ปีที่พิมพ์ (Year)', 'จำนวนหน้า (Pages)',
        'ภาษา (Language)', 'ประเภททรัพยากร (Resource type)', 'หมวดใหญ่ DDC (DDC class)',
        'เลขหมู่ DDC (DDC no.)', 'เลขเรียกหนังสือ (Call no.)', 'หัวเรื่อง (Subjects)',
        'ระดับชั้นที่เหมาะสม (Grade level)', 'สถานที่จัดเก็บ (Location)', 'สถานะ (Status)',
        'URL ภาพปก (Cover image)', 'แหล่งข้อมูลบรรณานุกรม (Metadata source)', 'หมายเหตุ (Note)']

rows = []
for n, rec in enumerate(records, 1):
    if rec['rtype'] == 'หนังสืออ้างอิง':
        status = 'อ่านภายในห้องสมุดเท่านั้น'
    elif n % 9 == 4:
        status = 'ถูกยืม'
    else:
        status = 'พร้อมให้ยืม'
    rows.append([n, '%07d' % (1000000 + n), rec['isbn'], rec['title'], rec['edition'], rec['author'],
                 rec['publisher'], rec['year'], rec['pages'], rec['lang'], rec['rtype'],
                 DDC_CLASS[rec['ddc'][0]], rec['ddc'], rec['call'], rec['subjects'], rec['level'],
                 location(rec['rtype'], rec['eng']), status, rec['cover'], rec['source'], rec['note']])

# duplicate checks
isbns = [r[2] for r in rows if r[2]]
dups = {i for i in isbns if isbns.count(i) > 1}
if dups:
    problems.append(('dup isbn', dups))
covers = [r[18] for r in rows]
if len(set(covers)) != len(covers):
    problems.append(('dup cover', [c for c in covers if covers.count(c) > 1]))

out = OUT / 'secondary_school_library_200_books.csv'
with open(out, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    w.writerow(HEAD)
    w.writerows(rows)

(D / 'covers.json').write_text(json.dumps(covers), encoding='utf-8')
print('rows', len(rows), 'problems', problems)
