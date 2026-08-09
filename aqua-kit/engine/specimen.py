"""
Stage-0 survival specimen: render the compiled AquaScript TTF as the
the logotype wordmark, on the studio paper colour. This proves the crisp
substance (aquascript.py -> pathops -> fontTools -> TTF) survived the move.
"""
from PIL import Image, ImageDraw, ImageFont

PAPER = (245, 243, 239)   # #f5f3ef — the studio paper
INK = (20, 20, 20)        # #141414
FAINT = (150, 146, 140)

TTF = "AquaScript-Regular.ttf"
WORD = "the logotype"

W, H = 1760, 620
img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)

big = ImageFont.truetype(TTF, 300)
small = ImageFont.truetype(TTF, 90)
# labels use a default face; the point is the wordmark, not the caption
try:
    label = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    label_i = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf", 20)
except OSError:
    label = ImageFont.load_default()
    label_i = label

# main wordmark, optically centred
bbox = d.textbbox((0, 0), WORD, font=big)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (W - tw) / 2 - bbox[0]
y = 200 - bbox[1]
d.text((x, y), WORD, font=big, fill=INK)

# a second, smaller cut to show the fit holds at text size
bbox2 = d.textbbox((0, 0), WORD, font=small)
d.text(((W - (bbox2[2] - bbox2[0])) / 2 - bbox2[0], 490 - bbox2[1]),
       WORD, font=small, fill=INK)

# quiet studio caption
d.text((60, 40), "AQUA — AquaScript Regular v1.1", font=label, fill=INK)
d.text((60, 70), "g repair · double-storey, crisp first · compiled TTF",
       font=label_i, fill=FAINT)
d.text((W - 240, 40), "specimen: the logotype", font=label_i, fill=FAINT)

img.save("specimen_stage0.png")
print("saved specimen_stage0.png")
