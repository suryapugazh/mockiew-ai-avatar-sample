"use client";
import './App.css'

import { useState } from "react";
import ResumeUploadPage from "./components/ResumeUploadPage";
import ProcessingPage from "./components/ProcessingPage";
import InterviewPage from "./components/InterviewPage";

export default function App() {
  const [stage, setStage] = useState("upload");
  const [resumeData, setResumeData] = useState(null);
  const [sessionToken, setSessionToken] = useState("");
  if (stage === "upload") {
    return (
      <ResumeUploadPage
        onUploadSuccess={(data) => {
          setResumeData(data);
          setStage("processing");
        }}
      />
    );
  }

  if (stage === "processing") {
    return (
      <ProcessingPage
        resumeData={resumeData}
        onSessionReady={(token) => {
          setSessionToken(token);
          setStage("interview");
        }}
      />
    );
  }

  if (stage === "interview") {
    return (
      <InterviewPage
        sessionToken={sessionToken}
        onExit={() => {
          setSessionToken("");
          setResumeData(null);
          setStage("upload");
        }}
      />
    );
  }

  return null;
}