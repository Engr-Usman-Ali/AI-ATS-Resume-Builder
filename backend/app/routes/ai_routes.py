from flask import Blueprint, request, jsonify
import os
import json
from google import genai
from google.genai.errors import APIError
from google.genai.types import Schema, Type

# ----------------------------------------------------
# 1. Blueprint Setup and Initialization
# ----------------------------------------------------
ai_bp = Blueprint('ai', __name__)

try:
    # The client automatically picks up the GEMINI_API_KEY from the environment
    ai_client = genai.Client()
    print("✅ Gemini AI Client Initialized.")
except Exception as e:
    print(f"⚠️ Warning: Could not initialize Gemini Client. Check GEMINI_API_KEY in .env. Error: {e}")
    ai_client = None

# ----------------------------------------------------
# 2. Structured Response Schemas
# ----------------------------------------------------

# Schema for Grammar Check (Re-used from previous fix)
GRAMMAR_CHECK_SCHEMA_DICT = {
    "type": "OBJECT",
    "properties": {
        "score": {"type": "NUMBER", "description": "A quality score from 0 (poor) to 100 (excellent)."},
        "has_errors": {"type": "BOOLEAN", "description": "True if errors or significant suggestions exist."},
        "corrections": {
            "type": "ARRAY", 
            "description": "A list of 1 to 3 specific, actionable suggestions for improvement (grammar, clarity, conciseness).", 
            "items": {"type": "STRING"}
        }
    },
    "required": ["score", "has_errors", "corrections"]
}

# Schema for General Suggestions (e.g., alternative bullet points)
SUGGESTIONS_SCHEMA_DICT = {
    "type": "OBJECT",
    "properties": {
        "suggestions": {
            "type": "ARRAY",
            "description": "A list of 3 high-impact, re-written or alternative versions of the input text, focusing on metrics and results.",
            "items": {"type": "STRING"}
        },
        "tip": {"type": "STRING", "description": "One concise, overarching tip about resume writing best practices based on the provided text."}
    },
    "required": ["suggestions", "tip"]
}

# Schema for Optimization (Full resume/summary optimization)
OPTIMIZATION_SCHEMA_DICT = {
    "type": "OBJECT",
    "properties": {
        "optimized_summary": {"type": "STRING", "description": "A highly concise, optimized, and tailored summary (4-5 sentences) for the target role."},
        "target_keywords": {
            "type": "ARRAY",
            "description": "A list of 5 essential keywords extracted from the target role that should be included in the resume.",
            "items": {"type": "STRING"}
        }
    },
    "required": ["optimized_summary", "target_keywords"]
}


# ----------------------------------------------------
# 3. /grammar-check Endpoint (The one we fixed)
# ----------------------------------------------------

@ai_bp.route('/grammar-check', methods=['POST'])
def grammar_check():
    """Analyzes a single text block for grammar, clarity, and score."""
    if not ai_client:
        return jsonify({"success": False, "message": "AI service not initialized. Check server logs."}), 503

    data = request.get_json()
    text = data.get('text', '').strip()

    if not text:
        return jsonify({"success": False, "message": "No text provided for analysis."}), 400

    system_prompt = (
        "You are an expert resume and professional writing assistant. Your task is to analyze the user-provided text "
        "for grammar, clarity, conciseness, and overall professional effectiveness for a resume. "
        "You must return a single JSON object that strictly adheres to the provided schema."
    )
    user_prompt = f"Analyze and provide feedback on the following resume text:\n\n---\n{text}\n---"
    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[full_prompt], 
            config={
                'response_mime_type': "application/json",
                'response_schema': Schema(**GRAMMAR_CHECK_SCHEMA_DICT)
            }
        )

        result = json.loads(response.text.strip())
        return jsonify({"success": True, **result})

    except APIError as e:
        print(f"🚨 Gemini API Error (grammar_check): {e}")
        return jsonify({"success": False, "message": "AI service failed. Please check your API key and server logs."}), 500
    except json.JSONDecodeError as e:
        print(f"🚨 Error parsing AI response to JSON (grammar_check): {e}. Raw response: {response.text}")
        return jsonify({"success": False, "message": "AI returned an unparsable response."}), 500
    except Exception as e:
        print(f"🚨 An unexpected internal server error occurred (grammar_check): {e}")
        return jsonify({"success": False, "message": f"An unexpected server error occurred: {e}"}), 500


