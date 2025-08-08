from __future__ import annotations

import json
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    json_path = root / "site-data.json"
    out_path = root / "assets" / "js" / "site-data.js"
    data = json.loads(json_path.read_text(encoding="utf-8"))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out = "// Generated from site-data.json\nwindow.SITE_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    out_path.write_text(out, encoding="utf-8")
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

