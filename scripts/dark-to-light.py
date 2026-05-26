#!/usr/bin/env python3
"""Bulk find-replace dark Tailwind classes -> light Booking-clean palette.

Run from project root:
  python scripts/dark-to-light.py
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
EXCLUDE_DIRS = {"admin", "node_modules", ".next"}
EXCLUDE_FILES = {
    # Already validated by user
    "HeroClean.tsx",
}

# Order matters: longer / more specific replacements first
REPLACEMENTS = [
    # Backgrounds
    ("bg-[#0A0A0F]", "bg-[#F8FAFC]"),
    ("bg-[#0a0a0f]", "bg-[#F8FAFC]"),
    ("bg-[#111114]", "bg-white"),
    ("bg-[#1A1A1F]", "bg-white"),
    ("bg-[#1a1a1f]", "bg-white"),
    ("bg-[#18181B]", "bg-white"),
    ("bg-[#18181b]", "bg-white"),
    # Hover/focus background variants
    ("hover:bg-[#1A1A1F]", "hover:bg-[#F8FAFC]"),
    ("hover:bg-[#111114]", "hover:bg-[#F8FAFC]"),
    ("hover:bg-[#0A0A0F]", "hover:bg-[#F8FAFC]"),
    # Translucent darks for chips/overlays
    ("bg-[#1A1A1F]/80", "bg-white/90"),
    ("bg-[#111114]/80", "bg-white/90"),
    ("bg-[#0A0A0F]/80", "bg-white/80"),

    # Text colors (primary / body / muted / soft / very muted)
    ("text-[#FAFAFA]", "text-[#0F172A]"),
    ("text-[#fafafa]", "text-[#0F172A]"),
    ("text-[#D4D4D8]", "text-[#334155]"),
    ("text-[#d4d4d8]", "text-[#334155]"),
    ("text-[#A1A1AA]", "text-[#64748B]"),
    ("text-[#a1a1aa]", "text-[#64748B]"),
    ("text-[#71717A]", "text-[#94A3B8]"),
    ("text-[#71717a]", "text-[#94A3B8]"),
    ("text-[#52525B]", "text-[#CBD5E1]"),
    ("text-[#52525b]", "text-[#CBD5E1]"),
    # Hover text variants
    ("hover:text-[#FAFAFA]", "hover:text-[#0F172A]"),
    ("hover:text-[#D4D4D8]", "hover:text-[#0F172A]"),
    ("hover:text-[#A1A1AA]", "hover:text-[#334155]"),

    # Borders
    ("border-[#27272A]", "border-[#E2E8F0]"),
    ("border-[#27272a]", "border-[#E2E8F0]"),
    ("border-[#3F3F46]", "border-[#CBD5E1]"),
    ("border-[#3f3f46]", "border-[#CBD5E1]"),
    ("border-[#18181B]", "border-[#E2E8F0]"),
    ("border-[#18181b]", "border-[#E2E8F0]"),
    ("border-[#1A1A1F]", "border-[#E2E8F0]"),
    ("border-[#1a1a1f]", "border-[#E2E8F0]"),
    ("hover:border-[#3F3F46]", "hover:border-[#CBD5E1]"),
    ("hover:border-[#27272A]", "hover:border-[#CBD5E1]"),

    # Divides (border equivalent)
    ("divide-[#27272A]", "divide-[#E2E8F0]"),
    ("divide-[#3F3F46]", "divide-[#CBD5E1]"),

    # Ring focus
    ("ring-[#27272A]", "ring-[#E2E8F0]"),
    ("ring-[#3F3F46]", "ring-[#CBD5E1]"),

    # Placeholder
    ("placeholder:text-[#71717A]", "placeholder:text-[#94A3B8]"),
    ("placeholder:text-[#A1A1AA]", "placeholder:text-[#94A3B8]"),
    ("placeholder-[#71717A]", "placeholder-[#94A3B8]"),
    ("placeholder-[#A1A1AA]", "placeholder-[#94A3B8]"),

    # Orange/[0.08] subtle bg -> soft warm
    ("bg-[#FF6B35]/[0.08]", "bg-[#FFF7ED]"),
    ("bg-[#FF6B35]/[.08]", "bg-[#FFF7ED]"),
    ("bg-[#FF6B35]/10", "bg-[#FFF7ED]"),
    ("bg-[#FF6B35]/[0.10]", "bg-[#FFF7ED]"),
    ("bg-[#FF6B35]/[0.12]", "bg-[#FFF7ED]"),
    ("bg-[#FF6B35]/[0.15]", "bg-[#FFEDD5]"),
    ("bg-[#FF6B35]/20", "bg-[#FFEDD5]"),

    # Photo overlay gradients (heavy dark from bottom -> light from black)
    ("bg-gradient-to-t from-[#0A0A0F]", "bg-gradient-to-t from-black/50"),
    ("bg-gradient-to-t from-[#0a0a0f]", "bg-gradient-to-t from-black/50"),
    ("bg-gradient-to-b from-[#0A0A0F]", "bg-gradient-to-b from-black/40"),
    ("bg-gradient-to-b from-[#0a0a0f]", "bg-gradient-to-b from-black/40"),
    ("from-[#0A0A0F]/95", "from-black/50"),
    ("from-[#0A0A0F]/80", "from-black/40"),
    ("from-[#0A0A0F]/60", "from-black/30"),
    ("via-[#0A0A0F]/40", "via-transparent"),
    ("via-[#0A0A0F]/50", "via-transparent"),
    ("to-[#0A0A0F]", "to-transparent"),
    ("to-[#0A0A0F]/0", "to-transparent"),

    # Common Tailwind dark classes (zinc/neutral palette)
    ("bg-zinc-950", "bg-[#F8FAFC]"),
    ("bg-zinc-900", "bg-white"),
    ("bg-zinc-800", "bg-[#F8FAFC]"),
    ("text-zinc-100", "text-[#0F172A]"),
    ("text-zinc-200", "text-[#0F172A]"),
    ("text-zinc-300", "text-[#334155]"),
    ("text-zinc-400", "text-[#64748B]"),
    ("text-zinc-500", "text-[#94A3B8]"),
    ("border-zinc-800", "border-[#E2E8F0]"),
    ("border-zinc-700", "border-[#CBD5E1]"),

    # Generic backdrop blacks used in modals (keep dark but slightly soften)
    ("bg-black/80", "bg-black/40"),
    ("bg-black/70", "bg-black/35"),
    ("bg-black/60", "bg-black/30"),
]

# Ambient orange blobs -- remove blocks like radial-gradient(...) backgrounds in inline styles
BLOB_PATTERNS = [
    # remove inline radial-gradient orange blobs (style={{background:'radial-gradient(circle, #FF6B35 ...)'}})
    (re.compile(r"radial-gradient\(circle, *#FF6B35[^)]*\)", re.IGNORECASE), "transparent"),
]


def should_skip(p: Path) -> bool:
    parts = set(p.parts)
    if parts & EXCLUDE_DIRS:
        return True
    if p.name in EXCLUDE_FILES:
        return True
    return False


def process_file(path: Path):
    try:
        original = path.read_text(encoding="utf-8")
    except Exception:
        return 0
    new = original
    for old, repl in REPLACEMENTS:
        if old in new:
            new = new.replace(old, repl)
    for pat, repl in BLOB_PATTERNS:
        new = pat.sub(repl, new)
    if new != original:
        path.write_text(new, encoding="utf-8")
        return 1
    return 0


def main():
    changed = 0
    visited = 0
    for ext in ("*.tsx", "*.ts", "*.jsx", "*.js"):
        for p in SRC.rglob(ext):
            if should_skip(p):
                continue
            visited += 1
            changed += process_file(p)
    print(f"Visited {visited} files, modified {changed}.")


if __name__ == "__main__":
    main()
