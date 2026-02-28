"use client";
import './App.css'

import { useState } from "react";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import InterviewPage from "./pages/InterviewPage";

export default function App() {
  const [stage, setStage] = useState("upload");
  const [resumeData, setResumeData] = useState(null);
  const [sessionToken, setSessionToken] = useState("");
  const [interviewData, setInterviewData] = useState(null);

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
        onSessionReady={({sessionToken, interviewData}) => {
          setSessionToken(sessionToken);
          setInterviewData(interviewData);
          setStage("interview");
        }}
      />
    );
  }

  if (stage === "interview") {
    return (
      <InterviewPage
        sessionToken={sessionToken}
        interviewData={interviewData}
        onExit={() => {
          setSessionToken("");
          setResumeData(null);
          setStage("upload");
          setInterviewData(null);
        }}
      />
    );
  }

  return null;
}