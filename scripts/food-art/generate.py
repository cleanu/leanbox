"""
Generates the placeholder food illustrations in public/food/*.jpg,
public/about/founder.jpg and the brand SVGs. Replace the JPGs with real
photography of the same name when you have it (4:5 portrait, ≥1200×1500).

  python3 scripts/food-art/generate.py        (needs playwright + Pillow)
"""
import math
import os
import random
from io import BytesIO

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
W, H = 1200, 1500

PARCH = "#F3EEE4"
WALNUT = "#2C2118"
OLIVE = "#3E5A4A"
SAFFRON = "#C8960A"


def defs(bg_top, bg_bottom):
    return f"""
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="{bg_top}"/><stop offset="1" stop-color="{bg_bottom}"/>
      </linearGradient>
      <filter id="linen" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9 0.012" numOctaves="2" seed="4" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.17  0 0 0 0 0.13  0 0 0 0 0.09  0 0 0 0.10 0"/>
      </filter>
      <filter id="grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="9" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.10 0"/>
      </filter>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="28"/>
      </filter>
      <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>
      <radialGradient id="bowl" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#FFFDF8"/><stop offset="0.75" stop-color="#EFE8DC"/><stop offset="1" stop-color="#D9CFBE"/>
      </radialGradient>
      <radialGradient id="bowlIn" cx="0.5" cy="0.45" r="0.6">
        <stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#2C2118" stop-opacity="0.22"/>
      </radialGradient>
      <radialGradient id="light" cx="0.3" cy="0.2" r="0.9">
        <stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.6" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>"""


class Canvas:
    def __init__(self, seed):
        self.r = random.Random(seed)
        self.parts = []

    def add(self, s):
        self.parts.append(s)

    def rnd(self, a, b):
        return self.r.uniform(a, b)

    def in_sector(self, cx, cy, rad, a0, a1, rmin=0.0, rmax=1.0):
        """Random point inside an annular sector (angles in degrees)."""
        a = math.radians(self.rnd(a0, a1))
        d = rad * math.sqrt(self.rnd(rmin**2, rmax**2))
        return cx + d * math.cos(a), cy + d * math.sin(a)


# ---------------------------------------------------------------- ingredients
def rice(c, cx, cy, R, a0, a1, color="#F4EDDD", shade="#D9CBB0", n=900, brown=False):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.98)
        rot = c.rnd(0, 180)
        col = color if not brown or c.r.random() > 0.5 else "#CDAE82"
        c.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="9" ry="4.2" fill="{col}" stroke="{shade}" stroke-width="0.8" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')


def quinoa(c, cx, cy, R, a0, a1, n=1400):
    cols = ["#E9DCC0", "#C9A77A", "#8E3B2E", "#F2E9D6", "#3B2A22"]
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.98)
        col = c.r.choices(cols, weights=[5, 3, 1.4, 4, 0.8])[0]
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{c.rnd(3.2, 4.6):.1f}" fill="{col}"/>')


def cauli_rice(c, cx, cy, R, a0, a1, n=1100):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.98)
        c.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{c.rnd(4,8):.1f}" height="{c.rnd(4,7):.1f}" rx="2" fill="{c.r.choice(["#FBF7EE","#EFE7D6","#F6F0E2"])}" transform="rotate({c.rnd(0,90):.0f} {x:.1f} {y:.1f})"/>')


def mash(c, cx, cy, R, a0, a1, color="#E7A04A", swirl="#C97F2C"):
    pts = []
    for a in range(int(a0), int(a1) + 1, 4):
        rr = R * 0.97 + c.rnd(-6, 6)
        pts.append((cx + rr * math.cos(math.radians(a)), cy + rr * math.sin(math.radians(a))))
    d = f"M{cx},{cy} " + " ".join(f"L{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    c.add(f'<path d="{d}" fill="{color}"/>')
    for i in range(7):
        a = math.radians(c.rnd(a0 + 10, a1 - 10))
        rr = R * c.rnd(0.3, 0.8)
        x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
        c.add(f'<path d="M{x-40:.0f},{y:.0f} q40,-26 80,0" stroke="{swirl}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.55"/>')


def soba(c, cx, cy, R, a0, a1, n=70):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.05, 0.9)
        rot = c.rnd(0, 360)
        c.add(
            f'<path d="M{x-70:.0f},{y:.0f} c30,-40 60,40 90,0 s50,-30 70,10" stroke="#8C6A4A" stroke-width="7" fill="none" '
            f'stroke-linecap="round" transform="rotate({rot:.0f} {x:.0f} {y:.0f})" opacity="0.95"/>'
        )
        c.add(
            f'<path d="M{x-70:.0f},{y:.0f} c30,-40 60,40 90,0 s50,-30 70,10" stroke="#B08C66" stroke-width="2" fill="none" '
            f'stroke-linecap="round" transform="rotate({rot:.0f} {x:.0f} {y:.0f})"/>'
        )


