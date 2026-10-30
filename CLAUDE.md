# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Android home-screen widget showing a daily chart of Google Tasks (New vs Done, last 7 days). A Google Apps Script project (`src/`, pasted into script.google.com) runs an hourly trigger that writes the counts into a Google Sheet. The sheet's chart is published to the web as an image, and a KWGT Image item shows that image link. There is no server, web app or build step. Setup steps are in `README.md`; product decisions are in `SPEC.md`.

Earlier versions used a web page (an Apps Script HtmlService page, then GitHub Pages + a JSON API). They were dropped: web-widget apps snapshot the page before JavaScript draws the chart, KWGT can't render web pages, and Apps Script HTML pages carry a Google banner. Don't reintroduce a web page for the widget.

## Commands

- `npm test` runs the Node unit tests (`node --test "tests/*.test.js"`). Run one test with `node --test --test-name-pattern "<name>" "tests/*.test.js"`.
- `node --check src/<file>.js` is the only local check for the Apps Script files. They only run in Apps Script (run `updateSheet` from the editor).
- The user's phone may be connected over adb (see `mcp__rea__list_adb_devices`); screen captures are useful for guiding KWGT setup.

## Architecture

- `src/Sheet.js`: `setupSheet` (run once) creates the spreadsheet (id in Script Property `SHEET_ID`) and the hourly `updateSheet` trigger. `updateSheet` rewrites the last `SHEET_DAYS` days and **modifies the same chart in place**, because the published image link (`pubchart?oid=<chartId>&format=image`) is tied to that chart. Never delete and recreate the chart.
- `src/Code.js`: Google Tasks access through the **Tasks advanced service**. For each list it runs two queries (due in range, completed in range) with `showHidden: true` so cleared completed tasks are included; `getStats` feeds them to Stats.
- `src/Stats.js`: pure counting logic, shared by Apps Script (global scope) and Node (via the `typeof module` guard). Keep it free of `Utilities`/`Session`; the time zone conversion is passed in as `toLocalDate`.
- `src/appsscript.json`: V8, scopes `tasks.readonly` + `spreadsheets` + `script.scriptapp`, Tasks advanced service.

## Domain rules (non-obvious)

- **New** = the task's `due` date. The Tasks API keeps only the date (always midnight UTC; the hour set in Calendar is not exposed), so take `due.slice(0, 10)` with **no** time zone conversion.
- **Done** = the `completed` timestamp converted to the script time zone (`Session.getScriptTimeZone()`, from the manifest `timeZone`).
- The Tasks API has **no creation date**. Undated tasks therefore never count as New; completed undated tasks still count in Done.
- Apps Script files share one global scope: top-level names across `src/*.js` must not collide.
- Chart colors are categorical slots 1–2 of the dataviz palette (New blue `#2a78d6`, Done orange `#eb6834`). Don't use green for Done: status colors are reserved.
