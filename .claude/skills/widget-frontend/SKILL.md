---
name: widget-frontend
description: Use when changing how the Android KWGT widget chart looks or behaves in this project (the Google Sheets chart built in src/Sheet.js and published as an image), including colors, size, title, number of days, or helping the user set it up in KWGT.
---

# Widget chart (Google Sheets → published image → KWGT)

The widget is a KWGT **Image** item whose Bitmap formula is the chart's published image link (`https://docs.google.com/spreadsheets/d/e/<id>/pubchart?oid=<chartId>&format=image`). The chart is built and updated hourly by `updateSheet` in `src/Sheet.js`.

## Hard constraints

- **Modify the chart in place** (`charts[0].modify()` + `sheet.updateChart`). Deleting or re-inserting it creates a new chart id, which breaks the user's published link and their KWGT widget.
- **No web pages.** Web-widget apps snapshot before JavaScript draws, KWGT can't render HTML, and Apps Script HTML pages carry a Google banner. The image approach exists because of all three.
- Only Google Sheets chart options are available (`EmbeddedChartBuilder.setOption`, Google Charts option names). There's no CSS and no dark mode detection: the image looks the same in light and dark themes, so choose colors that read on both (or use `backgroundColor` deliberately).
- Colors: New = `#2a78d6`, Done = `#eb6834` (dataviz categorical slots 1–2). Don't use green for Done (status colors are reserved). Run the dataviz `validate_palette.js` after any color change.
- Never put task titles in the sheet or chart: the published image is public.

## Verify a change before handing it over

1. `npm test` and `node --check src/Sheet.js`.
2. Ask the user to paste the changed `src/` file into Apps Script and run `updateSheet` once (no deployment needed).
3. Fetch the published image and look at it: `curl -sL -o <scratchpad>/chart.png "<published link>"`, then Read the PNG. A `text/html` response instead of `image/png` means a wrong link (commonly `&amp;` instead of `&`, or `l`/`I` misread from a screenshot).
4. If the phone is connected over adb, capture its screen (`mcp__rea__capture_adb_screen`) to check the widget in KWGT.
