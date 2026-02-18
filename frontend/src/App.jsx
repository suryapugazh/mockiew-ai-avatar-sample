"use client";

import { useState, useEffect, useRef } from "react";
import {
  LiveAvatarContextProvider,
  useSession,
  useTextChat
} from "./liveavatar";
import { SessionState } from "@heygen/liveavatar-web-sdk";

function AvatarUI({ onSessionStopped }) {
  const videoRef = useRef(null);
  const [message, setMessage] = useState("");

  const {
    sessionState,
    isStreamReady,
    startSession,
    stopSession,
    attachElement
  } = useSession();

  const { sendMessage } = useTextChat("FULL");

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
    if (sessionState === SessionState.DISCONNECTED) {
      onSessionStopped();
    }
  }, [sessionState, onSessionStopped]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={1080}
        style={{ background: "black" }}
      />

      <div>
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

        <button onClick={stopSession}>
          Stop
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [sessionToken, setSessionToken] = useState("");

  const start = async () => {
    const res = await fetch("http://localhost:3000/session-token", {
      method: "POST"
    });

    const { session_token } = await res.json();

    console.log("Received Token:", session_token);

    setSessionToken(session_token);
  };

  const resetSession = () => {
    setSessionToken("");
  };

  if (!sessionToken) {
    return <button onClick={start}>Start</button>;
  }

  return (
    <LiveAvatarContextProvider
      sessionAccessToken={sessionToken}
      voiceChatConfig={false}
    >
      <AvatarUI onSessionStopped={resetSession} />
    </LiveAvatarContextProvider>
  );
}
