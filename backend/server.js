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
                context_id: process.env.CONTEXT_ID,
                language: process.env.LANGUAGE,
            },
            is_sandbox: process.env.IS_SANDBOX
        })
    });

    const data = await response.json();
    res.json({ session_token: data.data.session_token });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
})