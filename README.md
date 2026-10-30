# Tasks Productivity Widget

An Android home-screen widget (KWGT) with a daily chart of your Google Tasks for the last 7 days:

- **New**: tasks due that day (the date you pick when creating the task).
- **Done**: tasks you completed that day.

The chart title shows the totals, the Done ÷ New rate and when it was last updated, e.g. `New 61 · Done 60 · 98% (updated 16:24)`.

## How it works

```
Google Tasks ──▶ Apps Script (hourly) ──▶ Google Sheet + chart ──▶ chart published as image ──▶ KWGT Image item
```

Everything runs in your Google account. There's no server or outside service, and nothing to keep running on a computer.

## Setup

### 1. Apps Script

1. Go to https://script.google.com and create a **New project** (e.g. "Tasks Productivity").
2. **Project Settings**: tick **Show "appsscript.json" manifest file in editor**.
3. In the **Editor**, create these files and paste in the contents from `src/`:
   | Editor file | Paste from |
   |---|---|
   | `Code.gs` (exists already) | `src/Code.js` |
   | `Stats.gs` (+ → Script) | `src/Stats.js` |
   | `Sheet.gs` (+ → Script) | `src/Sheet.js` |
   | `appsscript.json` | `src/appsscript.json`. Set `timeZone` to yours if it isn't `Europe/Madrid` |
4. Save, select the function **`setupSheet`** and click **Run**. Approve the permissions: read-only access to Tasks, Sheets, and running on a timer. If Google shows "Google hasn't verified this app", click **Advanced → Go to (your project)**.
5. The **Execution log** prints the spreadsheet link. The spreadsheet has the last 7 days and a chart, and an hourly timer now keeps it up to date.

### 2. Publish the chart as an image

In the spreadsheet, click the chart → **⋮ → Publish chart** → **Link** tab → choose **Image** → **Publish**, and copy the link. It looks like:

```
https://docs.google.com/spreadsheets/d/e/2PACX-.../pubchart?oid=123456789&format=image
```

Use the **Link** tab, not **Embed**: the Embed tab gives `<iframe ...>` code, which KWGT can't use.

### 3. KWGT

1. Create (or edit) a widget and add an **Image** item.
2. On the **Bitmap** row, tap the **square on the right** to select it, then tap the **calculator icon** in the top bar to switch it to a formula.
3. Tap **Bitmap**, paste the link and nothing else, tap ✓ and save with 💾.

The link must end in `&format=image`. If it shows `&amp;format=image` (copied from the Embed code), delete `amp;`, or Google returns a web page instead of the image and KWGT shows a grey box.

## Changing things

- **Number of days:** edit `SHEET_DAYS` at the top of `Sheet.gs`, save, and run `updateSheet` once.
- **Colors or size:** edit the chart options at the end of `updateSheet` in `Sheet.gs`.
- **Code changes** take effect on the next hourly run, or run `updateSheet` to apply them now. No deployment is needed.
- Don't delete the chart in the spreadsheet. The published image link belongs to that chart, so a new chart means a new link to paste into KWGT.

## Updates and delays

The timer runs every hour. Google can take a few more minutes to refresh the published image, and KWGT may cache it for a while. The "updated" time in the chart title shows how fresh the data is.

## Privacy

The published image can be seen by anyone who has its link. It shows only daily counts, never task titles. To stop sharing it: in the spreadsheet, **File → Share → Publish to web → Stop publishing**.

## Tests

`npm test` runs Node unit tests for the counting logic in `src/Stats.js`.
