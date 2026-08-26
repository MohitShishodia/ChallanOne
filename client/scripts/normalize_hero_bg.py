from PIL import Image

src = "/Users/mohitshishodia/.qoder/vibe_images/rc_hero_car_1787684693.png"
dst = "/Users/mohitshishodia/E-challan/ChallanOne/client/public/rc_hero_car.png"

im = Image.open(src).convert("RGBA")
w, h = im.size
px = im.load()

corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
print("corner samples:", corners, "avg bg:", bg)

LO, HI = 14.0, 30.0
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
        if d <= LO:
            px[x, y] = (r, g, b, 0)
        elif d < HI:
            t = (d - LO) / (HI - LO)
            px[x, y] = (r, g, b, int(255 * t))

im.save(dst)
print("saved", dst, im.size)
