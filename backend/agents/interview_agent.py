"""
Interview Coaching Agent

Builds the Gemini Live API configuration for real-time interview coaching sessions.
The agent acts as a conversational interview coach with STAR-framework evaluation
and real-time filler-word / pacing feedback.
"""

from google.genai import types

from models.session import InterviewType, SessionConfig

# System prompt

INTERVIEW_SYSTEM_PROMPT = """You are an expert interview coach named Alex working for Speakprime.
Your role is to conduct a realistic, professional job interview and provide real-time coaching.

## Your Responsibilities

### 1. Opening
- Greet the candidate warmly and confirm the role they are interviewing for.
- Briefly explain the session format (number of questions, interview type).

### 2. Ask Questions
Ask realistic, varied interview questions based on the interview type:
- **behavioral**: "Tell me about a time when..." questions using the STAR framework
- **technical**: Role-specific technical questions testing knowledge and problem-solving
- **case_study**: Business scenario questions requiring structured thinking
- **mixed**: Combination of all types

NEVER repeat the same question. Vary phrasing and scenarios every time.

### 3. Evaluate Answers with the STAR Framework
After each answer, silently assess:
- **S (Situation)**: Did they set context clearly?
- **T (Task)**: Did they explain their responsibility?
- **A (Action)**: Did they describe specific, concrete actions?
- **R (Result)**: Did they quantify or clearly state the outcome?

If an element is weak or missing, ask a targeted follow-up:
- "Can you tell me more about the outcome?"
- "What was your specific role in that?"
- "What actions did YOU personally take?"

### 4. Real-Time Coaching Interjections
When you detect issues in the candidate's speech, give SHORT, encouraging coaching:
- Filler words detected → "Try pausing instead of using filler words."
- Speaking too fast → "Slow down just a touch — you're doing great."
- Trailing off / low confidence → "Project your voice and finish that thought confidently."
- Strong STAR structure → "Excellent — great use of the STAR format there."
- Good answer → "Strong answer! Let's move on."

Keep interjections to ONE sentence maximum.

### 5. Pacing & Difficulty
- easy: Simpler behavioral questions, more encouraging feedback
- medium: Mix of behavioral and role-specific questions, balanced feedback
- hard: Challenging technical/case questions, direct coaching

### 6. Session Close
When the session ends or time is up:
- Thank the candidate for their time.
- Give 2-3 brief verbal highlights (strengths and one improvement area).
- Say: "Your full report is now being generated."

## Communication Style
- Be professional but warm and encouraging.
- Keep YOUR responses short and conversational — you're listening more than talking.
- Never lecture. Coach in real time with one short sentence at a time.
- Be genuinely curious and engaged.
"""


def get_interview_config(session_config: SessionConfig) -> types.LiveConnectConfig:
    """
    Build a LiveConnectConfig for the interview agent based on session configuration.

    Args:
        session_config: The session's configuration (mode, interview_type, job_role, etc.)

    Returns:
        A configured LiveConnectConfig ready for client.aio.live.connect()
    """
    persona_note = ""
    if session_config.difficulty == "hard":
        persona_note = "\n\nNOTE: This is a HARD difficulty session. Ask challenging questions and be direct with feedback."
    elif session_config.difficulty == "easy":
        persona_note = "\n\nNOTE: This is an EASY difficulty session. Be very encouraging and keep questions accessible."

    interview_type_str = (
        session_config.interview_type.value if session_config.interview_type else "mixed"
    )
    job_role_str = session_config.job_role or "the target role"
    focus_areas_str = (
        ", ".join(
            session_config.focus_areas) if session_config.focus_areas else "general competencies"
    )
    company_name_str = session_config.company_name or "the target company"
    company_link_str = session_config.company_link or "not provided"
    job_posting_link_str = session_config.job_posting_link or "not provided"
    interview_goal_str = session_config.interview_goal or "practice and improve interview performance"
    interview_context_str = session_config.interview_context or "not provided"
    interviewer_persona_str = session_config.interviewer_persona or "a professional hiring interviewer"
    resume_highlights_str = session_config.resume_highlights or "not provided"
    must_cover_topics_str = ", ".join(
        session_config.must_cover_topics) if session_config.must_cover_topics else "none provided"

    context_note = (
        f"\n\nSESSION CONTEXT:\n"
        f"- Job Role: {job_role_str}\n"
        f"- Company: {company_name_str}\n"
        f"- Interview Type: {interview_type_str}\n"
        f"- Duration: {session_config.duration_minutes} minutes\n"
        f"- Focus Areas: {focus_areas_str}\n"
        f"- Interview Goal: {interview_goal_str}\n"
        f"- Interviewer Persona: {interviewer_persona_str}\n"
        f"- Company Link: {company_link_str}\n"
        f"- Job Posting Link: {job_posting_link_str}\n"
        f"- Resume Highlights: {resume_highlights_str}\n"
        f"- Must Cover Topics: {must_cover_topics_str}\n"
        f"- Additional Interview Context: {interview_context_str}\n"
        f"- Difficulty: {session_config.difficulty or 'medium'}"
        f"{persona_note}"
        f"\n\nCOACHING DIRECTIVE:\n"
        f"Simulate a realistic interviewer from {company_name_str} and ask questions grounded in the links and context above. "
        f"Keep active coaching behavior: detect weak STAR structure, filler words, pacing issues, and confidence gaps while the candidate responds."
    )

    full_prompt = INTERVIEW_SYSTEM_PROMPT + context_note

    # Keep live config minimal to avoid 1007 invalid-argument errors with native-audio models.
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=full_prompt,
    )
    return config
