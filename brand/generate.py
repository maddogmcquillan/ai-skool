"""Render Learn AI brand assets (covers, icons, logo, banners) with headless Chrome.

Usage: python3 generate.py <out_dir>
Fonts are read from ./fonts next to this script.
"""
import os, sys, subprocess, textwrap, json
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out"))
CHROME = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
os.makedirs(OUT, exist_ok=True)

FONTS = os.path.join(HERE, "fonts")
def font_face(fam, w):
    p = os.path.join(FONTS, f"{fam}-{w}.woff2")
    return f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{p}') format('woff2');}}" if os.path.exists(p) else ""
FONT_CSS = "".join(font_face("Outfit", w) for w in (500, 700, 800)) + "".join(font_face("Manrope", w) for w in (400, 500, 600, 700))

# ---- Brand tokens ----
NAVY = "#0B1220"       # ground
NAVY2 = "#111C33"      # ground, lighter
INK = "#F4F7FF"        # text on navy
MUTED = "#9FB0D0"
BLUE = "#3B7BFF"       # primary / brand color
SPARK = "#FFC245"      # highlight
MINT = "#4FD1B3"       # projects
CORAL = "#FF7A59"      # show and tell
VIOLET = "#9B7BFF"     # parent hub / coach

# Per-space accent + short subtitle
SPACES = {
    "welcome":        dict(title="Welcome", sub="Start here. How Learn AI works and how to get the most out of it.", accent=BLUE, glyph="door"),
    "ask-coach":      dict(title="Ask Coach", sub="Stuck on a lesson? Ask. Coach replies in minutes, a human reads every thread.", accent=VIOLET, glyph="chat"),
    "course-requests":dict(title="Course Requests", sub="Tell us what to build next. Likes are votes.", accent=SPARK, glyph="bulb"),
    "parent-hub":     dict(title="Parent Hub", sub="How this community is run, and how to help at home.", accent=MINT, glyph="shield"),
    "classroom":      dict(title="Classroom", sub="Beginner AI. Intermediate AI. Then make real things with AI.", accent=BLUE, glyph="cap"),
    "show-and-tell":  dict(title="Show and Tell", sub="Share what you built. Screenshots, links, demos.", accent=CORAL, glyph="frame"),
    "live-sessions":  dict(title="Live Sessions", sub="Weekly build-along and Q&A calls.", accent=SPARK, glyph="live"),
}
POSTS = {
    "start-here":         dict(title="Start here", sub="Three steps to your first project", accent=BLUE),
    "how-to-ask":         dict(title="How to ask a question", sub="One question per post. Coach answers in minutes.", accent=VIOLET),
    "course-requests-how":dict(title="How course requests work", sub="Post an idea. Like to vote. We build the winners.", accent=SPARK),
    "for-parents":        dict(title="For parents and guardians", sub="How this community is run", accent=MINT),
}

# Simple, consistent glyphs drawn with strokes (viewBox 0 0 100 100)
GLYPHS = {
    "door":  '<path d="M30 20h40v60H30z"/><circle cx="58" cy="50" r="3" fill="{c}" stroke="none"/><path d="M20 80h60"/>',
    "chat":  '<path d="M22 28h56v34H44l-14 12V62h-8z"/><path d="M68 18l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="{c}" stroke="none"/>',
    "bulb":  '<path d="M50 18a20 20 0 0 1 11 36c-3 3-4 6-4 9H43c0-3-1-6-4-9a20 20 0 0 1 11-36z"/><path d="M42 72h16M45 80h10"/>',
    "shield":'<path d="M50 16l26 9v22c0 16-11 28-26 35C35 75 24 63 24 47V25z"/><path d="M40 48l7 7 14-15"/>',
    "cap":   '<path d="M50 24 18 40l32 16 32-16z"/><path d="M32 47v16c0 5 8 10 18 10s18-5 18-10V47"/><path d="M78 40v18"/>',
    "frame": '<rect x="20" y="24" width="60" height="48" rx="3"/><path d="M26 66l16-18 12 12 8-8 12 14"/><circle cx="64" cy="38" r="4" fill="{c}" stroke="none"/>',
    "live":  '<circle cx="50" cy="50" r="26"/><path d="M44 38l18 12-18 12z" fill="{c}" stroke="none"/><path d="M22 30a34 34 0 0 0 0 40M78 30a34 34 0 0 1 0 40"/>',
    "spark": '<path d="M50 14l8 22 22 8-22 8-8 22-8-22-22-8 22-8z" fill="{c}" stroke="none"/>',
}

