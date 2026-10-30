const test = require('node:test');
const assert = require('node:assert');
const { listDays, computeDailyStats } = require('../src/Stats.js');

// Fixed UTC+2 offset stands in for Utilities.formatDate with the script time zone.
const plus2 = (iso) => new Date(new Date(iso).getTime() + 2 * 3600e3).toISOString().slice(0, 10);

test('listDays is inclusive and crosses month ends', () => {
  assert.deepStrictEqual(listDays('2026-01-30', '2026-02-02'),
    ['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
});

test('new counts by due date, done by local completion date', () => {
  const tasks = [
    { id: 'a', due: '2026-10-01T00:00:00.000Z', status: 'needsAction' },
    { id: 'b', due: '2026-10-01T00:00:00.000Z', status: 'completed', completed: '2026-10-02T23:30:00.000Z' },
  ];
  const s = computeDailyStats(tasks, '2026-10-01', '2026-10-03', plus2);
  assert.deepStrictEqual(s.days.map((d) => [d.new, d.done]), [[2, 0], [0, 0], [0, 1]]);
  assert.strictEqual(s.days[0].rate, 0);
  assert.strictEqual(s.days[1].rate, null);
  assert.deepStrictEqual(s.totals, { new: 2, done: 1, rate: 0.5, undatedDone: 0 });
});

test('duplicate ids from the two queries are counted once', () => {
  const t = { id: 'x', due: '2026-10-01T00:00:00.000Z', status: 'completed', completed: '2026-10-01T10:00:00.000Z' };
  const s = computeDailyStats([t, t], '2026-10-01', '2026-10-01', plus2);
  assert.deepStrictEqual([s.totals.new, s.totals.done], [1, 1]);
});

test('undated completed tasks count as done only', () => {
  const tasks = [{ id: 'u', status: 'completed', completed: '2026-10-01T10:00:00.000Z' }];
  const s = computeDailyStats(tasks, '2026-10-01', '2026-10-01', plus2);
  assert.deepStrictEqual(s.totals, { new: 0, done: 1, rate: null, undatedDone: 1 });
});

test('tasks outside the range are ignored', () => {
  const tasks = [
    { id: 'o', due: '2026-09-30T00:00:00.000Z', status: 'completed', completed: '2026-10-05T10:00:00.000Z' },
  ];
  const s = computeDailyStats(tasks, '2026-10-01', '2026-10-03', plus2);
  assert.deepStrictEqual([s.totals.new, s.totals.done], [0, 0]);
});
