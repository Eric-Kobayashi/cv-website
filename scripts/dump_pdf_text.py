from pathlib import Path
import sys
from pypdf import PdfReader


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: dump_pdf_text.py <pdf> <out.txt>", file=sys.stderr)
        return 2
    pdf = Path(sys.argv[1])
    out = Path(sys.argv[2])
    reader = PdfReader(str(pdf))
    chunks = []
    for page in reader.pages:
        text = page.extract_text() or ""
        chunks.append(text)
    out.write_text("\n\n".join(chunks))
    print(f"Wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

