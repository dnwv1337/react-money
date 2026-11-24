import React, { useState, useContext, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Bar from "../components/Stats/Bar";
import { AppContext } from "../App"; // Путь к AppContext
import PieChartsContainer from "../components/Stats/Pie";
import { summarizeTransactions } from "../utils/transactionAmount";

import { filterStatsTransactions, transactionCategory } from "../utils/statsData";

export default function Stats() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const { transactions } = useContext(AppContext); // Получаем транзакции из контекста
  const [startDate, setStartDate] = useState(yesterday);
  const [endDate, setEndDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState("");
  const categories = useMemo(() => [...new Set(transactions.map(transactionCategory))]
    .sort((a, b) => a.localeCompare(b, "ru")), [transactions]);
  const periodTransactions = useMemo(() => filterStatsTransactions(
    transactions, startDate, endDate
  ), [transactions, startDate, endDate]);
  const chartTransactions = useMemo(() => periodTransactions.filter((transaction) =>
    !selectedCategory || transactionCategory(transaction) === selectedCategory
  ), [periodTransactions, selectedCategory]);
  const { income: totalIncome, outcome: totalOutcome, balance, invalidCount: invalidAmountCount } =
    summarizeTransactions(periodTransactions);

  const onChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="stats-container">
      <div className="stats-card">
        <h2 className="stats-title">Статистика</h2>

        <div className="stats-filters">
        <div className="date-picker-container">
          <DatePicker
            selected={startDate}
            onChange={onChange}
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd/MM/yyyy"
            selectsRange
            className="date-picker"
            placeholderText="Выберите диапазон дат"
          />
        </div>


        </div>

        <div className="selected-dates">
          {startDate && endDate ? (
            <p>
              Выбранный диапазон:{" "}
              <span className="date-highlight">
                {startDate.toLocaleDateString()} -{" "}
                {endDate.toLocaleDateString()}
              </span>
            </p>
          ) : (
            <p>Выберите даты</p>
          )}
        </div>
      </div>

      {invalidAmountCount > 0 && (
        <p role="alert">
          Операций с некорректной суммой: {invalidAmountCount}. Они не включены в
          расчёт. Проверьте суммы на странице операций.
        </p>
      )}
      <div className="stats-info">
        <div className="income">
          <img src="/img/balance.svg" alt="" className="income-img" />
          <span className="income-text">Баланс</span>
          <div className="income__container">
            <span className="income-count">{balance.toFixed(2)}</span>
            <span className="income-percent">
              {totalIncome > 0
                ? balance >= 0
                  ? `+${((balance / totalIncome) * 100).toFixed(2)}%`
                  : `-${((Math.abs(balance) / totalIncome) * 100).toFixed(2)}%`
                : "0.00%"}
            </span>
          </div>
        </div>
        <div className="income">
          <img src="/img/stats-income.svg" alt="" className="income-img" />
          <span className="income-text">Общий доход</span>
          <div className="income__container">
            <span className="income-count">{totalIncome.toFixed(2)}</span>
            <span className="income-percent">+1,29%</span>
          </div>
        </div>
        <div className="outcome">
          <img src="/img/stats-outcome.svg" alt="" className="outcome-img" />
          <span className="outcome-text">Общий расход</span>
          <div className="outcome__container">
            <span className="outcome-count">{totalOutcome.toFixed(2)}</span>
            <span className="outcome-percent">+1,29%</span>
          </div>
        </div>
      </div>
      <div className="stats_container">
        <div className="stats-filters">
        <label className="stats-category-filter" htmlFor="stats-category">
          <span>Категория на графиках</span>
          <select id="stats-category" value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        </div>
        <Bar start={startDate} end={endDate} transactions={chartTransactions} />
        <PieChartsContainer transactions={chartTransactions} />
      </div>
    </div>
  );
}
