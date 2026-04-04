#!/usr/bin/env python3
"""
Generate simple InfoWatch app icons (192×192 and 512×512) using Python stdlib only.
Creates a solid indigo (#6366f1) background with a white "I" mark.
"""

import math
import os
import struct
import zlib
from pathlib import Path


def png_chunk(name: bytes, data: bytes) -> bytes:
    raw = name + data
    crc = zlib.crc32(raw) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + raw + struct.pack(">I", crc)


def make_icon_png(size: int) -> bytes:
    """Create an indigo square icon with a white vertical bar (the 'I' in InfoWatch)."""
    bg_r, bg_g, bg_b = 99, 102, 241   # indigo-500 (#6366f1)
    fg_r, fg_g, fg_b = 255, 255, 255  # white

    cx = size // 2
    cy = size // 2

    # 'I' bar proportions
    bar_w = max(2, size // 10)
    bar_h = max(4, size * 5 // 10)
    cap_w = max(4, size * 3 // 10)
    cap_h = max(2, size // 14)
    corner_r = size // 6  # rounded corners for the background square

    rows = []
    for y in range(size):
        row = bytearray([0])  # filter byte (None)
        for x in range(size):
            # Rounded-corner background
            dx = abs(x - cx)
            dy = abs(y - cy)
            in_bg = True
            # Check corner rounding
            if dx > cx - corner_r and dy > cy - corner_r:
                dist = math.hypot(dx - (cx - corner_r), dy - (cy - corner_r))
                if dist > corner_r:
                    in_bg = False

            if not in_bg:
                # Transparent-ish (dark background to blend with phone wallpaper)
                row.extend([15, 23, 42])  # slate-950
            else:
                # Determine if pixel is part of the 'I' glyph
                in_stem = (abs(x - cx) <= bar_w // 2 and abs(y - cy) <= bar_h // 2)
                in_top_cap = (abs(x - cx) <= cap_w // 2 and abs(y - (cy - bar_h // 2)) <= cap_h // 2)
                in_bot_cap = (abs(x - cx) <= cap_w // 2 and abs(y - (cy + bar_h // 2)) <= cap_h // 2)

                if in_stem or in_top_cap or in_bot_cap:
                    row.extend([fg_r, fg_g, fg_b])
                else:
                    row.extend([bg_r, bg_g, bg_b])

        rows.append(bytes(row))

    raw_data = b"".join(rows)

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b"IHDR", ihdr_data)
    idat = png_chunk(b"IDAT", zlib.compress(raw_data, 9))
    iend = png_chunk(b"IEND", b"")

    return signature + ihdr + idat + iend


def main():
    out_dir = Path(__file__).parent.parent / "frontend" / "public" / "icons"
    out_dir.mkdir(parents=True, exist_ok=True)

    for size in [192, 512]:
        data = make_icon_png(size)
        path = out_dir / f"{size}.png"
        with open(path, "wb") as f:
            f.write(data)
        print(f"Created {path}  ({len(data):,} bytes)")


if __name__ == "__main__":
    main()
