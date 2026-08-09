"""Reference comparison for the repaired g: reference wordmark vs AquaScript,
plus the isolated g beside the high-zoom reference g."""
from PIL import Image, ImageDraw, ImageFont

PAPER = (245, 243, 239)
INK = (20, 20, 20)
FAINT = (140, 136, 130)
TTF = "AquaScript-Regular.ttf"

W, H = 1900, 1360
img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)
lab = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)

# reference wordmark
ref = Image.open("../refs/the logotype-reference.png").convert("RGB")
rw = 1120
ref = ref.resize((rw, int(ref.height * rw / ref.width)))
img.paste(ref, ((W - rw) // 2, 70))
d.text((60, 80), "REFERENCE", font=lab, fill=INK)

# AquaScript wordmark
word = ImageFont.truetype(TTF, 230)
bb = d.textbbox((0, 0), "the logotype", font=word)
d.text(((W - (bb[2] - bb[0])) // 2 - bb[0], 470 - bb[1]), "the logotype",
       font=word, fill=INK)
d.text((60, 430), "AQUA — repaired g", font=lab, fill=INK)

# isolated g comparison — crop the g straight from the reference wordmark
gy = 820
src = Image.open("../refs/the logotype-reference.png").convert("RGB")
zoom = src.crop((int(src.width * 0.63), int(src.height * 0.05),
                 int(src.width * 0.735), src.height))
zs = 420 / zoom.height
zoom = zoom.resize((int(zoom.width * zs), int(zoom.height * zs)), Image.LANCZOS)
img.paste(zoom, (360, gy))
d.text((330, gy + 440), "reference g", font=lab, fill=FAINT)

gfont = ImageFont.truetype(TTF, 560)
d.text((1050, gy - 120), "g", font=gfont, fill=INK)
d.text((1130, gy + 440), "AQUA g", font=lab, fill=FAINT)

d.text((60, H - 60), "AQUA — g repaired to the reference, proofed side by side",
       font=lab, fill=FAINT)
img.save("final_g_proof.png")
print("saved final_g_proof.png")
