// Invalid amounts stay distinguishable from a legitimate zero.
export function parseTransactionAmount(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const normalized = typeof value === "string"
    ? value.replace(/\s/g, "").replace(",", ".")
    : value;
  if (normalized === "") return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function summarizeTransactions(transactions) {
  let income = 0;
  let outcome = 0;
  let invalidCount = 0;
  for (const transaction of transactions) {
    if (transaction.type !== "Доход" && transaction.type !== "Расход") continue;
    const amount = parseTransactionAmount(transaction.summ);
    if (amount === null) {
      invalidCount += 1;
      continue;
    }
    if (transaction.type === "Доход") income += amount;
    else outcome += amount;
  }
  return { income, outcome, balance: income - outcome, invalidCount };
}
