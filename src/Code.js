// Google Tasks access: reads every list and counts tasks per day (counting itself is in Stats.js).

function getStats(lists, start, end, tz) {
  const tasks = fetchTasks(lists, start, end);
  return computeDailyStats(tasks, start, end, function (iso) {
    return Utilities.formatDate(new Date(iso), tz, 'yyyy-MM-dd');
  });
}

function fetchTaskLists() {
  const lists = [];
  let pageToken;
  do {
    const res = Tasks.Tasklists.list({ maxResults: 100, pageToken: pageToken });
    (res.items || []).forEach(function (l) { lists.push({ id: l.id, title: l.title }); });
    pageToken = res.nextPageToken;
  } while (pageToken);
  return lists;
}

/**
 * Returns tasks due in the range plus tasks completed in the range (may overlap; Stats dedupes by id).
 * Completion bounds are padded a day each side to cover time zone offsets; Stats filters exactly.
 */
function fetchTasks(lists, start, end) {
  const dueMin = start + 'T00:00:00.000Z';
  const dueMax = nextDay(end) + 'T00:00:00.000Z';
  const completedMin = prevDay(start) + 'T00:00:00.000Z';
  const completedMax = nextDay(nextDay(end)) + 'T00:00:00.000Z';

  const tasks = [];
  lists.forEach(function (list) {
    const base = { showCompleted: true, showHidden: true, showDeleted: false, maxResults: 100 };
    [
      Object.assign({ dueMin: dueMin, dueMax: dueMax }, base),
      Object.assign({ completedMin: completedMin, completedMax: completedMax }, base),
    ].forEach(function (query) {
      let pageToken;
      do {
        query.pageToken = pageToken;
        const res = Tasks.Tasks.list(list.id, query);
        (res.items || []).forEach(function (t) { tasks.push(t); });
        pageToken = res.nextPageToken;
      } while (pageToken);
    });
  });
  return tasks;
}

function nextDay(ymd) {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function prevDay(ymd) {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
