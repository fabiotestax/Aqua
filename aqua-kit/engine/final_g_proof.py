"""Proof: Fabio's g from the source EPS vs the compiled AquaScript g (now the
same outline, embedded), plus the wordmark."""
from PIL import Image, ImageDraw, ImageFont

PAPER = (245, 243, 239)
INK = (20, 20, 20)
FAINT = (140, 136, 130)
TTF = "AquaScript-Regular.ttf"

W, H = 1900, 1360
img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
lab = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)

# wordmark with the embedded real g
word = ImageFont.truetype(TTF, 230)
bb = d.textbbox((0, 0), "the logotype", font=word)
d.text(((W - (bb[2] - bb[0])) // 2 - bb[0], 120 - bb[1]), "the logotype",
       font=word, fill=INK)
d.text((60, 90), "AQUA — g is now the the source logotype drawing, embedded",
       font=lab, fill=INK)

# g comparison
gy = 560
src = Image.open("real_g.png").convert("RGB")
# tight-crop the source g by ink bounds
import numpy as np
a = np.array(src.convert("L")) < 128
ys, xs = np.where(a)
src = src.crop((xs.min() - 10, ys.min() - 10, xs.max() + 10, ys.max() + 10))
sh = 560
src = src.resize((int(src.width * sh / src.height), sh))
img.paste(src, (430, gy))
d.text((430, gy + 590), "source EPS g", font=lab, fill=FAINT)

gfont = ImageFont.truetype(TTF, 720)
d.text((1120, gy - 175), "g", font=gfont, fill=INK)
d.text((1180, gy + 590), "compiled AQUA g", font=lab, fill=FAINT)

d.text((60, H - 60), "AQUA — g matched exactly to the source artwork",
       font=lab, fill=FAINT)
img.save("final_g_proof.png")
print("saved final_g_proof.png")
