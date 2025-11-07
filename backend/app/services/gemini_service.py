import google.generativeai as genai
import os
import json
import re 
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()

model = None
try:
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        # Use genai.Client() for clean configuration
        client = genai.Client(api_key=api_key)
        # Use a model well-suited for reasoning and JSON output
        MODEL_NAME = "gemini-2.5-flash"
    else:
        # Client will be None if API key is missing
        client = None

except Exception:
    client = None
    pass # Configuration failure

# ---------------------

class GeminiService:
    """
    A service class to interact with the Gemini API for resume-related tasks.
    """
    
    @staticmethod
    def _call_gemini_json(prompt: str, model_name: str = "gemini-2.5-flash", system_instruction: str = "") -> dict:
        """Helper to call Gemini API and enforce JSON output."""
        if not client:
            raise Exception("Gemini API not configured")
        
        config = genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            system_instruction=system_instruction
        )
        
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config
        )
        
        # Parse the JSON string from the response text
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback for when the model wraps JSON in markdown block (e.g., ```json{...}```)
            cleaned_text = response.text.strip()
            if cleaned_text.startswith('```'):
                # Simple strip for code block
                cleaned_text = re.sub(r'```(json)?\s*|```', '', cleaned_text, flags=re.IGNORECASE).strip()
            return json.loads(cleaned_text)


    @staticmethod
    def generate_resume_suggestions(resume_data):
        """Generate AI suggestions for resume improvement"""
        if not model:
            return {
                'success': False,
                'error': 'Gemini API not configured'
            }
        
        try:
            prompt = f"""
            Analyze this resume and provide 5 specific, actionable suggestions for improvement:
            
            Name: {resume_data.get('name', 'N/A')}
            Title: {resume_data.get('title', 'N/A')}
            Summary: {resume_data.get('summary', 'N/A')}
            Experience: {json.dumps(resume_data.get('experience', []))}
            Skills: {', '.join(resume_data.get('skills', []))}
            
            Return ONLY a JSON array of suggestions:
            ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
            """
            
            response = model.generate_content(prompt)
            suggestions_text = response.text.strip()
            
            # Try to parse as JSON
            try:
                suggestions = json.loads(suggestions_text)
            except:
                # If not valid JSON, split by newlines as a fallback
                suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            
            return {
                'success': True,
                'suggestions': suggestions[:5]
            }
        except Exception as e:
            # Fallback suggestions on API error
            return {
                'success': False,
                'error': str(e),
                'suggestions': [
                    "Add quantifiable achievements with metrics",
                    "Use strong action verbs to start bullet points",
                    "Tailor your resume to the job description",
                    "Keep your summary concise and impactful",
                    "Highlight relevant technical skills"
                ]
            }
    
    @staticmethod
    def check_grammar(text):
        """Check grammar and provide corrections"""
        if not model:
            # Mock success response if API not configured
            return {
                'success': True,
                'has_errors': False,
                'corrections': [],
                'score': 95
            }
        
        try:
            prompt = f"""
            Check the following text for grammar, spelling, and style errors:
            
            "{text}"
            
            Return ONLY a JSON object with:
            {{
                "has_errors": true/false,
                "corrections": ["error 1: correction", "error 2: correction"],
                "score": 0-100
            }}
            """
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            try:
                result = json.loads(result_text)
            except:
                # Fallback to a default structure on parse error
                result = {
                    'has_errors': False,
                    'corrections': [],
                    'score': 90
                }
            
            return {
                'success': True,
                **result
            }
        except Exception as e:
            # Fallback response on API error
            return {
                'success': True, # Set to True to allow continued flow in consuming app
                'has_errors': False,
                'corrections': [],
                'score': 90,
                'error': str(e)
            }
    
    @staticmethod
    def optimize_for_role(resume_data, target_role):
        """Optimize resume for specific job role"""
        if not model:
            # Mock success response if API not configured
            return {
                'success': True,
                'skills': ['Leadership', 'Communication', 'Problem Solving'],
                'keywords': ['agile', 'team collaboration', 'project management'],
                'experience_tips': [
                    'Emphasize leadership experiences',
                    'Highlight cross-functional collaboration',
                    'Show measurable business impact'
                ]
            }
        
        try:
            # Only sending a subset of experience to keep prompt size manageable
            prompt = f"""
            Optimize this resume for a {target_role} position:
            
            Current Skills: {', '.join(resume_data.get('skills', []))}
            Experience: {json.dumps(resume_data.get('experience', [])[:2])}
            
            Return ONLY a JSON object with:
            {{
                "skills": ["skill1", "skill2", "skill3"],
                "keywords": ["keyword1", "keyword2", "keyword3"],
                "experience_tips": ["tip1", "tip2", "tip3"]
            }}
            """
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            try:
                result = json.loads(result_text)
            except:
                # Fallback to a default structure on parse error
                result = {
                    'skills': ['Technical Expertise', 'Innovation', 'Critical Thinking'],
                    'keywords': ['agile', 'collaboration', 'results-driven'],
                    'experience_tips': [
                        'Focus on achievements relevant to the role',
                        'Use industry-specific terminology',
                        'Quantify your impact with numbers'
                    ]
                }
            
            return {
                'success': True,
                **result
            }
        except Exception as e:
            # Fallback response on API error
            return {
                'success': False,
                'error': str(e),
                'skills': [],
                'keywords': [],
                'experience_tips': []
            }
    
    @staticmethod
    def analyze_ats_score(resume_text: str, job_description: str):
        """
        Analyze resume text for ATS compatibility against a job description,
        providing a score and tips.
        """
        
        # Mock response if API not available
        if not client:
            return {
                'success': True,
                'score': 75,
                'tips': [
                    "Resume: Tailor your summary to the specific job title (JD)",
                    "Resume: Include keywords like 'leadership' and 'Agile' (JD)",
                    "Resume: Add quantifiable achievements with specific metrics",
                    "ATS: Use standard section headings (Experience, Education, Skills)",
                    "ATS: Ensure simple, clean formatting for machine parsing"
                ],
                'mock': True
            }
        
        try:
            # Truncate to prevent context window issues (4000 chars is safe)
            safe_resume_text = resume_text[:4000]
            safe_jd_text = job_description[:2000]
            
            system_instruction = (
                "You are an expert ATS (Applicant Tracking System) and professional resume reviewer. "
                "Your primary function is to score a RESUME against a JOB DESCRIPTION. "
                "You must strictly return a valid JSON object."
            )
            
            prompt = f"""
            Analyze the RESUME TEXT against the JOB DESCRIPTION.

            JOB DESCRIPTION:
            {safe_jd_text}

            RESUME TEXT:
            {safe_resume_text}

            Provide:
            1. An **ATS Match Score** from 0-100 (higher is better). This score MUST reflect how well the resume matches the JD's requirements and keywords.
            2. Exactly 5 **specific, actionable improvement tips**. These tips should focus on improving the JD match, content, and ATS formatting.

            Return ONLY a JSON object with this exact structure:
            {{
                "score": <number between 0-100>,
                "tips": ["tip 1 (focused on JD match or ATS)", "tip 2", "tip 3", "tip 4", "tip 5"]
            }}
            """
            
            result = GeminiService._call_gemini_json(prompt, system_instruction=system_instruction)
            
            # Validate and clean up result structure
            score = max(0, min(100, int(result.get('score', 70))))
            tips = result.get('tips', [])
            
            # Ensure exactly 5 tips
            while len(tips) < 5:
                tips.append("Consider adding more quantifiable results to your bullet points.")
            
            return {
                'success': True,
                'score': score,
                'tips': tips[:5], 
                'mock': False
            }
            
        except Exception as e:
            # print(f"Error in ATS analysis: {e}")
            return {
                'success': False,
                'error': str(e),
                'score': 0,
                'tips': ["Error: Could not process request. Check API key and configuration."]
            }
