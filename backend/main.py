from fastapi import FastAPI, UploadFile, Body, File
from fastapi.middleware.cors import CORSMiddleware
import json
from utils.parsepdf import parse_pdf
from agents.resume_extractor import extract_resume_data
from services.heygen_service import create_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/parse")
async def parse(resume: UploadFile = File(...)):
    resume_text = parse_pdf(resume.file)
    resume_details_extracted = extract_resume_data(resume_text)

    structured_data = json.loads(resume_details_extracted)

    return structured_data

@app.post("/create-session")
async def create_avatar_session(data: dict = Body(...)):
    name = data.get("name")
    questions = data.get("questions", [])

    session_token = await create_session(name, questions)

    return {"session_token": session_token}