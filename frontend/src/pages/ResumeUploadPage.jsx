import { useState } from "react";

export default function ResumeUploadPage({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const handleFile = async (file) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }

    onUploadSuccess(file);
  };

  return (
    <div
      className={`fullscreen-center upload-container ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
      }}
    >
      <h2>Drag & Drop Resume (PDF)</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}