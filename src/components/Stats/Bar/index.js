import React, { useMemo } from "react";
import { Chart } from "react-google-charts";
import styles from "./Bar.module.scss";
import { buildDailyStats } from "../../../utils/statsData";

const options = {
  title: "Доходы и расходы по дням",
  colors: ["#4CAF50", "#F44336"],
  chartArea: { left: 85, right: 25, top: 55, bottom: 100 },
  hAxis: {
    title: "Дата",
    showTextEvery: 1,
    slantedText: true,
    slantedTextAngle: 60,
    textStyle: { fontSize: 12 },
  },
  vAxis: { title: "Сумма", minValue: 0 },
  legend: { position: "top" },
};

export default function Bar({ start, end, transactions = [] }) {
  const rows = useMemo(() => buildDailyStats(transactions, start, end), [transactions, start, end]);
  const chartData = useMemo(() => [["Дата", "Доход", "Расход"], ...rows], [rows]);
  if (!rows.length) return <p>Выберите полный диапазон дат для графика.</p>;

  return (
    <div className={styles.bar_container} style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
      <div style={{ minWidth: Math.max(600, rows.length * 48 + 110), height: 420 }}>
        <Chart width="100%" height="420px" chartType="ColumnChart"
          loader={<div>Загрузка графика...</div>} data={chartData} options={options} />
      </div>
    </div>
  );
}
