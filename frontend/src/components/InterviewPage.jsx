"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveAvatarContextProvider,
  useSession,
  useTextChat,
  useVoiceChat
} from "../liveavatar";
import { SessionState } from "@heygen/liveavatar-web-sdk";

function AvatarUI({ onExit }) {
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
    if (sessionState === SessionState.DISCONNECTED) {
      onExit();
    }
  }, [sessionState, onExit]);

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

        {/* Indicators */}
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
    </div>
  );
}

export default function InterviewPage({ sessionToken, onExit }) {
  return (
    <LiveAvatarContextProvider
      sessionAccessToken={sessionToken}
      voiceChatConfig={false}
    >
      <AvatarUI onExit={onExit} />
    </LiveAvatarContextProvider>
  );
}