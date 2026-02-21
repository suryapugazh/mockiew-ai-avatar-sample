import { useEffect } from "react";
import { FASTAPI_URL, EXPRESS_URL } from "../config/apiUrls";

export default function ProcessingPage({ resumeData, onSessionReady }) {
  useEffect(() => {
    async function processResume() {

    const formData = new FormData();
    formData.append("resume", resumeData);

    const parseRes = await fetch(`${FASTAPI_URL}/parse`, {
      method: "POST",
      body: formData
    });
    
    const data = await parseRes.json();

    const res = await fetch(`${EXPRESS_URL}/session-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data })
    });

    const { session_token } = await res.json();
      onSessionReady(session_token);
    }

    processResume();
  }, [resumeData, onSessionReady]);

  return (
    <div className="fullscreen-center">

      <h2>Analyzing Resume...</h2>
      <p>Preparing your AI interviewer</p>
      <div className="loader"></div>

    </div>
  );
}