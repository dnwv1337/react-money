import { parseTransactionAmount, summarizeTransactions } from "./transactionAmount";

test.each([
  [1250.75, 1250.75], ["1250.75", 1250.75], ["1 250,75", 1250.75],
  ["1\u00a0250,75", 1250.75], ["0", 0], [0, 0],
  ["", null], ["  ", null], [undefined, null], [null, null],
  ["abc", null], ["100abc", null], [Infinity, null], [NaN, null],
])("parses %p as %p", (input, expected) => {
  expect(parseTransactionAmount(input)).toBe(expected);
});

test("a malformed expense does not poison totals or lose kopecks", () => {
  expect(summarizeTransactions([
    { type: "Доход", summ: "100000.50" },
    { type: "Расход", summ: "1 250,75" },
    { type: "Расход", summ: "" },
    { type: "Расход" },
    { type: "Расход", summ: "0" },
  ])).toEqual({ income: 100000.5, outcome: 1250.75, balance: 98749.75, invalidCount: 2 });
});

test("empty transactions produce zero totals", () => {
  expect(summarizeTransactions([])).toEqual({ income: 0, outcome: 0, balance: 0, invalidCount: 0 });
});