def nodes_svg(w, h, accent, seed=7, count=14, opacity=0.9):
    """A subtle constellation: nodes connected along a rising path."""
    import random
    r = random.Random(seed)
    pts = []
    for i in range(count):
        x = int(w * (0.55 + 0.45 * i / (count - 1)) - r.randint(0, int(w * 0.08)))
        y = int(h * (0.85 - 0.7 * i / (count - 1)) + r.randint(-int(h * 0.12), int(h * 0.12)))
        pts.append((x, y))
    lines = "".join(f'<line x1="{pts[i][0]}" y1="{pts[i][1]}" x2="{pts[i+1][0]}" y2="{pts[i+1][1]}"/>' for i in range(len(pts) - 1))
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="{4 if i % 3 else 7}" fill="{accent if i % 3 == 0 else INK}"/>' for i, (x, y) in enumerate(pts))
    return f'<svg style="position:absolute;inset:0" width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none"><g stroke="{accent}" stroke-opacity=".35" stroke-width="2">{lines}</g><g opacity="{opacity}">{dots}</g></svg>'

def page(w, h, body, extra_css=""):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
{FONT_CSS}
html,body{{margin:0;padding:0;width:{w}px;height:{h}px;overflow:hidden;background:transparent}}
.ground{{position:relative;width:{w}px;height:{h}px;background:radial-gradient(1200px 600px at 20% 10%,{NAVY2},{NAVY} 70%);color:{INK};font-family:'Manrope',system-ui,sans-serif;overflow:hidden}}
.title{{font-family:'Outfit',system-ui,sans-serif;font-weight:800;letter-spacing:-0.02em;line-height:1}}
.sub{{font-weight:500;color:{MUTED}}}
.chip{{display:inline-flex;align-items:center;gap:10px;font-family:'Outfit';font-weight:700;letter-spacing:.14em;text-transform:uppercase}}
{extra_css}
</style></head><body>{body}</body></html>"""

def render(name, w, h, html, transparent=False):
    path_html = os.path.join(OUT, f"{name}.html")
    path_png = os.path.join(OUT, f"{name}.png")
    open(path_html, "w").write(html)
    args = [CHROME, "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
            f"--window-size={w},{h}", f"--screenshot={path_png}"]
    if transparent:
        args.append("--default-background-color=00000000")
    subprocess.run(args + [f"file://{path_html}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(path_html)
    return path_png

def glyph_svg(kind, accent, size, stroke=INK, sw=5):
    return f'<svg width="{size}" height="{size}" viewBox="0 0 100 100" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{GLYPHS[kind].format(c=accent)}</svg>'

def wordmark(size, color=INK, spark=SPARK):
    """'Learn AI' with a spark on the dot of the i."""
    return f'''<div style="display:flex;align-items:center;gap:{int(size*0.22)}px">
      <div style="width:{size*1.15}px;height:{size*1.15}px;border-radius:{int(size*0.3)}px;background:{BLUE};display:flex;align-items:center;justify-content:center">{glyph_svg("spark", spark, int(size*0.78), stroke="none")}</div>
      <div class="title" style="font-size:{size}px;color:{color}">Learn <span style="color:{BLUE}">AI</span></div></div>'''

# ---- Space covers 1600x500 ----
for slug, s in SPACES.items():
    body = f'''<div class="ground">{nodes_svg(1600,500,s["accent"],seed=hash(slug)%1000)}
    <div style="position:absolute;left:80px;top:0;height:500px;display:flex;flex-direction:column;justify-content:center;gap:22px;max-width:980px">
      <div class="chip" style="color:{s["accent"]};font-size:20px">{glyph_svg(s["glyph"], s["accent"], 34)} Learn AI</div>
      <div class="title" style="font-size:104px">{s["title"]}</div>
      <div class="sub" style="font-size:30px;max-width:900px">{s["sub"]}</div>
    </div>
    <div style="position:absolute;left:0;bottom:0;width:1600px;height:8px;background:linear-gradient(90deg,{s["accent"]},{BLUE})"></div></div>'''
    render(f"cover-{slug}", 1600, 500, page(1600, 500, body))
    # mobile thumbnail 800x450
    body = f'''<div class="ground" style="width:800px;height:450px">{nodes_svg(800,450,s["accent"],seed=hash(slug)%1000,count=10)}
    <div style="position:absolute;left:52px;top:0;height:450px;display:flex;flex-direction:column;justify-content:center;gap:18px;max-width:600px">
      <div class="chip" style="color:{s["accent"]};font-size:16px">{glyph_svg(s["glyph"], s["accent"], 28)} Learn AI</div>
      <div class="title" style="font-size:68px">{s["title"]}</div>
      <div class="sub" style="font-size:22px">{s["sub"]}</div></div>
    <div style="position:absolute;left:0;bottom:0;width:800px;height:7px;background:linear-gradient(90deg,{s["accent"]},{BLUE})"></div></div>'''
    render(f"thumb-{slug}", 800, 450, page(800, 450, body))
    # icon 280x280
    body = f'''<div style="width:280px;height:280px;border-radius:64px;background:linear-gradient(160deg,{NAVY2},{NAVY});display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(200px 200px at 30% 15%,{s["accent"]}55,transparent 70%)"></div>
      {glyph_svg(s["glyph"], s["accent"], 176, sw=6)}</div>'''
    render(f"icon-{slug}", 280, 280, page(280, 280, body), transparent=True)

# ---- Pinned post covers 1200x630 ----
for key, p in POSTS.items():
    body = f'''<div class="ground" style="width:1200px;height:630px">{nodes_svg(1200,630,p["accent"],seed=hash(key)%1000,count=12)}
    <div style="position:absolute;left:72px;top:0;height:630px;display:flex;flex-direction:column;justify-content:center;gap:24px;max-width:760px">
      <div class="chip" style="color:{p["accent"]};font-size:18px">Learn AI</div>
      <div class="title" style="font-size:88px">{p["title"]}</div>
      <div class="sub" style="font-size:30px">{p["sub"]}</div></div>
    <div style="position:absolute;left:0;bottom:0;width:1200px;height:8px;background:linear-gradient(90deg,{p["accent"]},{BLUE})"></div></div>'''
    render(f"post-{key}", 1200, 630, page(1200, 630, body))

# ---- Logo 960x240 (4:1) light-mode (dark text) and dark-mode (light text), transparent ----
for mode, color in (("dark", INK), ("light", "#0B1220")):
    body = f'<div style="width:960px;height:240px;display:flex;align-items:center;padding-left:24px">{wordmark(132, color=color)}</div>'
    render(f"logo-{mode}", 960, 240, page(960, 240, body), transparent=True)
# community icon 128x128 (renders at 4x of 32)
body = f'<div style="width:128px;height:128px;border-radius:34px;background:{BLUE};display:flex;align-items:center;justify-content:center">{glyph_svg("spark", SPARK, 92, stroke="none")}</div>'
render("community-icon", 128, 128, page(128, 128, body), transparent=True)

# ---- Course directory banner 1279x680 and OG image 1200x630 ----
# Circle shows this image on the RIGHT half of the directory banner, next to a white text
# column (title, description, button typed into Circle), and crops it to fit. So: no headline in
# the image, and everything important inside the middle 80% of the width.
def chip(label, accent, x, y, rot):
    return (f'<div style="position:absolute;left:{x}px;top:{y}px;transform:rotate({rot}deg);padding:12px 22px;border-radius:999px;'
            f'background:{NAVY2};border:2px solid {accent};color:{INK};font-family:Outfit;font-weight:700;'
            f'font-size:22px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap">{label}</div>')
chips = "".join([
    chip("Make a game", MINT, 300, 150, -6), chip("Make an app", BLUE, 760, 130, 5),
    chip("Make a website", SPARK, 250, 480, 4), chip("Make a chatbot", VIOLET, 790, 470, -5),
    chip("Make music", CORAL, 180, 315, -3), chip("Make AI art", MINT, 870, 300, 3),
])
body = f'''<div class="ground" style="width:1279px;height:680px">{nodes_svg(1279,680,BLUE,seed=42,count=16)}
  <div style="position:absolute;left:0;top:0;width:1279px;height:680px;display:flex;align-items:center;justify-content:center">
    <div style="width:230px;height:230px;border-radius:64px;background:{BLUE};box-shadow:0 30px 80px rgba(59,123,255,.45);display:flex;align-items:center;justify-content:center">{glyph_svg("spark", SPARK, 170, stroke="none")}</div></div>
  {chips}
  <div style="position:absolute;left:0;bottom:0;width:1279px;height:8px;background:linear-gradient(90deg,{SPARK},{BLUE},{MINT})"></div></div>'''
render("course-directory-banner", 1279, 680, page(1279, 680, body))
body = f'''<div class="ground" style="width:1200px;height:630px">{nodes_svg(1200,630,BLUE,seed=42,count=14)}
  <div style="position:absolute;left:72px;top:0;height:630px;display:flex;flex-direction:column;justify-content:center;gap:24px;max-width:820px">
    {wordmark(40)}
    <div class="title" style="font-size:84px;margin-top:10px">The after-school AI<br>program for ages 11 to 17</div>
    <div class="sub" style="font-size:28px">Video lessons, real projects, a safe community, and a coach that answers in minutes.</div></div>
  <div style="position:absolute;left:0;bottom:0;width:1200px;height:8px;background:linear-gradient(90deg,{SPARK},{BLUE},{MINT})"></div></div>'''
render("og-image", 1200, 630, page(1200, 630, body))

# ---- Paywall checkout cover, Circle recommends 540x303; rendered at 2x for sharp text ----
# Copy mirrors the ad landing pages: the headline parents tapped on, the three heavy hitters, the
# founding cap. Text fills the frame; the constellation is pushed to a narrow strip on the right.
body = f'''<div class="ground" style="width:1080px;height:606px"><div style="position:absolute;left:800px;top:0;width:280px;height:606px;opacity:.5">{nodes_svg(280,606,BLUE,seed=42,count=8)}</div>
  <div style="position:absolute;left:56px;top:0;height:606px;display:flex;flex-direction:column;justify-content:center;gap:22px;max-width:960px">
    <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">{wordmark(34)}<div class="chip" style="font-size:17px;color:{NAVY};background:{SPARK};padding:9px 16px;border-radius:999px;letter-spacing:.1em">Founding rate · first 200 families</div></div>
    <div class="title" style="font-size:88px;line-height:1.02;margin-top:4px">Kids don't learn this<br>in school.</div>
    <div class="sub" style="font-size:30px;line-height:1.35;max-width:900px;color:{INK}">Real instructors. New classes every week. A coach that answers in minutes. Ages 11 to 17.</div>
    <div class="sub" style="font-size:24px;color:{SPARK};font-weight:700">$49/month, locked in for life. Cancel anytime.</div></div>
  <div style="position:absolute;left:0;bottom:0;width:1080px;height:8px;background:linear-gradient(90deg,{SPARK},{BLUE},{MINT})"></div></div>'''
render("checkout-cover", 1080, 606, page(1080, 606, body))

# ---- Facebook Page profile (1024x1024, shown as a circle) and cover (1640x624, centre-safe) ----
body = f'''<div style="width:1024px;height:1024px;background:{BLUE};display:flex;align-items:center;justify-content:center">{glyph_svg("spark", SPARK, 640, stroke="none")}</div>'''
render("fb-profile", 1024, 1024, page(1024, 1024, body))
body = f'''<div class="ground" style="width:1640px;height:624px"><div style="position:absolute;left:1100px;top:0;width:540px;height:624px">{nodes_svg(540,624,BLUE,seed=42,count=10)}</div>
  <div style="position:absolute;left:0;top:0;width:1640px;height:624px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center">
    {wordmark(40)}
    <div class="title" style="font-size:78px;margin-top:8px">AI classes for ages 11 to 17.</div>
    <div class="sub" style="font-size:28px;max-width:900px">17 video classes, real projects, a coach that answers in minutes, and a community parents can trust.</div>
    <div class="chip" style="font-size:20px;color:{SPARK};margin-top:6px">joinlearnai.com</div></div>
  <div style="position:absolute;left:0;bottom:0;width:1640px;height:8px;background:linear-gradient(90deg,{SPARK},{BLUE},{MINT})"></div></div>'''
render("fb-cover", 1640, 624, page(1640, 624, body))

# ---- Meta ad statics: three angles x three sizes (1:1, 4:5, 9:16). Text stays inside the
# middle 80% so feed crops and story UI never cover it. ----
AD_SIZES = {"1x1": (1080, 1080), "4x5": (1080, 1350), "9x16": (1080, 1920)}
PROJECTS = [("Make a game", MINT), ("Make an app", BLUE), ("Make a website", SPARK), ("Make a chatbot", VIOLET), ("Make an AI agent", CORAL),
            ("Make a video", BLUE), ("Make a cartoon", MINT), ("Make music", SPARK), ("Make AI art", VIOLET), ("Make a comic", CORAL)]

def ad_frame(w, h, inner, footer_price=True):
    pad = 88
    price = (f'<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:2px solid rgba(255,255,255,.14);padding-top:34px">'
             f'<div><div class="chip" style="font-size:20px;color:{SPARK}">Founding Member</div>'
             f'<div class="title" style="font-size:56px;margin-top:6px">$49<span style="font-size:26px;color:{MUTED};font-weight:600"> /month · cancel anytime</span></div></div>'
             f'<div style="background:{BLUE};color:#fff;font-family:Outfit;font-weight:800;font-size:28px;padding:22px 34px;border-radius:18px;white-space:nowrap">joinlearnai.com</div></div>') if footer_price else ""
    return f'''<div class="ground" style="width:{w}px;height:{h}px">
  <div style="position:absolute;left:{w-420}px;top:0;width:420px;height:{h}px;opacity:.55">{nodes_svg(420,h,BLUE,seed=7,count=10)}</div>
  <div style="position:absolute;inset:0;padding:{pad}px;display:flex;flex-direction:column;justify-content:space-between">
    <div>{wordmark(40)}</div>
    <div style="display:flex;flex-direction:column;gap:34px">{inner}</div>
    {price}
  </div>
  <div style="position:absolute;left:0;bottom:0;width:{w}px;height:10px;background:linear-gradient(90deg,{SPARK},{BLUE},{MINT})"></div></div>'''

def ad_list(w, h):
    chips = "".join(f'<span style="padding:16px 26px;border-radius:999px;border:3px solid {c};color:{INK};font-family:Outfit;font-weight:700;font-size:30px;letter-spacing:.06em;text-transform:uppercase;background:{NAVY2}">{t}</span>' for t, c in PROJECTS)
    inner = (f'<div class="title" style="font-size:{86 if h>1200 else 76}px">Your kid builds all ten.</div>'
             f'<div style="display:flex;flex-wrap:wrap;gap:16px;max-width:900px">{chips}</div>'
             f'<div class="sub" style="font-size:32px;max-width:860px">Online AI classes for ages 11 to 17. No coding needed. A coach answers in minutes.</div>')
    return ad_frame(w, h, inner)

def ad_path(w, h):
    col = lambda label, title, items, c: (f'<div style="flex:1;background:{NAVY2};border:2px solid rgba(255,255,255,.1);border-radius:24px;padding:28px">'
        f'<div class="chip" style="font-size:18px;color:{c}">{label}</div><div class="title" style="font-size:34px;margin-top:10px">{title}</div>'
        f'<div style="margin-top:14px;display:grid;gap:8px;color:{MUTED};font-size:22px;line-height:1.3">{"".join(f"<div>{i}</div>" for i in items)}</div></div>')
    cols = (col("Level 1", "How AI works", ["What is AI?", "Generative AI in a nutshell", "ChatGPT power user"], SPARK) +
            col("Level 2", "Prompts &amp; agents", ["LLMs explained", "The perfect prompt", "What are AI agents?", "Agent fundamentals"], MINT) +
            col("Level 3", "Make it", ["Game · App · Website", "Chatbot · AI agent", "Video · Cartoon · Music", "AI art · Comic"], VIOLET))
    direction = "column" if w == h else "column"
    inner = (f'<div class="title" style="font-size:{80 if h>1200 else 70}px">Seventeen classes, in the right order.</div>'
             f'<div style="display:flex;flex-direction:{"column" if h>1500 else "row"};gap:18px">{cols}</div>')
    return ad_frame(w, h, inner)

def ad_trust(w, h):
    facts = ["No private messaging between members", "An adult reads every question thread", "Parent consent at signup", "No personal details, ever"]
    rows = "".join(f'<div style="display:flex;gap:18px;align-items:flex-start;font-size:34px;line-height:1.25"><span style="flex:0 0 auto;width:44px;height:44px;border-radius:12px;background:{MINT};display:inline-grid;place-items:center;margin-top:2px"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span><span>{f}</span></div>' for f in facts)
    inner = (f'<div class="chip" style="font-size:22px;color:{MINT}">Built for parents to trust</div>'
             f'<div class="title" style="font-size:{82 if h>1200 else 72}px;margin-top:-10px">An AI program built around kids, not adapted to them.</div>'
             f'<div style="display:grid;gap:22px;max-width:880px">{rows}</div>')
    return ad_frame(w, h, inner)

for key, (w, h) in AD_SIZES.items():
    render(f"ad-list-{key}", w, h, page(w, h, ad_list(w, h)))
    render(f"ad-path-{key}", w, h, page(w, h, ad_path(w, h)))
    render(f"ad-trust-{key}", w, h, page(w, h, ad_trust(w, h)))

# ---- Feed / event welcome banner 1680x600 ----
body = f'''<div class="ground" style="width:1680px;height:600px">{nodes_svg(1680,600,SPARK,seed=9,count=16)}
  <div style="position:absolute;left:84px;top:0;height:600px;display:flex;flex-direction:column;justify-content:center;gap:24px;max-width:1000px">
    {wordmark(44)}
    <div class="title" style="font-size:96px;margin-top:10px">Welcome to Learn AI</div>
    <div class="sub" style="font-size:30px;max-width:900px">Start in the Classroom with Beginner AI. Ask Coach when you're stuck. Show off what you build.</div></div>
  <div style="position:absolute;left:0;bottom:0;width:1680px;height:8px;background:linear-gradient(90deg,{SPARK},{BLUE},{MINT})"></div></div>'''
render("welcome-banner", 1680, 600, page(1680, 600, body))

# ---- Lesson thumbnails 800x450, one per class ----
LESSONS = [
    ("Beginner AI", BLUE, ["What is AI?", "Generative AI in a Nutshell", "ChatGPT Power User in 30 Minutes"]),
    ("Intermediate AI", VIOLET, ["Large Language Models, Explained Briefly", "The Perfect ChatGPT Prompt Formula", "What are AI Agents?", "AI Agents Fundamentals in 21 Minutes"]),
    ("Project Classes", MINT, ["Make a Game", "Make an App", "Make a Website", "Make a Chatbot", "Make an AI Agent", "Make a Video", "Make a Cartoon", "Make Music", "Make AI Art", "Make a Comic"]),
]
import re as _re
n = 0
for section, accent, titles in LESSONS:
    for title in titles:
        n += 1
        slug = _re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        size = 64 if len(title) > 26 else 76
        body = f'''<div class="ground" style="width:800px;height:450px">{nodes_svg(800,450,accent,seed=100+n,count=9,opacity=.55)}
  <div class="title" style="position:absolute;right:36px;top:-30px;font-size:300px;color:{accent};opacity:.10;line-height:1">{n:02d}</div>
  <div style="position:absolute;left:48px;top:0;height:450px;display:flex;flex-direction:column;justify-content:center;gap:16px;max-width:640px">
    <div class="chip" style="color:{accent};font-size:16px">Class {n:02d} · {section}</div>
    <div class="title" style="font-size:{size}px">{title}</div>
    <div class="sub" style="font-size:18px">Learn AI Classroom</div></div>
  <div style="position:absolute;left:0;bottom:0;width:800px;height:7px;background:linear-gradient(90deg,{accent},{BLUE})"></div></div>'''
        render(f"lesson-{n:02d}-{slug}", 800, 450, page(800, 450, body))

# ---- Avatars 512x512 for the Coach bot and the Learn AI Team account ----
body = f'''<div style="width:512px;height:512px;background:linear-gradient(160deg,{VIOLET},#5B3FC7);display:flex;align-items:center;justify-content:center;position:relative">
  {glyph_svg("chat", SPARK, 330, sw=5)}</div>'''
render("avatar-coach", 512, 512, page(512, 512, body))
body = f'''<div style="width:512px;height:512px;background:{BLUE};display:flex;align-items:center;justify-content:center">{glyph_svg("spark", SPARK, 360, stroke="none")}</div>'''
render("avatar-team", 512, 512, page(512, 512, body))

print(json.dumps({"out": OUT, "files": sorted(os.listdir(OUT))}, indent=1))