def chicken_slices(c, cx, cy, angle, n=6, color="#E3B071", sear="#9B5A26", length=250, grill=True):
    for i in range(n):
        off = (i - n / 2) * 38
        a = math.radians(angle)
        x = cx + off * math.cos(a + math.pi / 2)
        y = cy + off * math.sin(a + math.pi / 2)
        rot = angle + c.rnd(-4, 4)
        c.add(f'<g transform="rotate({rot:.1f} {x:.1f} {y:.1f})">')
        c.add(f'<rect x="{x-length/2:.1f}" y="{y-20:.1f}" width="{length}" height="40" rx="18" fill="{color}" stroke="{sear}" stroke-width="5"/>')
        c.add(f'<rect x="{x-length/2+10:.1f}" y="{y-12:.1f}" width="{length-20}" height="10" rx="5" fill="#F4D7A8" opacity="0.8"/>')
        if grill:
            for k in range(4):
                gx = x - length / 2 + 45 + k * 50
                c.add(f'<line x1="{gx:.1f}" y1="{y-18:.1f}" x2="{gx+22:.1f}" y2="{y+18:.1f}" stroke="{sear}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>')
        c.add("</g>")


def salmon(c, cx, cy, angle, glaze=True):
    c.add(f'<g transform="rotate({angle} {cx} {cy})">')
    c.add(f'<rect x="{cx-170}" y="{cy-85}" width="340" height="170" rx="60" fill="#E8744A"/>')
    for k in range(7):
        x = cx - 140 + k * 45
        c.add(f'<path d="M{x},{cy-80} q20,80 0,160" stroke="#F7C3A5" stroke-width="7" fill="none" opacity="0.85"/>')
    if glaze:
        c.add(f'<rect x="{cx-170}" y="{cy-85}" width="340" height="170" rx="60" fill="#7A2E12" opacity="0.28"/>')
        c.add(f'<path d="M{cx-150},{cy-40} q150,-60 300,0" stroke="#FFF3E6" stroke-width="6" fill="none" opacity="0.5" stroke-linecap="round"/>')
    c.add("</g>")


def cod(c, cx, cy, angle):
    c.add(f'<g transform="rotate({angle} {cx} {cy})">')
    c.add(f'<rect x="{cx-160}" y="{cy-90}" width="320" height="180" rx="50" fill="#F8F2E6" stroke="#E6D7BD" stroke-width="4"/>')
    c.add(f'<rect x="{cx-160}" y="{cy-90}" width="320" height="180" rx="50" fill="#B7651E" opacity="0.35"/>')
    for k in range(5):
        c.add(f'<path d="M{cx-120+k*55},{cy-80} q18,80 0,160" stroke="#FFFBF2" stroke-width="5" fill="none" opacity="0.7"/>')
    c.add(f'<ellipse cx="{cx-40}" cy="{cy-30}" rx="70" ry="22" fill="#6B3410" opacity="0.35"/>')
    c.add("</g>")


def beef(c, cx, cy, R, a0, a1, n=16):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.85)
        s = c.rnd(38, 56)
        rot = c.rnd(0, 90)
        c.add(f'<rect x="{x-s/2:.1f}" y="{y-s/2:.1f}" width="{s:.1f}" height="{s*0.8:.1f}" rx="12" fill="#5A2E1C" stroke="#2E160C" stroke-width="3" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')
        c.add(f'<rect x="{x-s/4:.1f}" y="{y-s/4:.1f}" width="{s/2.5:.1f}" height="{s/6:.1f}" rx="4" fill="#8E4B2E" transform="rotate({rot:.0f} {x:.1f} {y:.1f})" opacity="0.7"/>')
    for _ in range(90):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.9)
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.4" fill="#1A1410"/>')


