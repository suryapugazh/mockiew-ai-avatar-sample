EXTRACT_CANDIDATE_DETAILS = """
You are an expert in resume screening.

Extract the following fields from the resume text:

- name (string)
- email (string)
- phone (string)
- education (string or null)
- work_experience (integer or null)
- skills (list of strings)
- certifications (list of strings)
- internships (string or null)

Return ONLY a valid JSON object.
Use null if a value is missing.
Do not include explanations.
Do not wrap in markdown.

Resume text:
{resume_text}

Expected JSON format:
{{
"name": "John Doe",
"email": "abc@gmail.com",
"phone": "1234567890",
"education": "Bachelor of Science in Computer Science",
"work_experience": 7,
"skills": ["Python", "FastAPI", "Machine Learning"],
"certifications": ["Certified Python Developer"],
"internships": "Software Intern at XYZ"
}}
"""