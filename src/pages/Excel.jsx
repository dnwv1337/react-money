import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import FileUpload from "../components/FileUpload/FileUpload";
import ExcelReader from "../components/FileUpload/ExcelReader";
import TransactionsTable from "../components/TransactionsTable";

const getDateValue = (date) => {
  if (!date) return "";
  if (typeof date === "object" && typeof date.toDate === "function") {
    return date.toDate();
  }
  if (typeof date === "object" && date.seconds) {
    return new Date(date.seconds * 1000);
  }

  return new Date(date);
};

const formatDateForCsv = (date) => {
  const dateValue = getDateValue(date);
  if (!dateValue || Number.isNaN(dateValue.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateValue);
};

const escapeCsvCell = (value) => {
  const cell = String(value ?? "");
  if (/[;"\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }

  return cell;
};

const downloadCsv = (transactions) => {
  if (!transactions.length) {
    alert("Нет операций для экспорта.");
    return;
  }

  const headers = [
    "ДАТА ОПЕРАЦИИ (МСК)",
    "Тип",
    "КАТЕГОРИЯ",
    "Описание операции",
    "СУММА В ВАЛЮТЕ СЧЁТА",
    "Валюта",
    "Код авторизации",
  ];
  const rows = transactions.map((transaction) => {
    const signedAmount =
      transaction.type === "Расход"
        ? -Math.abs(Number(transaction.summ))
        : Math.abs(Number(transaction.summ));

    return [
      formatDateForCsv(transaction.date),
      transaction.type,
      transaction.source,
      transaction.description,
      signedAmount,
      transaction.currency || "rub",
      transaction.id || "",
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `finance_operations_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function Excel() {
  const { transactions, setTransactions } = useOutletContext();
  const [excelFile, setExcelFile] = useState(null);
  const [importedTransactions, setImportedTransactions] = useState([]);
  const [importStatus, setImportStatus] = useState("");

  const handleDataLoad = (data) => {
    setImportedTransactions(data);
  };

  const handleTransactionsSaved = (savedTransactions) => {
    setTransactions((prev) => {
      const savedIds = new Set(savedTransactions.map((item) => item.id));
      const withoutDuplicates = prev.filter((item) => !savedIds.has(item.id));
      return [...savedTransactions, ...withoutDuplicates];
    });
  };

  return (
    <div className="excel-container">
      <h1 className="excel-title">Импорт и экспорт данных</h1>
      <div className="excel-actions">
        <button
          className="button__add_transaction"
          onClick={() => downloadCsv(transactions)}
        >
          Экспорт в CSV
        </button>
      </div>
      <p className="excel-description">
        Загрузите выписку в формате Excel или CSV. Для CSV поддерживаются
        банковские колонки с датой, суммой, категорией, описанием и валютой.
      </p>
      <FileUpload onFileSelect={setExcelFile} />
      {importStatus && <p className="excel-status">{importStatus}</p>}
      {excelFile && (
        <ExcelReader
          file={excelFile}
          onDataLoad={handleDataLoad}
          onTransactionsSaved={handleTransactionsSaved}
          onImportStatus={setImportStatus}
        />
      )}
      {importedTransactions.length > 0 && (
        <>
          <h2 className="excel-subtitle">Импортированные данные</h2>
          <TransactionsTable transactions={importedTransactions} />
        </>
      )}
    </div>
  );
}

export default Excel;