def tofu(c, cx, cy, R, a0, a1, n=12, sauce=True):
    if sauce:
        for _ in range(26):
            x, y = c.in_sector(cx, cy, R, a0, a1, 0.05, 0.9)
            c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{c.rnd(18,34):.1f}" fill="#B3321E" opacity="0.55"/>')
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.8)
        s = c.rnd(56, 70)
        rot = c.rnd(0, 90)
        c.add(f'<rect x="{x-s/2:.1f}" y="{y-s/2:.1f}" width="{s:.1f}" height="{s:.1f}" rx="10" fill="#EFC77E" stroke="#B8812F" stroke-width="4" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')
        c.add(f'<rect x="{x-s/2+8:.1f}" y="{y-s/2+8:.1f}" width="{s-16:.1f}" height="{s/3:.1f}" rx="6" fill="#C1432A" opacity="0.55" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')


def prawns(c, cx, cy, R, a0, a1, n=8):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.15, 0.8)
        rot = c.rnd(0, 360)
        c.add(f'<g transform="rotate({rot:.0f} {x:.1f} {y:.1f})">')
        c.add(f'<path d="M{x-40:.1f},{y:.1f} a40,40 0 1,1 80,0" stroke="#F0845C" stroke-width="30" fill="none" stroke-linecap="round"/>')
        for k in range(4):
            a = math.radians(200 + k * 35)
            c.add(f'<line x1="{x+30*math.cos(a):.1f}" y1="{y+30*math.sin(a):.1f}" x2="{x+52*math.cos(a):.1f}" y2="{y+52*math.sin(a):.1f}" stroke="#FFD2BE" stroke-width="4"/>')
        c.add(f'<path d="M{x+40:.1f},{y:.1f} l16,14 l-24,4 z" fill="#D2553A"/>')
        c.add("</g>")


def chickpeas(c, cx, cy, R, a0, a1, n=70):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.95)
        r = c.rnd(13, 17)
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#D9A25B" stroke="#A8702F" stroke-width="2.5"/>')
        c.add(f'<circle cx="{x-r/3:.1f}" cy="{y-r/3:.1f}" r="{r/3:.1f}" fill="#F0C888" opacity="0.8"/>')


def curry(c, cx, cy, R, a0, a1):
    pts = []
    for a in range(int(a0), int(a1) + 1, 3):
        rr = R * 0.96 + c.rnd(-8, 8)
        pts.append((cx + rr * math.cos(math.radians(a)), cy + rr * math.sin(math.radians(a))))
    d = f"M{cx},{cy} " + " ".join(f"L{x:.1f},{y:.1f}" for x, y in pts) + " Z"
    c.add(f'<path d="{d}" fill="#D8962A"/>')
    c.add(f'<path d="{d}" fill="#E7B04A" opacity="0.6" transform="translate(-6 -6)"/>')
    for _ in range(12):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.8)
        s = c.rnd(42, 58)
        c.add(f'<rect x="{x-s/2:.1f}" y="{y-s/2:.1f}" width="{s:.1f}" height="{s*0.85:.1f}" rx="16" fill="#F2D29A" stroke="#C07A2A" stroke-width="3" transform="rotate({c.rnd(0,90):.0f} {x:.1f} {y:.1f})"/>')
    for _ in range(18):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.9)
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{c.rnd(4,7):.1f}" fill="#FFF3D6" opacity="0.8"/>')


def broccoli(c, cx, cy, R, a0, a1, n=7, green="#4F7A3A"):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.2, 0.85)
        c.add(f'<rect x="{x-9:.1f}" y="{y:.1f}" width="18" height="46" rx="8" fill="#9BB56A"/>')
        for k in range(9):
            a = k * 40
            rr = c.rnd(12, 26)
            fx, fy = x + rr * math.cos(math.radians(a)), y - 10 + rr * math.sin(math.radians(a))
            c.add(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{c.rnd(15,21):.1f}" fill="{green}"/>')
        for k in range(14):
            fx, fy = x + c.rnd(-30, 30), y - 10 + c.rnd(-30, 30)
            c.add(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="4" fill="#6E9A4E"/>')


def carrots(c, cx, cy, R, a0, a1, n=9):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.15, 0.9)
        r = c.rnd(20, 26)
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#E5822F" stroke="#C2601B" stroke-width="3"/>')
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r/2.4:.1f}" fill="#F2A55A"/>')


