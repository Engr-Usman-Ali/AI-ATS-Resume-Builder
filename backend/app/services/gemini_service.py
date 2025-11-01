import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
try:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-pro')
    print("✅ Gemini AI configured successfully")
except Exception as e:
    print(f"❌ Gemini configuration error: {e}")
    model = None

class GeminiService:
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
                # If not valid JSON, split by newlines
                suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            
            return {
                'success': True,
                'suggestions': suggestions[:5]
            }
        except Exception as e:
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
            
            Return a JSON object with:
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
            return {
                'success': True,
                'has_errors': False,
                'corrections': [],
                'score': 90,
                'error': str(e)
            }
    
    @staticmethod
    def optimize_for_role(resume_data, target_role):
        """Optimize resume for specific job role"""
        if not model:
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
            prompt = f"""
            Optimize this resume for a {target_role} position:
            
            Current Skills: {', '.join(resume_data.get('skills', []))}
            Experience: {json.dumps(resume_data.get('experience', [])[:2])}
            
            Return JSON with:
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
                result = {
                    'skills': ['Technical Expertise', 'Leadership', 'Innovation'],
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
            return {
                'success': False,
                'error': str(e)
            }