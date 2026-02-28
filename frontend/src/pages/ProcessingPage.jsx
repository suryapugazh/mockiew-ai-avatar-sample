import { useEffect, useRef } from "react";
import { FASTAPI_URL } from "../config/apiUrls";

export default function ProcessingPage({ resumeData, onSessionReady }) {

  const hasProcessed = useRef(false);

  useEffect(() => {

    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    async function processResume() {

    const formData = new FormData();
    formData.append("resume", resumeData);

    const parseRes = await fetch(`${FASTAPI_URL}/parse`, {
      method: "POST",
      body: formData
    });
    
    const data = await parseRes.json();

    const res = await fetch(`${FASTAPI_URL}/create-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        questions: data.questions
      })
    });

    const { session_token } = await res.json();

    onSessionReady({
      sessionToken: session_token,
      interviewData: data
    });
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