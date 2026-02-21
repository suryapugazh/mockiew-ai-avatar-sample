require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
    res.send("Working fine.");
})

app.post("/session-token", async (req, res) => {

    const resumeText = req.body.data;

    const dynamicContextPrompt = `
    You are a professional technical interviewer.

    Candidate Resume:
    ${resumeText}

    Instructions:
    - Must start with their name
    - Ask one technical question at a time.
    - Keep questions concise.
    - Focus on backend and system design.
    - Wait for the user to respond before next question.
    `;

    const contextResponse = await fetch(`${API_URL}/v1/contexts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.LIVEAVATAR_API_KEY,
        },
        body: JSON.stringify({
          name: `resume_${Date.now()}`,
          opening_text: `Hello, let's begin your interview.`,
          prompt: dynamicContextPrompt,
        }),
      }
    );

    const contextData = await contextResponse.json();
    const contextId = contextData.data.id;

    const response = await fetch(`${API_URL}/v1/sessions/token`, {
        method: "POST",
        headers: {
            "X-API-KEY": process.env.LIVEAVATAR_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mode: "FULL",
            avatar_id: process.env.AVATAR_ID,
            avatar_persona: {
                voice_id: process.env.VOICE_ID,
                context_id: contextId,
                language: process.env.LANGUAGE,
            },
            is_sandbox: process.env.IS_SANDBOX,
        })
    });

    const data = await response.json();
    res.json({ session_token: data.data.session_token });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
})