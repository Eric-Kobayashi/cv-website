from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path


OLD_URL = "https://sites.google.com/view/maymmchim/about-me?authuser=0"


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", "ignore")


def extract_image_urls(html: str) -> list[str]:
    # Grab src attributes from img tags
    srcs = re.findall(r"<img[^>]+src=[\"']([^\"'> ]+)", html, flags=re.IGNORECASE)
    # Also grab any explicit image links in the HTML (png/jpg/jpeg)
    links = re.findall(r"https?://[^\"' )>]+\.(?:png|jpg|jpeg)", html, flags=re.IGNORECASE)
    urls: list[str] = []
    for u in srcs + links:
        if u not in urls:
            urls.append(u)
    return urls


def choose_profile_image(urls: list[str]) -> str | None:
    if not urls:
        return None
    # Prefer googleusercontent (often profile images on Google Sites)
    googleusercontent = [u for u in urls if "googleusercontent.com" in u]
    if googleusercontent:
        return googleusercontent[0]
    # Otherwise, prefer jpg/jpeg over png for typical profile photos
    jpgs = [u for u in urls if re.search(r"\.(?:jpg|jpeg)(?:$|[?&#])", u, flags=re.IGNORECASE)]
    if jpgs:
        return jpgs[0]
    # Fallback to any png
    pngs = [u for u in urls if re.search(r"\.(?:png)(?:$|[?&#])", u, flags=re.IGNORECASE)]
    if pngs:
        return pngs[0]
    return urls[0]


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    dest.write_bytes(data)


def main() -> int:
    try:
        html = fetch_html(OLD_URL)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: failed fetching {OLD_URL}: {exc}")
        return 1

    urls = extract_image_urls(html)
    print(f"Found {len(urls)} image-like URLs")
    for i, u in enumerate(urls[:20]):
        print(f"[{i}] {u}")

    chosen = choose_profile_image(urls)
    if not chosen:
        print("No image URL found")
        return 2
    print(f"Chosen image: {chosen}")

    root = Path(__file__).resolve().parents[1]
    out = root / "assets" / "img" / "profile.jpg"
    try:
        download(chosen, out)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: failed downloading image: {exc}")
        return 3
    print(f"Saved profile image to {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

