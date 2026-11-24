// src/components/FileUpload.js
import React from "react";

function FileUpload({ onFileSelect }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const fileName = file?.name?.toLowerCase() || "";
    const isAllowedFile = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (file && isAllowedFile) {
      onFileSelect(file);
    } else {
      alert("Пожалуйста, загрузите файл формата Excel или CSV.");
    }
  };

  return (
    <div>
      <input
        className="file-upload-input"
        type="file"
        accept=".xlsx,.xls,.csv,text/csv"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default FileUpload;
