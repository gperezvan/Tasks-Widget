// Pure stats logic. No Apps Script APIs here so it can be unit-tested with Node.

/**
 * Lists every YYYY-MM-DD date from start to end, inclusive.
 */
function listDays(start, end) {
  const days = [];
  const d = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (d <= last) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

/**
 * Counts new (by due date) and done (by local completion date) tasks per day.
 *
 * @param {Array<{id: string, due?: string, completed?: string, status?: string}>} tasks
 *   Google Tasks resources; duplicates by id are ignored.
 * @param {string} start  First day, YYYY-MM-DD.
 * @param {string} end    Last day, YYYY-MM-DD.
 * @param {function(string): string} toLocalDate  RFC 3339 timestamp -> YYYY-MM-DD in the user's time zone.
 */
function computeDailyStats(tasks, start, end, toLocalDate) {
  const days = listDays(start, end);
  const byDay = {};
  days.forEach(function (date) { byDay[date] = { date: date, new: 0, done: 0, rate: null }; });

  const seen = {};
  let undatedDone = 0;
  tasks.forEach(function (task) {
    if (seen[task.id]) return;
    seen[task.id] = true;

    // The API stores only the date part of `due` (always midnight UTC), so no time zone conversion.
    if (task.due) {
      const dueDay = task.due.slice(0, 10);
      if (byDay[dueDay]) byDay[dueDay].new++;
    }
    if (task.status === 'completed' && task.completed) {
      const doneDay = toLocalDate(task.completed);
      if (byDay[doneDay]) {
        byDay[doneDay].done++;
        if (!task.due) undatedDone++;
      }
    }
  });

  let totalNew = 0;
  let totalDone = 0;
  const rows = days.map(function (date) {
    const row = byDay[date];
    if (row.new > 0) row.rate = row.done / row.new;
    totalNew += row.new;
    totalDone += row.done;
    return row;
  });

  return {
    days: rows,
    totals: {
      new: totalNew,
      done: totalDone,
      rate: totalNew > 0 ? totalDone / totalNew : null,
      undatedDone: undatedDone,
    },
  };
}

if (typeof module !== 'undefined') {
  module.exports = { listDays: listDays, computeDailyStats: computeDailyStats };
}
