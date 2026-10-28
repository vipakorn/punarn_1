import json, re
from pathlib import Path
D = Path(__file__).parent
css = (D/'style.css').read_text(encoding='utf-8') + (D/'extra.css').read_text(encoding='utf-8')
books = json.loads((D/'books.min.json').read_text(encoding='utf-8'))
js = '\n'.join((D/'js'/f).read_text(encoding='utf-8') for f in ['core.js','student.js','kiosk.js','teacher.js','teacher2.js','exec.js'])
js += '\nrender();\n'
def mincss(c):
    c = re.sub(r'/\*.*?\*/', '', c, flags=re.S)
    c = re.sub(r'\s*\n\s*', '', c)
    c = re.sub(r'\s*([{};,>])\s*', r'\1', c)
    return c
fav = "data:image/svg+xml," + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 8C12 5 7 5 3 6.5V26c4-1.5 9-1.5 13 1.5z' fill='%230D6E68'/%3E%3Cpath d='M16 8c4-3 9-3 13-1.5V26c-4-1.5-9-1.5-13 1.5z' fill='%23F26B4F'/%3E%3C/svg%3E"
html = f'''<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ปันอ่าน ต้นแบบ</title>
<meta name="description" content="ต้นแบบที่คลิกได้ของระบบห้องสมุดโรงเรียนปันอ่าน (PunArn) สำหรับทดสอบการใช้งาน">
<link rel="icon" href="{fav}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@400;500;600&amp;family=IBM+Plex+Sans+Thai:wght@400;500;600&amp;display=swap" rel="stylesheet">
<link rel="preconnect" href="https://storage.naiin.com"><link rel="preconnect" href="https://covers.openlibrary.org">
<style>{mincss(css)}</style>
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px">ต้นแบบนี้ต้องเปิดใช้ JavaScript</p></noscript>
<script>window.__BOOKS={json.dumps(books, ensure_ascii=False, separators=(',',':'))};</script>
<script>
{js}
</script>
</body>
</html>
'''
out = D.parent/'punarn_prototype.html'
out.write_text(html, encoding='utf-8')
print('bytes', len(html.encode('utf-8')))
