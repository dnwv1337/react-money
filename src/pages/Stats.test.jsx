import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Stats from "./Stats";
import { AppContext } from "../App";

jest.mock("../App", () => ({ AppContext: require("react").createContext({}) }));
jest.mock("react-datepicker", () => function DatePicker({ onChange }) {
  return <button onClick={() => onChange([new Date(2026, 10, 1), new Date(2026, 10, 30)])}>Выбрать ноябрь</button>;
});
jest.mock("react-google-charts", () => ({ Chart: ({ data, options }) => (
  <div data-testid={options.title}>{JSON.stringify(data)}</div>
) }));

test("category selection only updates charts; cards retain period totals", () => {
  const transactions = [
    { date: new Date(2026, 10, 1), type: "Доход", source: "Зарплата", summ: 1000 },
    { date: new Date(2026, 10, 30, 23), type: "Расход", source: "Транспорт", summ: "200.75" },
    { date: new Date(2026, 10, 15), type: "Расход", source: "Аптеки", summ: 50 },
  ];
  const { container } = render(<AppContext.Provider value={{ transactions }}><Stats /></AppContext.Provider>);
  fireEvent.click(screen.getByText("Выбрать ноябрь"));
  expect(container.querySelector(".outcome-count")).toHaveTextContent("250.75");
  const daily = () => JSON.parse(screen.getByTestId("Доходы и расходы по дням").textContent);
  expect(daily()).toHaveLength(31);
  fireEvent.change(screen.getByLabelText("Категория на графиках"), { target: { value: "Транспорт" } });
  expect(container.querySelector(".outcome-count")).toHaveTextContent("250.75");
  expect(container.querySelector(".income-count")).toHaveTextContent("749.25");
  expect(container.querySelectorAll(".income-count")[1]).toHaveTextContent("1000.00");
  expect(daily()).toHaveLength(31);
  expect(daily()[1]).toEqual(["2026-11-01", 0, 0]);
  expect(daily()[30]).toEqual(["2026-11-30", 0, 200.75]);
  expect(JSON.parse(screen.getByTestId("Расходы по категориям").textContent))
    .toEqual([["Категория", "Сумма"], ["Транспорт", 200.75]]);
  fireEvent.change(screen.getByLabelText("Категория на графиках"), { target: { value: "Зарплата" } });
  expect(container.querySelector(".outcome-count")).toHaveTextContent("250.75");
  expect(container.querySelector(".income-count")).toHaveTextContent("749.25");
  expect(daily()[1]).toEqual(["2026-11-01", 1000, 0]);
  expect(daily()[30]).toEqual(["2026-11-30", 0, 0]);
  fireEvent.change(screen.getByLabelText("Категория на графиках"), { target: { value: "" } });
  expect(container.querySelector(".outcome-count")).toHaveTextContent("250.75");
});
