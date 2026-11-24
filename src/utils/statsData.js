import { parseTransactionAmount } from "./transactionAmount";

export function normalizeTransactionDate(value) {
  if (value === null || value === undefined || value === "") return null;
  let date;
  if (typeof value.toDate === "function") date = value.toDate();
  else if (typeof value === "object" && typeof value.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Calendar days are local, so a midnight operation never moves to the previous UTC day.
export function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function transactionCategory(transaction) {
  return String(transaction.source || transaction.category || "Без категории").trim() || "Без категории";
}

export function filterStatsTransactions(transactions, start, end, category = "") {
  const first = normalizeTransactionDate(start);
  const last = normalizeTransactionDate(end);
  if (!first || !last) return [];
  const startDay = new Date(first);
  const endDay = new Date(last);
  startDay.setHours(0, 0, 0, 0);
  endDay.setHours(23, 59, 59, 999);
  return transactions.filter((transaction) => {
    const date = normalizeTransactionDate(transaction.date);
    return date && date >= startDay && date <= endDay &&
      (!category || transactionCategory(transaction) === category);
  });
}

export function buildDailyStats(transactions, start, end) {
  const first = normalizeTransactionDate(start);
  const last = normalizeTransactionDate(end);
  if (!first || !last) return [];
  const day = new Date(first);
  const lastDay = new Date(last);
  day.setHours(0, 0, 0, 0);
  lastDay.setHours(0, 0, 0, 0);
  const rows = new Map();
  for (; day <= lastDay; day.setDate(day.getDate() + 1)) {
    const key = localDateKey(day);
    rows.set(key, [key, 0, 0]);
  }
  for (const transaction of transactions) {
    const date = normalizeTransactionDate(transaction.date);
    const amount = parseTransactionAmount(transaction.summ);
    if (!date || amount === null) continue;
    const row = rows.get(localDateKey(date));
    if (!row) continue;
    if (transaction.type === "Доход") row[1] += amount;
    if (transaction.type === "Расход") row[2] += amount;
  }
  return [...rows.values()];
}