# ----------------------------------------------------
# 4. /suggestions Endpoint
# ----------------------------------------------------

@ai_bp.route('/suggestions', methods=['POST'])
def get_ai_suggestions():
    """Generates 3 alternative, high-impact bullet points for the input text."""
    if not ai_client:
        return jsonify({"success": False, "message": "AI service not initialized."}), 503
    
    data = request.get_json()
    text = data.get('text', '').strip()

    if not text:
        return jsonify({"success": False, "message": "No text provided for suggestions."}), 400

    system_prompt = (
        "You are a specialized resume bullet point optimizer. Your goal is to take the user's input and "
        "rephrase it into 3 alternative, high-impact bullet points. Each suggestion MUST start with a strong "
        "action verb and focus on quantifiable achievements and results, not just duties. "
        "Always adhere strictly to the provided JSON schema."
    )
    user_prompt = f"Optimize the following resume bullet point/description:\n\n---\n{text}\n---"
    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[full_prompt], 
            config={
                'response_mime_type': "application/json",
                'response_schema': Schema(**SUGGESTIONS_SCHEMA_DICT)
            }
        )
        
        result = json.loads(response.text.strip())
        return jsonify({"success": True, **result})

    except APIError as e:
        print(f"🚨 Gemini API Error (suggestions): {e}")
        return jsonify({"success": False, "message": "AI service failed."}), 500
    except json.JSONDecodeError as e:
        print(f"🚨 Error parsing AI response to JSON (suggestions): {e}. Raw response: {response.text}")
        return jsonify({"success": False, "message": "AI returned an unparsable response."}), 500
    except Exception as e:
        print(f"🚨 An unexpected internal server error occurred (suggestions): {e}")
        return jsonify({"success": False, "message": f"An unexpected server error occurred: {e}"}), 500


# ----------------------------------------------------
# 5. /optimize Endpoint
# ----------------------------------------------------

@ai_bp.route('/optimize', methods=['POST'])
def optimize_resume():
    """Optimizes a resume summary based on a target job role."""
    if not ai_client:
        return jsonify({"success": False, "message": "AI service not initialized."}), 503

    data = request.get_json()
    resume_summary = data.get('resumeSummary', '').strip()
    target_role = data.get('targetRole', '').strip()

    if not resume_summary or not target_role:
        return jsonify({"success": False, "message": "Both resume summary and target role are required for optimization."}), 400

    system_prompt = (
        "You are a Resume ATS (Applicant Tracking System) optimization specialist. Your task is to tailor the "
        "provided resume summary to maximize relevance for the specified target role. You MUST identify key keywords "
        "from the role and generate a new, highly optimized 4-5 sentence summary. Adhere strictly to the JSON schema."
    )
    user_prompt = (
        f"Optimize the following existing summary for the target role:\n"
        f"TARGET ROLE: {target_role}\n"
        f"EXISTING SUMMARY: {resume_summary}"
    )
    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[full_prompt], 
            config={
                'response_mime_type': "application/json",
                'response_schema': Schema(**OPTIMIZATION_SCHEMA_DICT)
            }
        )
        
        result = json.loads(response.text.strip())
        return jsonify({"success": True, **result})

    except APIError as e:
        print(f"🚨 Gemini API Error (optimize): {e}")
        return jsonify({"success": False, "message": "AI service failed."}), 500
    except json.JSONDecodeError as e:
        print(f"🚨 Error parsing AI response to JSON (optimize): {e}. Raw response: {response.text}")
        return jsonify({"success": False, "message": "AI returned an unparsable response."}), 500
    except Exception as e:
        print(f"🚨 An unexpected internal server error occurred (optimize): {e}")
        return jsonify({"success": False, "message": f"An unexpected server error occurred: {e}"}), 500
