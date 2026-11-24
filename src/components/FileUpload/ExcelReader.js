import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { db, collection, addDoc } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { Timestamp } from "firebase/firestore";
import { setDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";

const parseDate = (value) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const { y, m, d } = XLSX.SSF.parse_date_code(value);
    return new Date(y, m - 1, d);
  }
  if (typeof value === "string") {
    const valueWithoutTimeZone = value.trim().split(" ")[0];
    const parts = valueWithoutTimeZone.split(/[./-]/);
    if (parts.length === 3 && parts.every(Boolean)) {
      const [first, second, third] = parts.map(Number);
      if (String(parts[0]).length === 4) {
        return new Date(first, second - 1, third);
      }
      return new Date(third, second - 1, first);
    }
  }
  return new Date(value);
};

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");

const normalizeAmount = (value) => {
  if (typeof value === "number") return value;
  const normalized = String(value || "0")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  return Number(normalized) || 0;
};

const getRowValue = (row, possibleHeaders) => {
  const normalizedHeaders = Object.keys(row).reduce((acc, key) => {
    acc[normalizeHeader(key)] = key;
    return acc;
  }, {});

  const foundHeader = possibleHeaders.find((header) => normalizedHeaders[header]);
  return foundHeader ? row[normalizedHeaders[foundHeader]] : "";
};

const getTransactionId = (row, index, userId) => {
  const sourceId = getRowValue(row, [
    "код авторизации",
    "id",
    "идентификатор",
    "номер операции",
    "operation id",
  ]);

  if (sourceId) {
    return String(sourceId).replace(/[^\w-]/g, "_");
  }

  return `import_${userId}_${Date.now()}_${index}`;
};

const detectDelimiter = (line) => {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return semicolonCount >= commaCount ? ";" : ",";
};

const parseCsvText = (text) => {
  const cleanText = text.replace(/^\uFEFF/, "");
  const firstLine = cleanText.split(/\r?\n/).find(Boolean) || "";
  const delimiter = detectDelimiter(firstLine);
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i += 1) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"' && nextChar === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === delimiter && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);

  if (rows.length < 2) return [];

  const headers = rows[0];
  return rows.slice(1).map((values) =>
    headers.reduce((acc, header, index) => {
      acc[header] = values[index] || "";
      return acc;
    }, {})
  );
};

const hasKnownHeaders = (text) => {
  const firstLine = text.split(/\r?\n/).find(Boolean) || "";
  const normalizedLine = normalizeHeader(firstLine);

  return (
    normalizedLine.includes("дата") ||
    normalizedLine.includes("сумма") ||
    normalizedLine.includes("категория") ||
    normalizedLine.includes("amount")
  );
};

const decodeCsvBuffer = (buffer) => {
  const utf8Text = new TextDecoder("utf-8").decode(buffer);

  if (hasKnownHeaders(utf8Text)) {
    return utf8Text;
  }

  try {
    const windowsText = new TextDecoder("windows-1251").decode(buffer);
    if (hasKnownHeaders(windowsText)) {
      return windowsText;
    }
  } catch (error) {
    console.error("Ошибка декодирования CSV:", error);
  }

  return utf8Text;
};

const formatTransaction = (row, index, userId) => {
  const dateValue = getRowValue(row, [
    "дата операции (мск)",
    "дата операции",
    "дата",
    "date",
    "transaction date",
  ]);
  const incomeValue = getRowValue(row, ["доход", "приход", "зачисление"]);
  const outcomeValue = getRowValue(row, ["расход", "списание"]);
  const amountValue =
    getRowValue(row, [
      "сумма в валюте счета",
      "сумма в валюте счета",
      "сумма операции",
      "сумма",
      "amount",
    ]) ||
    incomeValue ||
    outcomeValue;

  const signedAmount = outcomeValue
    ? -Math.abs(normalizeAmount(outcomeValue))
    : normalizeAmount(amountValue);
  const explicitType = getRowValue(row, ["тип", "type"]);
  const type =
    explicitType === "Доход" || explicitType === "Расход"
      ? explicitType
      : signedAmount < 0
      ? "Расход"
      : "Доход";

  return {
    date: Timestamp.fromDate(parseDate(dateValue)),
    type,
    source:
      getRowValue(row, ["категория", "category", "источник"]) || "Остальное",
    description:
      getRowValue(row, [
        "описание операции",
        "описание",
        "назначение платежа",
        "детали",
        "description",
      ]) || "Импортированная операция",
    summ: Math.abs(signedAmount),
    currency:
      getRowValue(row, ["валюта", "currency", "валюта счета"]) || "rub",
    user_id: userId,
    id: getTransactionId(row, index, userId),
  };
};

function ExcelReader({ file, onDataLoad, onTransactionsSaved, onImportStatus }) {
  const [data, setData] = useState([]);
  const [user] = useAuthState(auth);

  const addTransaction = useCallback(async (id, newTr) => {
    try {
      if (id) {
        const ref = doc(db, "transactions", String(id));
        await setDoc(ref, newTr);
        return String(id);
      }

      const ref = await addDoc(collection(db, "transactions"), newTr);
      return ref.id;
    } catch (error) {
      console.error("Ошибка при добавлении:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (data.length > 0 && onDataLoad) {
      onDataLoad(data);
    }
  }, [data, onDataLoad]);

  const saveImportedRows = useCallback(async (rows) => {
    const formattedData = rows
      .map((row, index) => formatTransaction(row, index, user.uid))
      .filter((transaction) => transaction.summ > 0);
    const savedTransactions = [];

    if (!formattedData.length) {
      if (onImportStatus) {
        onImportStatus(
          "Не удалось распознать операции. Проверьте заголовки колонок и сумму."
        );
      }
      setData([]);
      return;
    }

    for (const transaction of formattedData) {
      const { id, ...transactionData } = transaction;
      const savedId = await addTransaction(id, transactionData);

      if (savedId) {
        savedTransactions.push({ ...transactionData, id: savedId });
      }
    }

    setData(savedTransactions);
    if (onTransactionsSaved) {
      onTransactionsSaved(savedTransactions);
    }
    if (onImportStatus) {
      onImportStatus(`Импортировано операций: ${savedTransactions.length}`);
    }
  }, [addTransaction, onImportStatus, onTransactionsSaved, user]);

  const readExcelFile = useCallback((file) => {
    if (onImportStatus) {
      onImportStatus("Обработка Excel-файла...");
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const ab = e.target.result;
      const wb = XLSX.read(ab, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      await saveImportedRows(jsonData);
    };
    reader.readAsArrayBuffer(file);
  }, [onImportStatus, saveImportedRows]);

  const readCsvFile = useCallback((file) => {
    if (onImportStatus) {
      onImportStatus("Обработка CSV-файла...");
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = decodeCsvBuffer(e.target.result);
      const rows = parseCsvText(csvText);
      await saveImportedRows(rows);
    };
    reader.readAsArrayBuffer(file);
  }, [onImportStatus, saveImportedRows]);

  useEffect(() => {
    if (file && user) {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        readCsvFile(file);
      } else {
        readExcelFile(file);
      }
    }
  }, [file, readCsvFile, readExcelFile, user]);

  return <div></div>;
}

export default ExcelReader;
