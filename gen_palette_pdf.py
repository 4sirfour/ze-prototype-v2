# -*- coding: utf-8 -*-
"""Generate a dark-themed, Chinese-labeled color palette PDF for the ZE prototype."""
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.colors import Color

FONT = "STSong-Light"
pdfmetrics.registerFont(UnicodeCIDFont(FONT))

W, H = 595, 842          # A4 portrait
M = 40                   # margin
USABLE = W - 2 * M
BASE_H = "#07090e"

def parse_color(s):
    """Return (r,g,b,a) with components in 0..1."""
    s = s.strip()
    if s.startswith("#"):
        h = s[1:]
        r, g, b = int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255
        return (r, g, b, 1.0)
    if s.startswith("rgba"):
        inside = s[s.find("(") + 1:s.find(")")]
        parts = [p.strip() for p in inside.split(",")]
        r, g, b, a = int(parts[0]) / 255, int(parts[1]) / 255, int(parts[2]) / 255, float(parts[3])
        return (r, g, b, a)
    raise ValueError(s)

def lum(s):
    r, g, b, _ = parse_color(s)
    return 0.299 * r + 0.587 * g + 0.114 * b  # in 0..1

# (hex, variable, cn label, rgb text)
SECTIONS = [
    ("主品牌色 — 金（Binance 风格）", [
        ("#f0b90b", "--gold", "主金色 / 标题·按钮·强调", "rgb(240,185,11)"),
        ("#d4a84b", "--gold-2", "金色次级 / 暗部", "rgb(212,168,75)"),
        ("#fce38a", "--gold-3", "金色高光 / 亮部", "rgb(252,227,138)"),
    ]),
    ("点缀色（小面积使用）", [
        ("#f6465d", "--red", "极光红晕 / 图标红 / 警示", "rgb(246,70,93)"),
        ("#2e7eed", "--blue", "极光蓝晕 / 图标蓝 / 链接", "rgb(46,126,237)"),
        ("#0ecb81", "--green", "上涨 / 正向（行情页）", "rgb(14,203,129)"),
    ]),
    ("背景色阶（冷调近黑）", [
        ("#07090e", "--bg-0", "页面底色（最深）", "rgb(7,9,14)"),
        ("#12161d", "--bg-1", "卡片底层", "rgb(18,22,29)"),
        ("#1b2028", "--bg-2", "卡片中层", "rgb(27,32,40)"),
        ("#2a313b", "--bg-3", "边框 / 高亮", "rgb(42,49,59)"),
    ]),
    ("文字 & 玻璃拟态", [
        ("#eaecef", "--text", "主文字", "rgb(234,236,239)"),
        ("#848e9c", "--text-muted", "次要文字", "rgb(132,142,156)"),
        ("#07090e", "--text-dark", "反白文字（金底上）", "rgb(7,9,14)"),
        ("rgba(13,16,22,0.55)", "--glass-bg", "玻璃卡片底", "rgba(13,16,22,.55)"),
        ("rgba(255,255,255,0.08)", "--glass-border", "发丝边框", "rgba(255,255,255,.08)"),
    ]),
]

c = canvas.Canvas("ze-color-reference.pdf", pagesize=(W, H))
c.setFont(FONT, 1)  # ensure font registered for measuring

# Page background
bg = parse_color(BASE_H)
c.setFillColorRGB(*bg)
c.rect(0, 0, W, H, fill=1, stroke=0)

# Header
c.setFillColorRGB(*parse_color("#f0b90b")[:3])
c.setFont(FONT, 23)
c.drawString(M, 790, "ZE 配色参考 · 色值编码")
c.setFillColorRGB(*parse_color("#848e9c")[:3])
c.setFont(FONT, 11)
c.drawString(M, 772, "ZE Color Reference — Hex / RGB codes  (css/style.css :root)")

# Gold accent rule
c.setStrokeColorRGB(*parse_color("#f0b90b")[:3])
c.setLineWidth(1.2)
c.line(M, 762, W - M, 762)

cy = 742
SW_H = 42
LBL_H = 36
CARD_H = SW_H + LBL_H + 6
GAP = 15

for title, items in SECTIONS:
    cols = 3 if len(items) <= 3 else (4 if len(items) == 4 else 5)
    card_w = (USABLE - GAP * (cols - 1)) / cols
    # section title
    c.setFillColorRGB(*parse_color("#fce38a")[:3])
    c.setFont(FONT, 13)
    c.drawString(M, cy, title)
    cy -= 18
    nrows = (len(items) + cols - 1) // cols
    for i, (hexv, var, cn, rgb) in enumerate(items):
        col = i % cols
        row = i // cols
        x = M + col * (card_w + GAP)
        card_bottom = cy - (row + 1) * CARD_H - row * 12
        sw_bottom = card_bottom + LBL_H + 4
        sw_top = sw_bottom + SW_H
        r, g, b, a = parse_color(hexv)
        # swatch fill
        c.setFillColorRGB(r, g, b, a)
        c.rect(x, sw_bottom, card_w, SW_H, fill=1, stroke=0)
        # border so dark swatches stay visible on dark page
        c.setStrokeColor(Color(1, 1, 1, 0.18))
        c.setLineWidth(0.8)
        c.rect(x, sw_bottom, card_w, SW_H, fill=0, stroke=1)
        # hex inside swatch (contrasting) — 主色值
        txt_col = (0.03, 0.03, 0.05) if lum(hexv) > 0.55 else (0.92, 0.92, 0.94)
        c.setFillColorRGB(*txt_col)
        c.setFont(FONT, 12)
        c.drawCentredString(x + card_w / 2, sw_bottom + SW_H / 2 - 4, hexv.upper())
        # labels below: 变量名 / 中文用途 / 色值(RGB)
        c.setFillColorRGB(*parse_color("#eaecef")[:3])
        c.setFont(FONT, 9)
        c.drawCentredString(x + card_w / 2, card_bottom + LBL_H - 11, var)
        c.setFillColorRGB(*parse_color("#848e9c")[:3])
        c.setFont(FONT, 7.5)
        c.drawCentredString(x + card_w / 2, card_bottom + LBL_H - 21, cn)
        c.setFillColorRGB(*parse_color("#fce38a")[:3])
        c.setFont(FONT, 7.5)
        c.drawCentredString(x + card_w / 2, card_bottom + LBL_H - 30, rgb)
    cy = cy - nrows * (CARD_H + 12) - 6

# Footer note
c.setFillColorRGB(*parse_color("#848e9c")[:3])
c.setFont(FONT, 9)
c.drawString(M, 50, "配色逻辑：黑底 + 金为主视觉；红 / 蓝仅作小面积点缀（图标循环 3n+2→蓝、3n+3→红）；紫罗兰已移除。")
c.drawString(M, 36, "极光固定层：金 rgba(240,185,11,.10) 左上 · 红 rgba(246,70,93,.10) 右上 · 蓝 rgba(46,126,237,.09) 右下。")

c.showPage()
c.save()
print("OK -> ze-color-reference.pdf")
