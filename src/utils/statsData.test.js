import { buildDailyStats, filterStatsTransactions, localDateKey } from "./statsData";

const start = new Date(2026, 10, 1, 12);
const end = new Date(2026, 10, 30, 0);
const transactions = [
  { date: new Date(2026, 10, 1, 0), type: "Расход", source: "Транспорт", summ: "100,50" },
  { date: new Date(2026, 10, 30, 23, 59, 59), type: "Расход", source: "Транспорт", summ: "200" },
  { date: new Date(2026, 10, 15), type: "Доход", source: "Зарплата", summ: 1000 },
  { date: new Date(2026, 11, 1), type: "Расход", source: "Транспорт", summ: 500 },
];

test("every day appears, including empty days and both boundaries", () => {
  const rows = buildDailyStats(transactions, start, end);
  expect(rows).toHaveLength(30);
  expect(rows[0]).toEqual(["2026-11-01", 0, 100.5]);
  expect(rows[1]).toEqual(["2026-11-02", 0, 0]);
  expect(rows[29]).toEqual(["2026-11-30", 0, 200]);
  expect(rows.reduce((sum, row) => sum + row[1], 0)).toBe(1000);
});

test("category filter includes the entire first and last days", () => {
  const filtered = filterStatsTransactions(transactions, start, end, "Транспорт");
  expect(filtered).toEqual([transactions[0], transactions[1]]);
  expect(filterStatsTransactions(transactions, start, end)).toHaveLength(3);
  expect(filterStatsTransactions(transactions, start, end, "Аптеки")).toEqual([]);
});

test("dates stay in their local calendar day", () => {
  const date = new Date(2026, 10, 1, 0, 15);
  expect(localDateKey(date)).toBe("2026-11-01");
  expect(buildDailyStats([{ date, type: "Доход", summ: 50 }], date, date))
    .toEqual([["2026-11-01", 50, 0]]);
});

test("leap days, incomplete and reversed ranges", () => {
  expect(buildDailyStats([], new Date(2024, 1, 28), new Date(2024, 2, 1)).map(row => row[0]))
    .toEqual(["2024-02-28", "2024-02-29", "2024-03-01"]);
  expect(buildDailyStats([], start, null)).toEqual([]);
  expect(buildDailyStats([], end, start)).toEqual([]);
  expect(filterStatsTransactions(transactions, start, null)).toEqual([]);
});

test("Firestore dates and invalid amounts", () => {
  const date = new Date(2026, 10, 1, 12);
  expect(buildDailyStats([
    { date: { seconds: date.getTime() / 1000 }, type: "Расход", summ: "20.75" },
    { date: { toDate: () => date }, type: "Доход", summ: 50 },
    { date, type: "Расход", summ: "bad" },
    { date: "invalid", type: "Доход", summ: 100 },
  ], start, start)).toEqual([["2026-11-01", 50, 20.75]]);
});
