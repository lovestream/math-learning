from pathlib import Path
from html import escape
from collections import Counter
import shutil

OUT = Path(__file__).parent
BLUE, YELLOW, CORAL, MINT = '#d9eaff', '#fff0ab', '#ffd2c7', '#d8efdf'
INK = '#152e50'

def text(x, y, value, size=24, anchor='start', weight=400):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}">{escape(value)}</text>'

def make_page(filename, title, subtitle, cells, foot):
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 840 1188" role="img" aria-label="{escape(title)}">',
             '<rect width="840" height="1188" fill="white"/>',
             f'<g fill="{INK}" font-family="PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif">',
             text(60, 70, 'KEVIN  /  动手折一折', 18, weight=600),
             text(60, 130, title, 34, weight=700),
             text(60, 174, subtitle, 22)]
    edges = Counter()
    for label, x, y, w, h, color in cells:
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')
        parts.append(text(x+w/2, y+h/2+12, label, 34, 'middle', 600))
        pts = [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]
        for a,b in zip(pts, pts[1:]+pts[:1]):
            edges[tuple(sorted((a,b)))] += 1
    for ((x1,y1),(x2,y2)), count in edges.items():
        dash = ' stroke-dasharray="9 7"' if count==2 else ''
        parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="2"{dash}/>')
    assert sum(v==2 for v in edges.values()) == 5
    parts.extend([
        f'<line x1="60" y1="918" x2="125" y2="918" stroke="{INK}" stroke-width="2"/>',
        text(142, 926, '实线：沿外轮廓剪下', 21),
        f'<line x1="455" y1="918" x2="520" y2="918" stroke="{INK}" stroke-width="2" stroke-dasharray="9 7"/>',
        text(536, 926, '虚线：保留并折叠', 21),
        text(60, 990, foot, 21),
        text(60, 1034, '先折出形状，需要固定时再用少量透明胶带。', 21),
        text(60, 1117, 'A4 等比例模板 · 打印选择“实际大小 / 100%”', 18),
        '</g></svg>'
    ])
    (OUT / filename).write_text('\n'.join(parts), encoding='utf-8')

make_page('template-rectangular-box.svg', '长方体：找一找每个面',
          '蓝色、黄色、红色各有一对；每一对的形状和大小相同。', [
    ('下',270,220,300,200,BLUE), ('后',270,420,300,100,YELLOW),
    ('上',270,520,300,200,BLUE), ('左',170,520,100,200,CORAL),
    ('右',570,520,100,200,CORAL), ('前',270,720,300,100,YELLOW)],
    '把“上”当作屋顶，四个侧面向下折，最后合上“下”。')

nets = [
    [('E',0,0,YELLOW),('A',0,1,BLUE),('B',1,1,BLUE),('C',2,1,BLUE),('D',3,1,BLUE),('F',3,2,CORAL)],
    [('A',0,0,BLUE),('B',1,0,BLUE),('C',2,0,BLUE),('D',3,0,BLUE),('E',0,1,YELLOW),('F',3,1,CORAL)],
    [('A',0,0,BLUE),('B',1,0,BLUE),('C',2,0,BLUE),('D',2,1,YELLOW),('E',3,1,CORAL),('F',4,1,MINT)]
]
for i, coords in enumerate(nets, 1):
    cols=max(x for _,x,_,_ in coords)+1
    rows=max(y for _,_,y,_ in coords)+1
    ox=(840-cols*100)/2
    oy=510-rows*50
    cells=[(label,ox+x*100,oy+y*100,100,100,color) for label,x,y,color in coords]
    assert len(cells)==6 and all(c[3:5]==(100,100) for c in cells)
    make_page(f'template-cube-{i}.svg', f'正方体展开图 · 试验 {i}',
              '每个正方形边长 2.5 厘米。先猜一猜，再折一折。', cells,
              '检查：6 个面有没有重叠？有没有哪一面留下缺口？')

pages=['template-rectangular-box.svg']+[f'template-cube-{i}.svg' for i in range(1,4)]
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kevin 的等比例折纸模板</title><style>
body{margin:0;background:#eef2f5;font-family:system-ui,sans-serif;color:#152e50}.bar{max-width:760px;margin:25px auto;padding:0 20px;line-height:1.8}button{background:#244f84;color:white;border:0;border-radius:8px;padding:10px 20px;font:inherit;cursor:pointer}.page{width:min(100%,794px);margin:20px auto;background:white;box-shadow:0 5px 25px #19365612}.page img{display:block;width:100%}@page{size:A4;margin:0}@media print{body{background:white}.bar{display:none}.page{width:210mm;height:297mm;margin:0;box-shadow:none;break-after:page}.page:last-child{break-after:auto}.page img{width:210mm;height:297mm}}
</style><div class="bar"><h1>Kevin 的等比例折纸模板</h1><p>共 4 页：一个长方体展开图、练习中的三种正方体纸板。实线剪开，虚线保留并折叠。图形按精确尺寸绘制；打印时选择 A4、实际大小或 100%，关闭页眉页脚。</p><button onclick="window.print()">打印 4 页模板</button></div>'''
html+=''.join(f'<div class="page"><img src="{p}" alt="折纸模板 {i+1}"></div>' for i,p in enumerate(pages))
(OUT/'print-templates.html').write_text(html,encoding='utf-8')

src=Path('/Users/yako/.codex/generated_images/01a06fe4-3801-73c3-a991-667a85460a8f')
for original, final in [
    ('exec-0567954b-df62-4039-9b83-ba6174091d1f.png','01-faces.png'),
    ('exec-74f364ce-9e3d-4fa1-a75a-a393b4454f06.png','02-unfolding.png'),
    ('exec-fd37fbfb-1938-42e7-ad24-ad9375d7e8f3.png','03-cube-nets.png')]:
    shutil.copy2(src/original, OUT/final)
print('Saved 3 illustrated posters and 4 exact SVG templates; validated all six-face layouts and five fold edges.')
