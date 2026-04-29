import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import {
  getOrCreateUserPlan,
  upgradeToPremium,
  downgradeToFree,
  FREE_AI_LIMIT,
} from "../components/userPlan";

function Tariffs() {
  const [user] = useAuthState(auth);
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlan = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const data = await getOrCreateUserPlan(user);

    setPlanData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlan();
  }, [user]);

  const handlePremium = async () => {
    await upgradeToPremium(user);
    await loadPlan();
    alert("Premium-тариф подключён в демонстрационном режиме");
  };

  const handleFree = async () => {
    await downgradeToFree(user);
    await loadPlan();
    alert("Free-тариф подключён");
  };

  if (loading) {
    return <div className="section-outter">Загрузка тарифов...</div>;
  }

  return (
    <div className="tariffs section-outter">
      <h2 className="h2">Тарифы приложения</h2>

      <p className="tariffs__description">
        В приложении предусмотрена freemium-модель монетизации: базовые функции доступны бесплатно,
        а расширенные интеллектуальные возможности могут быть предоставлены по Premium-тарифу.
      </p>

      <div className="tariffs__current">
        Текущий тариф:{" "}
        <strong>{planData?.plan === "premium" ? "Premium" : "Free"}</strong>
      </div>

      <div className="tariffs__cards">
        <div className="tariff-card">
          <h3 className="h3">Free</h3>

          <p className="tariff-card__price">0 ₽ / месяц</p>

          <ul className="tariff-card__list">
            <li>Учёт доходов и расходов</li>
            <li>История операций</li>
            <li>Фильтрация и поиск</li>
            <li>Базовая статистика</li>
            <li>Лимиты расходов</li>
            <li>{FREE_AI_LIMIT} ИИ-анализа в месяц</li>
          </ul>

          <button className="button__add_transaction" onClick={handleFree}>
            Выбрать Free
          </button>
        </div>

        <div className="tariff-card tariff-card--premium">
          <h3 className="h3">Premium</h3>

          <p className="tariff-card__price">199 ₽ / месяц</p>

          <ul className="tariff-card__list">
            <li>Все функции Free</li>
            <li>ИИ-анализ без ограничений</li>
            <li>Прогноз расходов</li>
            <li>Персональные рекомендации</li>
            <li>Расширенный финансовый отчёт</li>
            <li>Приоритетное развитие функций</li>
          </ul>

          <button className="button__add_transaction" onClick={handlePremium}>
            Подключить Premium
          </button>
        </div>
      </div>

      <p className="tariffs__note">
        В рамках дипломного проекта подключение Premium-тарифа реализовано в демонстрационном режиме.
        В дальнейшем данный механизм может быть связан с платёжной системой.
      </p>
    </div>
  );
}

export default Tariffs;