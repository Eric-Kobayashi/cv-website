from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


OG_IMAGE_RE = re.compile(
    r"<meta[^>]+(?:property=\"og:image(:secure_url)?\"|name=\"twitter:image\")[^>]+content=\"([^\"]+)\"",
    re.IGNORECASE,
)


def fetch_text(url: str, *, timeout: float = 20.0) -> str:
    header_variants = [
        {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    ]
    last_exc: Exception | None = None
    for headers in header_variants:
        try:
            req = Request(url, headers=headers)
            with urlopen(req, timeout=timeout) as resp:  # nosec - simple fetch, trusted URLs provided by user
                data = resp.read()
                charset = resp.headers.get_content_charset() or "utf-8"
            return data.decode(charset, errors="replace")
        except Exception as exc:  # pragma: no cover - fallback
            last_exc = exc
            continue
    # Try r.jina.ai mirror as a last resort to read HTML (not images)
    try:
        mirror = f"https://r.jina.ai/http://{urlparse(url).netloc}{urlparse(url).path}"
        req = Request(mirror, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            return data.decode("utf-8", errors="replace")
    except Exception:
        pass
    if last_exc:
        raise last_exc


def fetch_bytes(url: str, *, timeout: float = 30.0) -> tuple[bytes, Optional[str]]:
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": url,
    })
    with urlopen(req, timeout=timeout) as resp:  # nosec - simple fetch
        content_type = resp.headers.get("Content-Type")
        return resp.read(), content_type


def guess_ext(url: str, content_type: Optional[str]) -> str:
    path = urlparse(url).path.lower()
    for ext in (".avif", ".webp", ".jpg", ".jpeg", ".png"):
        if path.endswith(ext):
            return ext
    if content_type:
        if "avif" in content_type:
            return ".avif"
        if "webp" in content_type:
            return ".webp"
        if "png" in content_type:
            return ".png"
    return ".jpg"


def extract_image_url(page_url: str, html: str) -> Optional[str]:
    m = OG_IMAGE_RE.search(html)
    if m:
        return urljoin(page_url, m.group(2))
    # Fallback: first <img src>
    m = re.search(r"<img[^>]+src=\"([^\"]+)\"", html, re.IGNORECASE)
    if m:
        return urljoin(page_url, m.group(1))
    return None


def sanitize_name(text: str) -> str:
    safe = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return safe or "image"


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    data_path = root / "site-data.json"
    img_dir = root / "assets" / "img"
    img_dir.mkdir(parents=True, exist_ok=True)

    data = json.loads(data_path.read_text(encoding="utf-8"))
    featured = data.get("featured") or []

    for idx, item in enumerate(featured, start=1):
        url = item.get("url")
        if not url:
            continue
        try:
            html = fetch_text(url)
            img_url = extract_image_url(url, html)
            if not img_url:
                continue
            try:
                blob, ctype = fetch_bytes(img_url)
                base = sanitize_name(item.get("source") or urlparse(url).netloc)
                ext = guess_ext(img_url, ctype)
                out_name = f"featured-{idx}-{base}{ext}"
                out_path = img_dir / out_name
                out_path.write_bytes(blob)
                # store site-relative path
                item["image"] = f"assets/img/{out_name}"
                print(f"Saved {out_path} from {img_url}")
            except Exception as img_exc:
                # Fallback: reference remote image directly
                item["image"] = img_url
                print(f"WARN: using remote image for {url}: {img_exc}")
        except Exception as exc:  # pragma: no cover - best effort
            print(f"WARN: failed to fetch image for {url}: {exc}")

    data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {data_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

