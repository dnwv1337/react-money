import React, { useEffect, useState } from "react";
import { Chart } from "react-google-charts";
import { parseTransactionAmount } from "../../../utils/transactionAmount";
import { transactionCategory } from "../../../utils/statsData";

// Настройки графиков с различными цветами
const options = (title, colors) => ({
  title,
  pieHole: 0.4,
  colors, // Используем переданную палитру цветов
  legend: {
    position: "right",
    alignment: "center",
    textStyle: {
      fontSize: 14,
      color: "#333",
    },
  },
});

function PieChart({ transactions, type, colors }) {
  const [chartData, setChartData] = useState([["Категория", "Сумма"]]);

  useEffect(() => {
    const groupedData = new Map();
    transactions.forEach((transaction) => {
      if (transaction.type !== type) return;
      const category = transactionCategory(transaction);
      groupedData.set(category, (groupedData.get(category) || 0) +
        (parseTransactionAmount(transaction.summ) ?? 0));
    });

    const dataArray = [["Категория", "Сумма"]];
    [...groupedData.entries()].forEach(([category, sum]) => {
      if (sum > 0) dataArray.push([category, sum]);
    });

    if (dataArray.length === 1) {
      dataArray.push(["Нет данных", 1]);
    }

    setChartData(dataArray);
  }, [transactions, type]);

  return (
    <div style={{ width: "100%", height: "400px", marginBottom: "30px" }}>
      <Chart
        width="100%"
        height="400px"
        chartType="PieChart"
        loader={<div>Загрузка графика...</div>}
        data={chartData}
        options={options(
          type === "Доход" ? "Доходы по категориям" : "Расходы по категориям",
          colors
        )}
      />
    </div>
  );
}

export default function PieChartsContainer({ transactions = [] }) {
  return (
    <>
      <PieChart
        transactions={transactions}
        type="Доход"
        colors={[
          "#4CAF50", // Зеленый для зарплаты
          "#81C784", // Бледно-зеленый для дополнительного дохода
          "#FFEB3B", // Желтый для соц. выплат
          "#8BC34A", // Лаймовый для остального дохода
        ]}
      />
      <PieChart
        transactions={transactions}
        type="Расход"
        colors={[
          "#F44336", // Ярко-красный для супермаркетов
          "#E57373", // Бледно-красный для переводов
          "#FF9800", // Оранжевый для фастфуда
          "#9C27B0", // Пурпурный для одежды
          "#3F51B5", // Синий для мобильной связи
          "#00BCD4", // Бирюзовый для аптек
          "#8BC34A", // Лаймовый для транспорта
          "#C62828", // Темно-красный для остального
        ]}
      />
    </>
  );
}
