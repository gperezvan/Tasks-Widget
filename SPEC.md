# Spec: Google Tasks Productivity Widget

A home-screen widget on Android showing, for each day, how many Google Tasks were **new** and how many were **done**.

## Decisions

| Topic | Decision |
|---|---|
| Data source | Google Tasks (the checkbox tasks in Google Calendar), read-only |
| "New" on day D | The task's due date is D (the date picked when creating it; the API doesn't expose the hour) |
| "Done" on day D | Completed on D, in the script's time zone, whatever the due date |
| Tasks without a due date | Not counted as New (the API has no creation date); counted as Done |
| Task lists | All lists combined |
| Range | Last 7 days (`SHEET_DAYS` in `Sheet.js`) |
| Chart | Grouped New/Done bars per day; totals, Done ÷ New and the update time in the title |
| Platform | Apps Script hourly trigger → Google Sheet chart → published as an image → KWGT Image item. Not possible inside the Google Calendar Android app: it doesn't support third-party add-ons |
| Freshness | Hourly, plus a few minutes for Google to refresh the published image |
| Access | The published image link is public (counts only, no task titles) |

## Known limits

- Deleted tasks disappear from history.
- Done ÷ New can go above 100% (finishing overdue or undated tasks).
- Recurring tasks count as separate tasks, one per due date.
