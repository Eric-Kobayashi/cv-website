import sys
from pathlib import Path

try:
    import cairosvg  # type: ignore
except Exception as exc:  # pragma: no cover
    print("cairosvg is required. Run: uv pip install cairosvg", file=sys.stderr)
    raise

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "img" / "volcano.svg"
OUT = ROOT / "assets" / "img"

SIZES = [48, 96, 128, 180, 192, 256]

def render_png(size: int) -> None:
    png_path = OUT / f"favicon-{size}.png"
    cairosvg.svg2png(url=str(SRC), write_to=str(png_path), output_width=size, output_height=size, background_color='white')

def main() -> None:
    if not SRC.exists():
        print(f"Missing source SVG: {SRC}", file=sys.stderr)
        sys.exit(1)
    OUT.mkdir(parents=True, exist_ok=True)
    for s in SIZES:
        render_png(s)
    # iOS apple-touch-icon
    touch = OUT / "apple-touch-icon.png"
    cairosvg.svg2png(url=str(SRC), write_to=str(touch), output_width=180, output_height=180, background_color='white')
    print("Favicons built:", [f"favicon-{s}.png" for s in SIZES], "+ apple-touch-icon.png")

if __name__ == "__main__":
    main()

