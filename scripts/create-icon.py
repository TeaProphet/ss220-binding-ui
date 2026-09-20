from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math

root = Path(__file__).resolve().parents[1]
out = root / 'public' / 'binding-deck.ico'
font_path = r'C:\Windows\Fonts\arialbd.ttf'

def make(size):
    scale = size / 256
    image = Image.new('RGBA', (size, size), '#10182c')
    draw = ImageDraw.Draw(image)
    stars = [(28, 36, 2), (60, 18, 1), (104, 36, 1), (194, 29, 2), (228, 58, 1), (18, 139, 1), (237, 160, 2), (52, 220, 1), (204, 223, 1)]
    for x, y, radius in stars:
        draw.ellipse(((x-radius)*scale, (y-radius)*scale, (x+radius)*scale, (y+radius)*scale), fill='#ffffff')
    red = '#e63b3b'
    draw.line((35*scale, 76*scale, 221*scale, 76*scale), fill=red, width=max(1, round(6*scale)))
    draw.line((35*scale, 180*scale, 221*scale, 180*scale), fill=red, width=max(1, round(6*scale)))
    box = (25*scale, 128*scale, 231*scale, 128*scale)
    draw.arc((25*scale, 72*scale, 231*scale, 184*scale), 338, 202, fill=red, width=max(1, round(3*scale)))
    draw.ellipse((202*scale, 65*scale, 226*scale, 89*scale), fill='#f0783c', outline='#ffb15c', width=max(1, round(2*scale)))
    font = ImageFont.truetype(font_path, round(112*scale))
    text = '14'
    bounds = draw.textbbox((0, 0), text, font=font, stroke_width=max(1, round(2*scale)))
    x = (size - (bounds[2] - bounds[0])) // 2 - bounds[0]
    y = 84*scale - bounds[1]
    draw.text((x, y), text, font=font, fill='#ffffff', stroke_width=max(1, round(3*scale)), stroke_fill=red)
    return image

images = [make(size) for size in (16, 32, 48, 64, 128, 256)]
images[-1].save(out, format='ICO', sizes=[(image.width, image.height) for image in images])
print(out)
