export function buildFinanceSummary(transactions) {
  const summary = {
    totalIncome: 0,
    totalOutcome: 0,
    balance: 0,
    byCategory: {},
    byMonth: {},
    operationsCount: transactions.length,
  };

  transactions.forEach((transaction) => {
    const amount = Number(transaction.summ || transaction.amount || 0);
    const type = transaction.type;
    const category = transaction.category || transaction.source || "Без категории";

    let date;

    if (transaction.date?.toDate) {
      date = transaction.date.toDate();
    } else {
      date = new Date(transaction.date);
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!summary.byMonth[monthKey]) {
      summary.byMonth[monthKey] = {
        income: 0,
        outcome: 0,
      };
    }

    if (type === "Доход") {
      summary.totalIncome += amount;
      summary.byMonth[monthKey].income += amount;
    }

    if (type === "Расход") {
      summary.totalOutcome += amount;
      summary.byMonth[monthKey].outcome += amount;

      if (!summary.byCategory[category]) {
        summary.byCategory[category] = 0;
      }

      summary.byCategory[category] += amount;
    }
  });

  summary.balance = summary.totalIncome - summary.totalOutcome;

  return summary;
}

export function createFinancePrompt(summary) {
  return `
Ты выступаешь как интеллектуальный финансовый помощник внутри веб-приложения для учёта личных финансов.

Проанализируй агрегированные финансовые данные пользователя и сформируй понятный отчёт на русском языке.

Важно:
- не выдумывай точные операции;
- анализируй только переданные суммы;
- не давай инвестиционных советов;
- рекомендации должны быть бытовыми и понятными;
- ответ должен быть структурированным.

Данные пользователя:
${JSON.stringify(summary, null, 2)}

Сформируй ответ в таком формате:

1. Общий вывод
2. Основные категории расходов
3. Динамика расходов по месяцам
4. Риск превышения бюджета
5. Прогноз на следующий месяц
6. Рекомендации по оптимизации расходов
`;
}