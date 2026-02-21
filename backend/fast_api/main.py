from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from parsepdf import parse_pdf
from agents.resume_extractor import extract_resume_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/parse")
async def parse(resume: UploadFile):

    resume_text = parse_pdf(resume.file)
    resume_details_extracted = extract_resume_data(resume_text)

    return resume_details_extracted