def greens(c, cx, cy, R, a0, a1, n=14, cols=("#3E6B3A", "#5D8C47", "#2F5530")):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.9)
        rot = c.rnd(0, 360)
        col = c.r.choice(cols)
        c.add(f'<path d="M{x:.1f},{y:.1f} q40,-50 90,0 q-50,40 -90,0z" fill="{col}" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')
        c.add(f'<path d="M{x:.1f},{y:.1f} l80,0" stroke="#A7C27C" stroke-width="2.5" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>')


def edamame(c, cx, cy, R, a0, a1, n=40):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.95)
        c.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="14" ry="11" fill="#7FB04E" stroke="#5B8A35" stroke-width="2" transform="rotate({c.rnd(0,180):.0f} {x:.1f} {y:.1f})"/>')


def cabbage(c, cx, cy, R, a0, a1, n=40):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.95)
        c.add(f'<path d="M{x:.1f},{y:.1f} q30,-10 60,6" stroke="{c.r.choice(["#6B2A6E","#8C3F8A","#E7D7EC"])}" stroke-width="7" fill="none" stroke-linecap="round" transform="rotate({c.rnd(0,360):.0f} {x:.1f} {y:.1f})"/>')


def cucumber(c, cx, cy, R, a0, a1, n=8):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.2, 0.9)
        c.add(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="26" fill="#D8E8B8" stroke="#3F6B2E" stroke-width="6"/>')
        for k in range(6):
            a = math.radians(k * 60)
            c.add(f'<circle cx="{x+10*math.cos(a):.1f}" cy="{y+10*math.sin(a):.1f}" r="3" fill="#F4F7E6"/>')


def peppers(c, cx, cy, R, a0, a1, n=14):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.9)
        col = c.r.choice(["#D9412E", "#E9A92B", "#4D8A3C"])
        c.add(f'<path d="M{x:.1f},{y:.1f} q40,-16 80,0" stroke="{col}" stroke-width="13" fill="none" stroke-linecap="round" transform="rotate({c.rnd(0,360):.0f} {x:.1f} {y:.1f})"/>')


def pumpkin(c, cx, cy, R, a0, a1, n=10):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.15, 0.85)
        s = c.rnd(44, 58)
        c.add(f'<rect x="{x-s/2:.1f}" y="{y-s/2:.1f}" width="{s:.1f}" height="{s:.1f}" rx="12" fill="#E39A3B" stroke="#B86A1E" stroke-width="3" transform="rotate({c.rnd(0,90):.0f} {x:.1f} {y:.1f})"/>')
        c.add(f'<rect x="{x-s/2:.1f}" y="{y-s/2:.1f}" width="{s:.1f}" height="{s/4:.1f}" rx="6" fill="#6E8B3D" transform="rotate({c.rnd(0,90):.0f} {x:.1f} {y:.1f})" opacity="0.8"/>')


def beans(c, cx, cy, R, a0, a1, n=16):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0.1, 0.9)
        c.add(f'<path d="M{x:.1f},{y:.1f} l110,0" stroke="#4E8A3A" stroke-width="15" stroke-linecap="round" transform="rotate({c.rnd(0,360):.0f} {x:.1f} {y:.1f})"/>')


def sesame(c, cx, cy, R, a0=0, a1=360, n=90, col="#F7EFD8"):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, a0, a1, 0, 0.9)
        c.add(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="4" ry="2.4" fill="{col}" transform="rotate({c.rnd(0,180):.0f} {x:.1f} {y:.1f})"/>')


def herbs(c, cx, cy, R, n=26, col="#2F5A2C"):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, 0, 360, 0, 0.9)
        c.add(f'<path d="M{x:.1f},{y:.1f} q6,-10 14,0 q-8,8 -14,0z" fill="{col}" transform="rotate({c.rnd(0,360):.0f} {x:.1f} {y:.1f})"/>')


