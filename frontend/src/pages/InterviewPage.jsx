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

import EyeTracker from "../components/EyeTracker";


function AvatarUI({ interviewData, onExit, onEvaluationStart }) {

  const videoRef = useRef(null);
  const [message, setMessage] = useState("");

  const [inputMode, setInputMode] = useState("voice");

  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef([]);

  const lastInterviewerTimestampRef = useRef(null);
  const avatarStoppedTimestampRef = useRef(null);

  // WEB API AUDIO---
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  const silenceStartRef = useRef(null);
  const totalSilenceDurationRef = useRef(0);
  const longSilenceCountRef = useRef(0);
  // ---
 
  const [gazeMetrics, setGazeMetrics] = useState({
    totalFrames: 0,
    centerFrames: 0,
  });
  const gazeRef = useRef(gazeMetrics);

  const summaryRef = useRef(null);

  const interviewCompletedRef = useRef(false);


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

  function handleStartVoice() {
    startVoice();
    setInputMode("voice");
  }

  function handleStopVoice() {
    stopVoice();
    setInputMode("text");
    silenceStartRef.current = null; 
  }

  useEffect(() => {
    if (sessionState === SessionState.CONNECTED) {
      handleStartVoice();
    }
  }, [sessionState, startVoice]);

  useEffect(() => {
  console.log("Session State Changed:", sessionState);
  }, [sessionState]);

  useEffect(() => {
    if (!sessionRef.current) return;

    const handleAvatarSpeech = (event) => {
      if (!event?.text) return;

      const now = Date.now();

      lastInterviewerTimestampRef.current = now;

      setConversation(prev => [
        ...prev,
        {
          role: "interviewer",
          text: event.text,
          timestamp: now
        }
      ]);

      // console.log("Avatar:", event.text);

      const lower = event.text.toLowerCase();

      const isFinalClosing =
        lower.includes("this concludes our mock interview") ||
        lower.includes("this concludes our interview") ||
        lower.includes("this concludes the interview") ||
        lower.includes("thank you for your responses") ||
        lower.includes("have a great day");

      if (isFinalClosing) {
        stopVoice();
        stopSession();
        handleInterviewCompletion("avatar_completed");
      }
    };

    const handleUserSpeech = (event) => {
      console.log("Voice Event:", event.text);
      if (!isActive) return;
      if (inputMode !== "voice") return;
      if (!event?.text) return;

      const now = Date.now();

      const wordCount = event.text.trim().split(/\s+/).length;

      let responseDelay = null;

      if (avatarStoppedTimestampRef.current) {
          responseDelay = now - avatarStoppedTimestampRef.current;
      }

      setConversation(prev => [
        ...prev,
        {
          role: "candidate",
          text: event.text,
          timestamp: now,
          wordCount,
          responseDelayMs: responseDelay,
          mode: "voice"
        }
      ]);

      // console.log("User:", event.text);
      // console.log("Word Count:", wordCount);
      // console.log("Response Delay (ms):", responseDelay);
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

  function handleTextSend() {
      if (!message.trim()) return;

      const wordCount = message.trim().split(/\s+/).length;

      setConversation(prev => [
        ...prev,
        {
          role: "candidate",
          text: message,
          timestamp: Date.now(),
          wordCount,
          responseDelayMs: 0,
          mode: "text"
        }
      ]);

      sendMessage(message);
      setMessage("");
}

  useEffect(() => {
    if (!isAvatarTalking) {
      avatarStoppedTimestampRef.current = Date.now();
    }
  }, [isAvatarTalking]);

  useEffect(() => {
  if (!isActive) return; // voice chat active

  const setupAudioAnalysis = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    monitorAudio();
  };

  setupAudioAnalysis();

}, [isActive]);

const monitorAudio = () => {
  if (inputMode !== "voice") {
    requestAnimationFrame(monitorAudio);
    return;
  }

  if (!analyserRef.current) {
    requestAnimationFrame(monitorAudio);
    return;
  }

  analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);

  let sum = 0;
  for (let i = 0; i < dataArrayRef.current.length; i++) {
    sum += dataArrayRef.current[i] * dataArrayRef.current[i];
  }

  const rms = Math.sqrt(sum / dataArrayRef.current.length);

  const silenceThreshold = 0.01;
  const now = Date.now();

  if (rms < silenceThreshold) {
    if (!silenceStartRef.current) {
      silenceStartRef.current = now;
    }
  } else {
    if (silenceStartRef.current) {
      const silenceDuration = now - silenceStartRef.current;

      totalSilenceDurationRef.current += silenceDuration;

      if (silenceDuration > 800) {
        longSilenceCountRef.current += 1;
      }

      silenceStartRef.current = null;
    }
  }

  requestAnimationFrame(monitorAudio);
};

useEffect(() => {
  return () => {
    audioContextRef.current?.close();
  };
}, []);

  useEffect(() => {
    gazeRef.current = gazeMetrics;
  }, [gazeMetrics]);

  // Compute all metrics
  const computeInterviewSummary = () => {

  const transcript = conversationRef.current;

  // gaze
  const total = gazeRef.current.totalFrames;
  const center = gazeRef.current.centerFrames;

  const attentionPercentage =
    total > 0 ? (center / total) * 100 : 0;

  const eyeContactScore =
    (attentionPercentage / 100) * 10;

  // communication
  const candidateResponses = transcript.filter(
    msg => msg.role === "candidate"
  );

  const voiceResponses = candidateResponses.filter(
    msg => msg.mode === "voice"
  );

  const textResponses = candidateResponses.filter(
    msg => msg.mode === "text"
  );

  const totalAnswers = candidateResponses.length;

  const totalWords = candidateResponses.reduce(
    (sum, msg) => sum + (msg.wordCount || 0),
    0
  );

  const totalDelay = candidateResponses.reduce(
    (sum, msg) => sum + (msg.responseDelayMs || 0),
    0
  );

  const avgWords =
    totalAnswers > 0 ? totalWords / totalAnswers : 0;

  const avgDelayMs =
    totalAnswers > 0 ? totalDelay / totalAnswers : 0;

  const shortAnswers = candidateResponses.filter(
    msg => msg.wordCount <= 2
  ).length;

  const longDelays = candidateResponses.filter(
    msg => msg.responseDelayMs > 3000
  ).length;

  // audio
  const totalSilence =
    totalSilenceDurationRef.current;

  const longSilenceCount =
    longSilenceCountRef.current;

  const silenceMs =
  voiceResponses.length > 0
    ? totalSilence : 0;
  
  const longSilence =
  voiceResponses.length > 0
    ? longSilenceCount : 0;

  const summary = {
    gaze: {
      totalFrames: total,
      centerFrames: center,
      attention_percentage: attentionPercentage,
      eye_contact_score: eyeContactScore
    },
    communication_metrics: {
      avg_words: avgWords,
      avg_delay_ms: avgDelayMs,
      short_answers: shortAnswers,
      long_hesitations: longDelays,
      total_silence_ms: silenceMs,
      long_silence_count: longSilence
    },
    interaction_summary: {
      voice_answers: voiceResponses.length,
      text_answers: textResponses.length,
      voice_ratio:
        candidateResponses.length > 0
          ? voiceResponses.length / candidateResponses.length : 0
    }
  };

  summaryRef.current = summary;

  return summary;
};

const minimalResume = {
  skills: interviewData?.skills || [],
  projects: (interviewData?.projects || []).map(p => ({
    name: p.name,
    technologies: p.technologies || []
  }))
};

  // Call for evaluation
async function sendTranscriptForEvaluation() {

  if (conversationRef.current.length === 0) return;

  const summary = summaryRef.current || computeInterviewSummary();

  const payload = {
    resume: minimalResume,
    transcript: conversationRef.current,
    ...summary
  };

  onEvaluationStart(payload);

}
  useEffect(() => {
    if (sessionState === SessionState.DISCONNECTED) {
      stopVoice();
      stopSession();
      handleInterviewCompletion("disconnected");
    }
  }, [sessionState, onExit]);

  useEffect(() => {
  conversationRef.current = conversation;
  }, [conversation]);

  const handleInterviewCompletion = (reason) => {
  if (interviewCompletedRef.current) return;

  interviewCompletedRef.current = true;

  console.log("Interview completed due to:", reason);

  sendTranscriptForEvaluation();
};

  // Pre-evaluate
  useEffect(() => {
  const timer = setTimeout(() => {

    const summary = computeInterviewSummary();

    console.log("Interview Completed...");
    console.log("Transcript:");
    console.log(JSON.stringify(conversationRef.current, null, 2));
    console.log("Summary:", summary);

    stopVoice();
    stopSession();
    handleInterviewCompletion("timeout");

  }, 60000);

  return () => clearTimeout(timer);
}, []);

  return (
    <div style={{ textAlign: "center" }}>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={854}
        height={480}
        style={{
          // display: isStreamReady ? "block" : "none"
          backgroundImage: 'url("/avatar.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* {!isStreamReady && (
        <img
          src="/avatar.png"
          width={900}
          style={{ borderRadius: "10px" }}
        />
      )} */}

       <EyeTracker onMetricsUpdate={setGazeMetrics} />

      <div style={{ marginTop: 20 }}>

      {inputMode === "text" && (
        <>
        {/* Text */}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleTextSend();
            }
          }}
        />
        <button
          onClick={handleTextSend}>
          Send
        </button>
        </>
      )}

        {/* Voice */}
        {inputMode === "text" ? (
          <button onClick={handleStartVoice}>
            Start Voice
          </button>
        ) : (
          <button onClick={handleStopVoice}>
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
    </div>
  );
}


export default function InterviewPage({
  sessionToken,
  interviewData,
  onEvaluationStart,
  onExit
}) {
  return (
    <LiveAvatarContextProvider
      sessionAccessToken={sessionToken}
      voiceChatConfig={true}
    >
      <AvatarUI
        interviewData={interviewData}
        onExit={onExit}
        onEvaluationStart={onEvaluationStart}
      />
    </LiveAvatarContextProvider>
  );
}