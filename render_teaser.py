SVG = r'''<svg width="1080" height="1120" viewBox="0 0 1080 1120" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="1080" height="1120" fill="#0B0B12"/>
<rect x="0" y="0" width="1080" height="6" fill="#7C3AED"/>
<text x="540" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#F5F5FA" letter-spacing="10">REVORA</text>
<text x="540" y="166" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#9A9AAD" letter-spacing="6">SALES INTELLIGENCE B2B</text>
<rect x="430" y="200" width="220" height="2" fill="#262633"/>
<text x="540" y="304" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#00D4AA" letter-spacing="4">RESULTAT - MISSION SOSCARDME</text>
<text x="540" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="185" font-weight="bold"><tspan fill="#00D4AA">9</tspan><tspan fill="#F5F5FA"> RDV</tspan></text>
<text x="540" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" fill="#9A9AAD">sur 100 appels passes</text>
<rect x="160" y="632" width="760" height="84" rx="16" fill="#15151F" stroke="#262633" stroke-width="1.5"/>
<text x="540" y="685" text-anchor="middle" font-family="Arial, sans-serif" font-size="29"><tspan fill="#F5F5FA" font-weight="bold">9 % de conversion</tspan><tspan fill="#9A9AAD">   -   cold call moyen : 1-3 %</tspan></text>
<rect x="160" y="766" width="760" height="272" rx="24" fill="#15151F" stroke="#262633" stroke-width="1.5"/>
<text x="200" y="818" font-family="Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4AA" letter-spacing="2">APERCU D'UN BRIEF</text>
<rect x="700" y="788" width="180" height="46" rx="10" fill="#0E2A24"/>
<text x="790" y="819" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" font-weight="bold" fill="#00D4AA">GO - 82</text>
<text x="200" y="884" font-family="Arial, sans-serif" font-size="21" fill="#9A9AAD">Fit titre</text>
<rect x="360" y="868" width="440" height="16" rx="8" fill="#262633"/>
<rect x="360" y="868" width="396" height="16" rx="8" fill="#00D4AA"/>
<text x="820" y="884" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#F5F5FA">9/10</text>
<text x="200" y="938" font-family="Arial, sans-serif" font-size="21" fill="#9A9AAD">Fit secteur</text>
<rect x="360" y="922" width="440" height="16" rx="8" fill="#262633"/>
<rect x="360" y="922" width="352" height="16" rx="8" fill="#00D4AA"/>
<text x="820" y="938" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#F5F5FA">8/10</text>
<text x="200" y="992" font-family="Arial, sans-serif" font-size="21" fill="#9A9AAD">Fit probleme</text>
<rect x="360" y="976" width="440" height="16" rx="8" fill="#262633"/>
<rect x="360" y="976" width="308" height="16" rx="8" fill="#F5A623"/>
<text x="820" y="992" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#F5F5FA">7/10</text>
<text x="540" y="1090" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#6B6B7E" letter-spacing="2">revora-sales.vercel.app</text>
</svg>'''

import os
out = os.path.join(os.path.expanduser("~"), "Desktop", "REVORA_teaser.png")

def try_cairosvg():
    import cairosvg
    cairosvg.svg2png(bytestring=SVG.encode("utf-8"), write_to=out, output_width=1080, output_height=1120)
    return "cairosvg"

def try_svglib():
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPM
    import io
    svgfile = os.path.join(os.path.expanduser("~"), "Desktop", "REVORA_teaser.svg")
    with open(svgfile, "w", encoding="utf-8") as f:
        f.write(SVG)
    drawing = svg2rlg(svgfile)
    renderPM.drawToFile(drawing, out, fmt="PNG")
    return "svglib"

for fn in (try_cairosvg, try_svglib):
    try:
        engine = fn()
        print(f"OK ({engine}) -> {out}")
        break
    except Exception as e:
        print(f"{fn.__name__} failed: {e}")
