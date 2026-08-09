"""
g-repair proof. Rebuild the double-storey g so it reads like the the logotype
reference FIRST, liquid second. Render two crack levels for Fabio to choose:

  A — connected link, ear tucked at the shoulder, one soft droplet on the tail
  B — the signature liquid move: link rendered as a hairline CRACK (loop drops
      just clear of the eye), same tucked ear + droplet

Both render "the logotype" crisp (compiled TTF) and a big isolated g beside the
reference g. No floaters.
"""
import os, tempfile
import aquascript as aq
from PIL import Image, ImageDraw, ImageFont

XH, H = aq.XH, aq.H  # 540, 48


def sub(ops, cap="butt", drops=()):
    return dict(ops=ops, cap=cap, drops=list(drops))


def _eye(cx=185, cy=372, r=128):
    """Closed upper bowl (the eye)."""
    k = 0.5523 * r
    return sub([("m", (cx, cy + r)),
                ("c", (cx + k, cy + r), (cx + r, cy + k), (cx + r, cy)),
                ("c", (cx + r, cy - k), (cx + k, cy - r), (cx, cy - r)),
                ("c", (cx - k, cy - r), (cx - r, cy - k), (cx - r, cy)),
                ("c", (cx - r, cy + k), (cx - k, cy + r), (cx, cy + r)),
                ("z",)])


def _ear():
    """Small soft ear tucked at the top-right shoulder, attached (no floater)."""
    return sub([("m", (298, 448)), ("c", (338, 456), (350, 438), (344, 414))],
               cap="round")


def _loop(link_top):
    """Open-tail lower loop. Central link at the top; only link_top varies
    (how far the loop drops below the eye => connected vs hairline crack)."""
    return sub([("m", (185, link_top)),
                ("c", (110, link_top - 6), (42, 46), (48, -40)),
                ("c", (56, -114), (122, -154), (200, -152)),
                ("c", (282, -150), (332, -92), (330, -4)),
                ("c", (328, 52), (316, 84), (292, 98))],
               drops=[(292, 98, H + 4)])


def g_variant_A():
    # connected link: loop top rides up under the eye and merges
    return [_eye(), _ear(), _loop(214)]


def g_variant_B():
    # hairline crack at the link: loop drops just clear of the eye bottom
    return [_eye(), _ear(), _loop(120)]


def build_font(g_subpaths, path_out):
    orig = aq.skeletons

    def patched():
        s = orig()
        s["g"] = g_subpaths
        return s

    aq.skeletons = patched
    try:
        aq.build(path_out)
    finally:
        aq.skeletons = orig


# ------------------------------------------------------------------- compose
PAPER = (245, 243, 239)
INK = (20, 20, 20)
FAINT = (140, 136, 130)
tmp = tempfile.mkdtemp()

fa = os.path.join(tmp, "A.ttf")
fb = os.path.join(tmp, "B.ttf")
build_font(g_variant_A(), fa)
build_font(g_variant_B(), fb)

WORD = "the logotype"
W, Hpx = 1900, 1500
img = Image.new("RGB", (W, Hpx), PAPER)
d = ImageDraw.Draw(img)
try:
    lab = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 26)
except OSError:
    lab = ImageFont.load_default()

# reference wordmark on top
ref = Image.open("../refs/the logotype-reference.png").convert("RGB")
rw = 1100
ref = ref.resize((rw, int(ref.height * rw / ref.width)))
img.paste(ref, ((W - rw) // 2, 60))
d.text((60, 70), "REFERENCE", font=lab, fill=INK)

wf = ImageFont.truetype(fa, 210)
wf2 = ImageFont.truetype(fb, 210)


def center_word(font, y, label):
    bb = d.textbbox((0, 0), WORD, font=font)
    x = (W - (bb[2] - bb[0])) // 2 - bb[0]
    d.text((x, y - bb[1]), WORD, font=font, fill=INK)
    d.text((60, y + 40), label, font=lab, fill=INK)


center_word(wf, 380, "A · connected link (whisper)")
center_word(wf2, 640, "B · hairline crack at the link (signature)")

# big isolated g row: reference g crop | A | B
gy = 940
# ref-g crop (the g sits ~0.60-0.73 across the reference wordmark)
gref = ref.crop((int(rw * 0.585), int(ref.height * 0.05),
                 int(rw * 0.735), ref.height))
gref = gref.resize((int(gref.width * 2.2), int(gref.height * 2.2)))
img.paste(gref, (150, gy - 60))
d.text((170, gy + 430), "reference g", font=lab, fill=FAINT)

gA = ImageFont.truetype(fa, 460)
gB = ImageFont.truetype(fb, 460)
d.text((760, gy - 150), "g", font=gA, fill=INK)
d.text((760, gy + 420), "A", font=lab, fill=FAINT)
d.text((1200, gy - 150), "g", font=gB, fill=INK)
d.text((1200, gy + 420), "B", font=lab, fill=FAINT)

d.text((60, Hpx - 60), "AQUA — g repair, proofed against reference", font=lab, fill=FAINT)
img.save("proof_g.png")
print("saved proof_g.png")
