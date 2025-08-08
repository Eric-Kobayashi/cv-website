import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

from pypdf import PdfReader


HEADING_KEYS = [
    "profile",
    "summary",
    "research interests",
    "education",
    "experience",
    "work experience",
    "professional experience",
    "research experience",
    "employment",
    "publications",
    "selected publications",
    "preprints",
    "manuscripts",
    "projects",
    "research projects",
    "research",
    "skills",
    "awards",
    "honours",
    "honors",
    "grants",
    "funding",
    "teaching",
    "presentations",
    "talks",
    "conferences",
    "service",
    "professional",
    "certifications",
]


def read_pdf_text(pdf_path: Path) -> List[str]:
    reader = PdfReader(str(pdf_path))
    lines: List[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        # Normalize Windows newlines and split
        for raw_line in text.replace("\r\n", "\n").splitlines():
            line = raw_line.strip()
            if line:
                lines.append(line)
    return lines


def looks_like_name_token(token: str) -> bool:
    # Allow unicode letters, hyphen, apostrophe, period
    return re.match(r"^[\w'\-.]+$", token, flags=re.UNICODE) is not None


def guess_name(lines: List[str]) -> str:
    for i in range(min(10, len(lines))):
        candidate = lines[i].strip()
        if not candidate:
            continue
        if candidate.lower() in {"curriculum vitae", "cv"}:
            continue
        if ":" in candidate:
            continue
        # Heuristic: 2-5 tokens, mostly letters or hyphen
        tokens = candidate.split()
        if 1 < len(tokens) <= 5 and all(looks_like_name_token(t) for t in tokens):
            return candidate
    return "Your Name"


def find_email(lines: List[str]) -> str:
    email_re = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
    for line in lines[:60]:
        m = email_re.search(line)
        if m:
            return m.group(0)
    return ""


def find_location(lines: List[str]) -> str:
    # Look near top for an address-like line containing a comma or city keyword
    city_keywords = [
        "Cambridge",
        "Oxford",
        "London",
        "Exeter",
        "Manchester",
        "Bristol",
        "Edinburgh",
        "Glasgow",
        "Birmingham",
        "Leeds",
    ]
    for line in lines[:80]:
        if "@" in line:
            continue
        if any(k in line for k in city_keywords) and len(line) <= 120:
            return line.strip()
    return ""


def find_tagline(lines: List[str]) -> str:
    # Prefer roles like Fellow, PhD candidate, Postdoctoral Researcher, etc.
    role_keywords = [
        "fellow",
        "phd",
        "candidate",
        "postdoctoral",
        "researcher",
        "lecturer",
        "scientist",
        "engineer",
        "chemist",
    ]
    for line in lines[:60]:
        low = line.lower()
        if any(k in low for k in role_keywords) and 6 <= len(line) <= 160:
            return line.strip()
    return "Professional tagline"


def canonicalize_heading(raw: str) -> str:
    l = raw.lower().strip().strip(":")
    mapping = {
        "work experience": "experience",
        "professional experience": "experience",
        "research experience": "experience",
        "selected publications": "publications",
        "research projects": "projects",
        "research interests": "about",
        "profile": "about",
        "summary": "about",
        "honours": "awards",
        "honors": "awards",
    }
    return mapping.get(l, l)


def is_heading_line(line: str) -> Tuple[bool, str]:
    low = line.lower().strip()
    # Direct keyword match
    for key in HEADING_KEYS:
        if low.startswith(key) or low == key:
            return True, canonicalize_heading(key)
    # Uppercase short line heuristic (e.g., "RESEARCH EXPERIENCE")
    if (line.isupper() or low == line) and 2 <= len(line) <= 40 and len(line.split()) <= 4:
        return True, canonicalize_heading(low)
    # Trailing colon heuristic
    if line.strip().endswith(":") and len(line) <= 60:
        return True, canonicalize_heading(low[:-1])
    return False, ""


def split_sections(lines: List[str]) -> Dict[str, List[str]]:
    sections: Dict[str, List[str]] = {"intro": []}
    current_key = "intro"
    for line in lines:
        is_heading, key = is_heading_line(line)
        if is_heading:
            current_key = key
            if current_key not in sections:
                sections[current_key] = []
            continue
        sections.setdefault(current_key, []).append(line)
    return sections


def paragraph_from_intro(sections: Dict[str, List[str]]) -> str:
    intro = sections.get("about", []) or sections.get("intro", [])
    # Take first 3-6 lines as a short bio paragraph
    if not intro:
        return ""
    take = intro[:6]
    text = " ".join(take)
    # Trim if too long
    return text[:800]


def collect_list_from_section(sections: Dict[str, List[str]], keys: List[str]) -> List[str]:
    for key in keys:
        if key in sections and sections[key]:
            items: List[str] = []
            buffer: List[str] = []
            for line in sections[key]:
                if re.match(r"^\s*(20\d\d|19\d\d)[\)\.]?\s*", line) or re.match(r"^\s*([\-•\*\u2022]|\d+\.)\s*", line):
                    if buffer:
                        items.append(" ".join(buffer).strip())
                        buffer = []
                    items.append(line.strip())
                elif not line.strip():
                    if buffer:
                        items.append(" ".join(buffer).strip())
                        buffer = []
                else:
                    buffer.append(line.strip())
            if buffer:
                items.append(" ".join(buffer).strip())
            # Basic cleanup
            items = [i for i in (s.strip(" -•\u2022").strip() for s in items) if i]
            # Deduplicate preserving order
            seen = set()
            dedup: List[str] = []
            for it in items:
                if it not in seen:
                    seen.add(it)
                    dedup.append(it)
            return dedup[:50]
    return []


def build_data(pdf_path: Path) -> Dict:
    lines = read_pdf_text(pdf_path)
    name = guess_name(lines)
    email = find_email(lines)
    location = find_location(lines)
    tagline = find_tagline(lines)
    sections = split_sections(lines)
    about = paragraph_from_intro(sections)
    publications = collect_list_from_section(
        sections, ["publications", "selected publications", "preprints", "manuscripts"]
    )
    projects = collect_list_from_section(
        sections, ["projects", "research projects", "experience"]
    )
    return {
        "name": name,
        "email": email,
        "location": location,
        "tagline": tagline,
        "about": about,
        "publications": publications,
        "projects": projects,
    }


def main(argv: List[str]) -> int:
    if len(argv) < 2:
        print("Usage: extract_cv.py <pdf-path> [out-json]", file=sys.stderr)
        return 2
    pdf_path = Path(argv[1])
    out_path = Path(argv[2]) if len(argv) > 2 else pdf_path.with_name("site-data.json")
    data = build_data(pdf_path)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

