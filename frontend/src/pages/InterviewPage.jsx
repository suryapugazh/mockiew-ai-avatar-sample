"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveAvatarContextProvider,
  useSession,
  useTextChat,
  useVoiceChat,
  useLiveAvatarContext
} from "../liveavatar";

import {
  SessionState,
  AgentEventsEnum
} from "@heygen/liveavatar-web-sdk";

import { FASTAPI_URL } from "../config/apiUrls";


function AvatarUI({ onExit }) {

  const videoRef = useRef(null);
  const [message, setMessage] = useState("");

  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef([]);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const {
    sessionState,
    isStreamReady,
    startSession,
    stopSession,
    attachElement
  } = useSession();

  const { sendMessage } = useTextChat("FULL");
  const { sessionRef } = useLiveAvatarContext();

  const {
    start: startVoice,
    stop: stopVoice,
    isActive,
    isUserTalking,
    isAvatarTalking
  } = useVoiceChat();


  useEffect(() => {
    if (sessionState === SessionState.INACTIVE) {
      startSession();
    }
  }, [sessionState, startSession]);

  useEffect(() => {
    if (isStreamReady && videoRef.current) {
      attachElement(videoRef.current);
    }
  }, [isStreamReady, attachElement]);

  useEffect(() => {
    if (sessionState === SessionState.CONNECTED) {
      startVoice();
    }
  }, [sessionState, startVoice]);

  useEffect(() => {
    if (!sessionRef.current) return;

    const handleAvatarSpeech = (event) => {
      if (!event?.text) return;

      setConversation(prev => [
        ...prev,
        {
          role: "interviewer",
          text: event.text,
          timestamp: Date.now()
        }
      ]);

      console.log("Avatar:", event.text);

      const lower = event.text.toLowerCase();

      if (
        lower.includes("conclude") ||
        lower.includes("thank you") ||
        lower.includes("this ends")
      ) {
        sendTranscriptForEvaluation();
      }
    };

    const handleUserSpeech = (event) => {
      if (!event?.text) return;

      setConversation(prev => [
        ...prev,
        {
          role: "candidate",
          text: event.text,
          timestamp: Date.now()
        }
      ]);

      console.log("User:", event.text);
    };

    sessionRef.current.on(
      AgentEventsEnum.AVATAR_TRANSCRIPTION,
      handleAvatarSpeech
    );

    sessionRef.current.on(
      AgentEventsEnum.USER_TRANSCRIPTION,
      handleUserSpeech
    );

    return () => {
      sessionRef.current.off(
        AgentEventsEnum.AVATAR_TRANSCRIPTION,
        handleAvatarSpeech
      );

      sessionRef.current.off(
        AgentEventsEnum.USER_TRANSCRIPTION,
        handleUserSpeech
      );
    };

  }, [sessionRef]);

  // async function sendTranscriptForEvaluation() {

  //   if (conversation.length === 0) return;

  //   console.log("Sending transcript for evaluation...");

  //   try {
  //     const res = await fetch(`${FASTAPI_URL}/evaluate`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({
  //         transcript: conversation
  //       })
  //     });

  //     const result = await res.json();
  //     console.log("Evaluation Result:", result);

  //     setEvaluationResult(result);

  //   } catch (err) {
  //     console.error("Evaluation error:", err);
  //   }
  // }

  useEffect(() => {
    if (sessionState === SessionState.DISCONNECTED) {
      onExit();
    }
  }, [sessionState, onExit]);

  useEffect(() => {
  conversationRef.current = conversation;
  }, [conversation]);

  // useEffect(() => {
  // const timer = setTimeout(() => {
  //   console.log("---Completed---");
  //   console.log(JSON.stringify(conversationRef.current, null, 2));
  // }, 60000);

  // return () => clearTimeout(timer);
  // }, []);

  return (
    <div style={{ textAlign: "center" }}>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={900}
        style={{ background: "black" }}
      />

      <div style={{ marginTop: 20 }}>

        {/* Text */}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={() => {
            if (!message) return;
            sendMessage(message);
            setMessage("");
          }}
        >
          Send
        </button>


        {/* Voice */}
        {!isActive ? (
          <button onClick={startVoice}>
            Start Voice
          </button>
        ) : (
          <button onClick={stopVoice}>
            Stop Voice
          </button>
        )}

        {isUserTalking && <p>User Speaking...</p>}
        {isAvatarTalking && <p>Avatar Speaking...</p>}

        <button
          onClick={() => {
            stopSession();
            onExit();
          }}
        >
          Exit
        </button>
      </div>

      {/* {evaluationResult && (
        <div style={{ marginTop: 30 }}>
          <h3>Interview Evaluation</h3>
          <pre style={{ textAlign: "left" }}>
            {JSON.stringify(evaluationResult, null, 2)}
          </pre>
        </div>
      )} */}

    </div>
  );
}


export default function InterviewPage({ sessionToken, onExit }) {
  return (
    <LiveAvatarContextProvider
      sessionAccessToken={sessionToken}
      voiceChatConfig={true}
    >
      <AvatarUI onExit={onExit} />
    </LiveAvatarContextProvider>
  );
}