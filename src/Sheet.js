// Google Sheets chart for the KWGT widget: an hourly trigger rewrites the last SHEET_DAYS days
// into a sheet, and the sheet's chart is published to the web as an image that KWGT displays.

const SHEET_DAYS = 7;
const SHEET_NAME = 'Daily';

/**
 * Run once from the editor: creates the spreadsheet and chart, fills them, and starts the hourly trigger.
 * Running it again reuses the existing spreadsheet and replaces the trigger.
 */
function setupSheet() {
  const props = PropertiesService.getScriptProperties();
  let ss;
  const id = props.getProperty('SHEET_ID');
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('Tasks Productivity');
    ss.getSheets()[0].setName(SHEET_NAME);
    props.setProperty('SHEET_ID', ss.getId());
  }

  updateSheet();

  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'updateSheet'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('updateSheet').timeBased().everyHours(1).create();

  Logger.log('Spreadsheet: ' + ss.getUrl());
}

/**
 * Rewrites the sheet with the last SHEET_DAYS days and refreshes the chart title. Runs hourly.
 */
function updateSheet() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Run setupSheet first.');
  const sheet = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);

  const tz = Session.getScriptTimeZone();
  const end = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const start = new Date(end + 'T00:00:00Z');
  start.setUTCDate(start.getUTCDate() - (SHEET_DAYS - 1));
  const stats = getStats(fetchTaskLists(), start.toISOString().slice(0, 10), end, tz);

  // Labels are text ("MM-dd") so the chart shows one bar group per day instead of a date axis.
  const rows = [['Day', 'New', 'Done']].concat(stats.days.map(function (d) {
    return ["'" + d.date.slice(5), d.new, d.done];
  }));
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);

  const t = stats.totals;
  const title = 'New ' + t.new + ' · Done ' + t.done +
    (t.rate === null ? '' : ' · ' + Math.round(t.rate * 100) + '%') +
    '   (updated ' + Utilities.formatDate(new Date(), tz, 'HH:mm') + ')';

  // Same chart object is modified in place so its published image link never changes.
  const charts = sheet.getCharts();
  const builder = charts.length ? charts[0].modify() : sheet.newChart().setPosition(1, 5, 0, 0);
  const chart = builder
    .asColumnChart()
    .clearRanges()
    .addRange(sheet.getRange(1, 1, rows.length, 3))
    .setNumHeaders(1)
    .setColors(['#2a78d6', '#eb6834'])
    .setLegendPosition(Charts.Position.TOP)
    .setTitle(title)
    .setOption('width', 600)
    .setOption('height', 300)
    .setOption('vAxis.minValue', 0)
    .setOption('vAxis.format', '0')
    .build();
  if (charts.length) sheet.updateChart(chart); else sheet.insertChart(chart);
}
