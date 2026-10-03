# Claude Design follow-up — colour detail

The first prompt went to Claude Design before the full colour system was added.
Paste the text below into the **same** Claude Design conversation; it adds the
colours without restarting the work.

---

Keep everything you have designed so far, and do not start again. Apply this colour
detail to the existing designs.

Each scheme is a four-step tonal ladder. Every step has its own background, text,
muted text and border colour, so a section can sit on any step and stay legible:

- Base: the page background
- Soft: one step off the page (alternate bands, cards, the footer)
- Deep: the scheme's richest tone
- Contrast: a deliberately inverted band (dark on a light scheme, light on a dark one)

Sections and the footer each choose which step they sit on. Use all four steps in
the design: for example the information column on Base, the reviews on Soft, a
promotional band on Contrast, and the footer on Soft or Contrast.

| Scheme | Step | Background | Text | Muted text | Border |
|---|---|---|---|---|---|
| Light / Ivory | Base | #FFFFFF | #1A1A1A | rgba(26,26,26,.66) | rgba(26,26,26,.16) |
| | Soft | #F7F4EE | #1A1A1A | rgba(26,26,26,.66) | rgba(26,26,26,.16) |
| | Deep | #EDE8DD | #1A1A1A | rgba(26,26,26,.66) | rgba(26,26,26,.16) |
| | Contrast | #1A1A1A | #F7F4EE | rgba(247,244,238,.66) | rgba(247,244,238,.16) |
| Ivory / Wine | Base | #FFFFFF | #11110F | rgba(17,17,15,.66) | rgba(17,17,15,.17) |
| | Soft | #F6F5F1 | #11110F | rgba(17,17,15,.66) | rgba(17,17,15,.17) |
| | Deep | #E6E3DB | #11110F | rgba(17,17,15,.66) | rgba(17,17,15,.17) |
| | Contrast | #11110F | #F6F5F1 | rgba(246,245,241,.66) | rgba(246,245,241,.17) |
| Dark Luxury | Base | #0A0A0A | #F5F0E8 | rgba(245,240,232,.62) | rgba(245,240,232,.16) |
| | Soft | #131313 | #F5F0E8 | rgba(245,240,232,.62) | rgba(245,240,232,.16) |
| | Deep | #1A1714 | #F5F0E8 | rgba(245,240,232,.62) | rgba(245,240,232,.16) |
| | Contrast | #F5F0E8 | #0A0A0A | rgba(10,10,10,.62) | rgba(10,10,10,.16) |
| Warm Taupe | Base | #1C1410 | #EDE0CC | rgba(237,224,204,.62) | rgba(237,224,204,.16) |
| | Soft | #241A14 | #EDE0CC | rgba(237,224,204,.62) | rgba(237,224,204,.16) |
| | Deep | #2E2219 | #EDE0CC | rgba(237,224,204,.62) | rgba(237,224,204,.16) |
| | Contrast | #EDE0CC | #1C1410 | rgba(28,20,16,.62) | rgba(28,20,16,.16) |
| Custom | — | the merchant's own colours, from colour pickers | | | |

Accent, sale and badge colours per scheme:

| Scheme | Accent | Accent light | Text on accent | Sale text | Sale background | Badge | Badge text | Header background / text |
|---|---|---|---|---|---|---|---|---|
| Light / Ivory | #9B7B3F | #C8A96E | #0A0A0A | #8B1A1A | #FFD5D5 | #C8A96E | #0A0A0A | #FFFFFF / #1A1A1A |
| Ivory / Wine | #762B36 | #C57F8A | #FFFFFF | #8B1A1A | #F3DADA | #762B36 | #FFFFFF | #F6F5F1 / #11110F |
| Dark Luxury | #C8A96E | #E8D4A8 | #0A0A0A | #FFBABA | #7A2020 | #C8A96E | #0A0A0A | #0A0A0A / #F5F0E8 |
| Warm Taupe | #D2A166 | #E4BF8C | #14110A | #FFBABA | #7A2020 | #D2A166 | #14110A | #1C1410 / #EDE0CC |

Use these values as they are. If the design needs a colour that is not here (a hover
fill, a focus ring, a success or low-stock state), derive it from these tokens, and
list it in the spec panel with its value in every scheme.

Show the product page, navbar and footer in Light / Ivory, Dark Luxury and Ivory / Wine.
