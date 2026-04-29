import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { aiModel } from "../firebase";
import { buildFinanceSummary, createFinancePrompt } from "../components/financeAi";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import {
  getOrCreateUserPlan,
  canUseAiAnalysis,
  registerAiRequest,
} from "../components/userPlan";

function AiAssistant() {
  const { transactions } = useOutletContext();
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [user] = useAuthState(auth);
  const [planData, setPlanData] = useState(null);
  useEffect(() => {
    const loadPlan = async () => {
        if (!user) {
        return;
        }

        const data = await getOrCreateUserPlan(user);
        setPlanData(data);
    };

    loadPlan();
    }, [user]);
  const handleAnalyze = async () => {
    const actualPlan = await getOrCreateUserPlan(user);

    if (!canUseAiAnalysis(actualPlan)) {
    alert("Лимит бесплатных ИИ-анализов исчерпан. Подключите Premium-тариф.");
    setPlanData(actualPlan);
    return;
    }
    await registerAiRequest(user, actualPlan);

    const updatedPlan = await getOrCreateUserPlan(user);
    setPlanData(updatedPlan);
    if (!transactions || transactions.length === 0) {
      alert("Нет данных для анализа. Сначала добавь финансовые операции.");
      return;
    }

    try {
      setLoading(true);
      setAnalysis("");

      const financeSummary = buildFinanceSummary(transactions);
      setSummary(financeSummary);

      const prompt = createFinancePrompt(financeSummary);

      const result = await aiModel.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      setAnalysis(text);
    } catch (error) {
      console.error("Ошибка ИИ-анализа:", error);
      alert("Не удалось сформировать ИИ-анализ. Проверь Firebase AI Logic и подключение.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant section-outter">
      <h2 className="h2">ИИ-помощник по личным финансам</h2>

      <p className="ai-assistant__description">
        Модуль анализирует доходы и расходы пользователя, определяет основные категории трат,
        оценивает динамику расходов и формирует рекомендации по оптимизации бюджета.
      </p>

      <button className="button__add_transaction" onClick={handleAnalyze} disabled={loading}>
        {loading ? "Формируется анализ..." : "Сформировать ИИ-анализ"}
      </button>

      {summary && (
        <div className="ai-assistant__summary">
          <h3 className="h3">Сводка данных</h3>

          <p>Количество операций: {summary.operationsCount}</p>
          <p>Доходы: {summary.totalIncome} руб.</p>
          <p>Расходы: {summary.totalOutcome} руб.</p>
          <p>Баланс: {summary.balance} руб.</p>
        </div>
      )}

      {analysis && (
        <div className="ai-assistant__result">
          <h3 className="h3">Результат интеллектуального анализа</h3>
          <pre>{analysis}</pre>
        </div>
      )}
    </div>
  );
}



export default AiAssistant;