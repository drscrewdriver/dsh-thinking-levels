#!/usr/bin/env python3
"""Regenerate src/client/whale-mascot.ts from the chibi runner strip.

Pipeline (see .agents/plans/dsh-thinking-levels-effort-slider/spec.md):
  1. Load tools/chibi-runner-strip.png (2304x395, 8 frames of 288x395, facing
     LEFT — source: HanaAyane/dsh-reasoning-effort assets/, community whale-girl
     derivative artwork).
  2. Single whole-strip LANCZOS pass to 536x92 — 8 frames of exactly 67x92 so
     background-position steps stay integer-aligned; 92px = 2x the 46px display
     height (retina).
  3. NO mirror: the girl keeps the original LEFT-facing orientation — she rides
     the thumb looking back along the track (matches the reference plugin).
  4. Quantize to a 256-color palette and save AS PALETTE MODE — converting back
     to RGBA before saving re-inflates the file ~3x (70KB vs 22KB).
  5. Base64-emit src/client/whale-mascot.ts (the client bundle purity gate
     forbids external asset files; everything must inline as a data URL).

Usage: python tools/whale-mascot.py  (run from the plugin root)
"""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
STRIP = ROOT / "tools" / "chibi-runner-strip.png"
OUT = ROOT / "src" / "client" / "whale-mascot.ts"

FRAMES = 8
ASSET_FRAME_W = 67   # asset pixels per frame after resize (8 x 67 = 536)
ASSET_FRAME_H = 92   # 2x the 46px CSS display height
CSS_FRAME_W = 33.5   # 67 / 2
CSS_FRAME_H = 46.0   # 92 / 2


def main() -> None:
    strip = Image.open(STRIP)
    if strip.size[0] % FRAMES != 0:
        raise SystemExit(f"strip width {strip.size[0]} is not a multiple of {FRAMES}")
    resized = strip.resize((ASSET_FRAME_W * FRAMES, ASSET_FRAME_H), Image.LANCZOS)
    quantized = resized.quantize(colors=256, method=Image.FASTOCTREE)

    buffer = io.BytesIO()
    quantized.save(buffer, format="PNG", optimize=True)
    payload = buffer.getvalue()
    data_url = "data:image/png;base64," + base64.b64encode(payload).decode("ascii")

    OUT.write_text(
        "/**\n"
        " * Whale-girl runner strip (鲸鱼娘侧面奔跑立绘, original left-facing\n"
        " * orientation — she rides the thumb looking back along the track),\n"
        " * inlined as a palette PNG data URL — the client bundle purity gate\n"
        " * forbids non-inline assets. Source: HanaAyane/dsh-reasoning-effort\n"
        " * assets/chibi-runner-strip.png (community whale-girl derivative);\n"
        " * regenerate via `python tools/whale-mascot.py`.\n"
        " */\n"
        f"export const WHALE_RUN_STRIP_SRC = {data_url!r}\n\n"
        "/** Frame geometry of the strip, in asset pixels (2x the CSS display size). */\n"
        "export const WHALE_RUN_STRIP = {\n"
        f"  frames: {FRAMES},\n"
        f"  frameW: {ASSET_FRAME_W},\n"
        f"  frameH: {ASSET_FRAME_H},\n"
        "} as const\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT.name}: png {len(payload)} B, base64 {len(data_url)} B")


if __name__ == "__main__":
    main()