def chili(c, cx, cy, R, n=40):
    for _ in range(n):
        x, y = c.in_sector(cx, cy, R, 0, 360, 0, 0.9)
        c.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="6" height="4" fill="#B3281A" transform="rotate({c.rnd(0,90):.0f} {x:.1f} {y:.1f})"/>')


def lemon(c, x, y, r=46, rot=0):
    c.add(f'<g transform="rotate({rot} {x} {y})"><path d="M{x-r},{y} a{r},{r} 0 0,1 {2*r},0 z" fill="#F4D23C" stroke="#E0B420" stroke-width="5"/>')
    for k in range(5):
        a = math.radians(180 + 18 + k * 36)
        c.add(f'<line x1="{x}" y1="{y}" x2="{x+(r-10)*math.cos(a):.1f}" y2="{y+(r-10)*math.sin(a):.1f}" stroke="#FFF3B0" stroke-width="3"/>')
    c.add("</g>")


# ---------------------------------------------------------------- scene
def bowl(c, cx, cy, R, fill):
    c.add(f'<ellipse cx="{cx+26}" cy="{cy+46}" rx="{R+30}" ry="{R+18}" fill="#2C2118" opacity="0.30" filter="url(#shadow)"/>')
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{R+34}" fill="url(#bowl)"/>')
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{R+34}" fill="none" stroke="#CFC3AE" stroke-width="2"/>')
    c.add(f'<clipPath id="in{cx}{cy}"><circle cx="{cx}" cy="{cy}" r="{R}"/></clipPath>')
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="#E9E1D2"/>')
    c.add(f'<g clip-path="url(#in{cx}{cy})">')
    fill(c, cx, cy, R)
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#bowlIn)"/>')
    c.add("</g>")
    c.add(f'<circle cx="{cx}" cy="{cy}" r="{R+34}" fill="url(#light)"/>')


MEALS = {
    "seared-chicken-brown-rice": lambda c, x, y, R: (
        rice(c, x, y, R, 90, 270, brown=True),
        broccoli(c, x, y, R, -90, 10, n=5),
        carrots(c, x, y, R, 20, 90, n=7),
        chicken_slices(c, x + 60, y - 10, 70, n=5),
        herbs(c, x, y, R, n=18),
    ),
    "teriyaki-salmon-quinoa": lambda c, x, y, R: (
        quinoa(c, x, y, R, 0, 360),
        edamame(c, x, y, R, 200, 260, n=30),
        cabbage(c, x, y, R, 260, 330, n=36),
        cucumber(c, x, y, R, 110, 170, n=6),
        salmon(c, x + 40, y + 10, -18),
        sesame(c, x + 40, y + 10, 160, n=70),
    ),
    "black-pepper-beef-sweet-potato": lambda c, x, y, R: (
        mash(c, x, y, R, 110, 250),
        beans(c, x, y, R, 250, 330, n=12),
        beef(c, x, y, R, -40, 110, n=15),
        herbs(c, x, y, R, n=10, col="#355E2A"),
    ),
    "lemon-herb-chicken-cauli-rice": lambda c, x, y, R: (
        cauli_rice(c, x, y, R, 0, 360),
        greens(c, x, y, R, 200, 280, n=8, cols=("#6E9A4E", "#86AE5E")),
        chicken_slices(c, x + 20, y + 40, 20, n=4, color="#E7B676", sear="#8E4E1E", length=230),
        herbs(c, x, y, R, n=40, col="#3B6B2E"),
        lemon(c, x - 170, y - 120, 50, -30),
    ),
    "mala-tofu-quinoa": lambda c, x, y, R: (
        quinoa(c, x, y, R, 0, 360, n=1100),
        greens(c, x, y, R, 150, 230, n=7, cols=("#3F7A3A", "#5E9A48")),
        tofu(c, x, y, R, -70, 120, n=11),
        chili(c, x, y, R, n=60),
        sesame(c, x, y, R, n=60),
    ),
    "garlic-prawn-soba": lambda c, x, y, R: (
        soba(c, x, y, R, 0, 360),
        peppers(c, x, y, R, 180, 300, n=12),
        greens(c, x, y, R, 120, 180, n=6, cols=("#6BA34A", "#8CC063")),
        prawns(c, x, y, R, -60, 110, n=7),
        herbs(c, x, y, R, n=30, col="#3F7A3A"),
    ),
    "turmeric-chicken-curry": lambda c, x, y, R: (
        rice(c, x, y, R, 150, 330, color="#F6E2A4", shade="#E0BF6A"),
        curry(c, x, y, R, -30, 150),
        greens(c, x, y, R, 150, 200, n=6, cols=("#2F5A2C", "#3E6B3A")),
        herbs(c, x, y, R, n=24, col="#2F5A2C"),
    ),
    "mediterranean-chickpea-bowl": lambda c, x, y, R: (
        greens(c, x, y, R, 180, 300, n=16, cols=("#2F5530", "#3E6B3A", "#4E7B40")),
        pumpkin(c, x, y, R, 300, 400, n=9),
        chickpeas(c, x, y, R, 40, 180, n=60),
        c.add(f'<path d="M{x-200},{y+20} q100,-60 200,0 t200,0" stroke="#EADBB8" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.9"/>'),
        lemon(c, x + 190, y + 150, 44, 20),
    ),
    "miso-cod-greens": lambda c, x, y, R: (
        c.add(f'<circle cx="{x}" cy="{y}" r="{R}" fill="#E8D9B4"/>'),
        greens(c, x, y, R, 110, 260, n=14, cols=("#2F6A3A", "#3F7A3A", "#5A9A4A")),
        broccoli(c, x, y, R, 260, 330, n=3, green="#3F7A3A"),
        cod(c, x + 30, y + 20, -10),
        sesame(c, x + 30, y + 20, 120, n=40, col="#2A1E16"),
    ),
}

BG = {
    "seared-chicken-brown-rice": ("#E7DFD0", "#D8CCB6"),
    "teriyaki-salmon-quinoa": ("#DCE0D6", "#C6CDBF"),
    "black-pepper-beef-sweet-potato": ("#E6D8C4", "#D2C0A6"),
    "lemon-herb-chicken-cauli-rice": ("#EFE7D2", "#E0D4B6"),
    "mala-tofu-quinoa": ("#E8DCCB", "#D6C4AA"),
    "garlic-prawn-soba": ("#DDE2DA", "#C9D0C4"),
    "turmeric-chicken-curry": ("#EEE2C8", "#DDCBA4"),
    "mediterranean-chickpea-bowl": ("#E4E0D0", "#D0C9B2"),
    "miso-cod-greens": ("#DAD9CE", "#C4C2B4"),
}


def props(c, seed):
    """Chopsticks + linen fold for editorial flavour."""
    c.add(f'<rect x="-40" y="{1180 + seed % 40}" width="1300" height="360" fill="#F6F1E8" opacity="0.55" transform="rotate(-4 600 1300)"/>')
    c.add('<g opacity="0.95" transform="rotate(-24 1000 300)">'
          '<rect x="880" y="90" width="18" height="520" rx="9" fill="#3B2A1E"/>'
          '<rect x="920" y="100" width="18" height="520" rx="9" fill="#4A3526"/></g>')


def meal_svg(slug, seed=1):
    c = Canvas(seed)
    top, bottom = BG[slug]
    c.add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    c.add(f'<rect width="{W}" height="{H}" filter="url(#linen)"/>')
    props(c, seed)
    bowl(c, 600, 760, 400, MEALS[slug])
    c.add(f'<rect width="{W}" height="{H}" filter="url(#grain)"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs(top, bottom)}{"".join(c.parts)}</svg>'


def hero_svg():
    c = Canvas(42)
    c.add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    c.add(f'<rect width="{W}" height="{H}" filter="url(#linen)"/>')
    c.add('<rect x="-60" y="980" width="1400" height="600" fill="#3E5A4A" opacity="0.92" transform="rotate(-6 600 1200)"/>')
    c.add('<rect x="-60" y="1010" width="1400" height="6" fill="#C8960A" opacity="0.9" transform="rotate(-6 600 1200)"/>')
    bowl(c, 380, 420, 270, MEALS["teriyaki-salmon-quinoa"])
    bowl(c, 860, 900, 300, MEALS["seared-chicken-brown-rice"])
    bowl(c, 300, 1180, 200, MEALS["mala-tofu-quinoa"])
    lemon(c, 1000, 360, 60, 25)
    c.add('<g opacity="0.95" transform="rotate(32 700 520)"><rect x="660" y="260" width="18" height="560" rx="9" fill="#2C2118"/><rect x="700" y="270" width="18" height="560" rx="9" fill="#3B2A1E"/></g>')
    c.add(f'<rect width="{W}" height="{H}" filter="url(#grain)"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs("#EDE5D5", "#D9CCB4")}{"".join(c.parts)}</svg>'


def founder_svg():
    """Still life placeholder: cutting board, knife, herbs. Replace with a real portrait."""
    c = Canvas(7)
    c.add(f'<rect width="{W}" height="{H}" fill="url(#bg)"/>')
    c.add(f'<rect width="{W}" height="{H}" filter="url(#linen)"/>')
    c.add('<ellipse cx="640" cy="820" rx="470" ry="420" fill="#2C2118" opacity="0.28" filter="url(#shadow)"/>')
    c.add('<rect x="170" y="330" width="860" height="900" rx="80" fill="#B98A5A"/>')
    for k in range(14):
        c.add(f'<path d="M190,{380+k*62} q420,{c.rnd(-18,18):.0f} 820,0" stroke="#9E7043" stroke-width="3" fill="none" opacity="0.6"/>')
    c.add('<circle cx="600" cy="400" r="28" fill="#8A6038"/>')
    c.add('<g transform="rotate(-38 600 800)"><rect x="330" y="760" width="560" height="96" rx="20" fill="#D9DCDD"/><rect x="330" y="760" width="560" height="18" rx="9" fill="#F4F6F6"/><rect x="890" y="770" width="230" height="76" rx="26" fill="#1F1712"/><circle cx="950" cy="808" r="7" fill="#C8960A"/><circle cx="1010" cy="808" r="7" fill="#C8960A"/></g>')
    for _ in range(3):
        x, y = c.rnd(300, 800), c.rnd(900, 1100)
        for k in range(10):
            c.add(f'<path d="M{x:.0f},{y:.0f} q30,-40 70,-{20+k*6}" stroke="#3E5A4A" stroke-width="4" fill="none"/>')
            c.add(f'<ellipse cx="{x+60:.0f}" cy="{y-20-k*6:.0f}" rx="18" ry="9" fill="#4E7B40" transform="rotate({c.rnd(-40,40):.0f} {x+60:.0f} {y-20-k*6:.0f})"/>')
    lemon(c, 860, 1080, 70, -10)
    lemon(c, 780, 1130, 60, 160)
    c.add(f'<text x="60" y="{H-60}" font-family="Georgia, serif" font-style="italic" font-size="30" fill="#2C2118" opacity="0.55">Founder photo — replace /public/about/founder.jpg</text>')
    c.add(f'<rect width="{W}" height="{H}" filter="url(#grain)"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{defs("#E9E2D3", "#D6CAB4")}{"".join(c.parts)}</svg>'


def render(page, svg, out, quality=84):
    page.set_content(f'<html><body style="margin:0">{svg}</body></html>')
    png = page.screenshot(clip={"x": 0, "y": 0, "width": W, "height": H}, type="png")
    img = Image.open(BytesIO(png)).convert("RGB")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    print("wrote", os.path.relpath(out, ROOT), os.path.getsize(out) // 1024, "KB")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for i, slug in enumerate(MEALS):
            render(page, meal_svg(slug, seed=i + 3), os.path.join(ROOT, "public/food", f"{slug}.jpg"))
        render(page, meal_svg("seared-chicken-brown-rice", seed=99), os.path.join(ROOT, "public/food/placeholder.jpg"))
        render(page, hero_svg(), os.path.join(ROOT, "public/food/hero.jpg"))
        render(page, founder_svg(), os.path.join(ROOT, "public/about/founder.jpg"))
        browser.close()


if __name__ == "__main__":
    main()
