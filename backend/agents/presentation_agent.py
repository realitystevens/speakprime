"""
Presentation Coaching Agent

Builds the Gemini Live API configuration for real-time presentation coaching sessions.
The agent monitors delivery, analyzes slide screenshots, tracks eye contact, and
gives timely, minimal interjections so the presenter can stay in flow.
"""

import base64
import json
import logging
from typing import Optional

from google.genai import types

from core.gemini import FLASH_MODEL, get_genai_client
from models.report import SlideReport
from models.session import SessionConfig

logger = logging.getLogger(__name__)


# System prompt

PRESENTATION_SYSTEM_PROMPT = """You are an expert presentation coach named Sam working for Speakprime.
Your role is to listen to the presenter and provide minimal, timely coaching so they can stay in flow.

## Your Responsibilities

### 1. Opening
- Greet the presenter warmly.
- Ask what they're presenting today and who their audience is (if not already configured).
- Tell them to begin whenever they're ready.

### 2. Listen — Stay Mostly Silent
Your default behavior is to LISTEN. Do NOT interrupt unless coaching is genuinely needed.
Let the presenter speak for at least 30 seconds between interjections.

### 3. Real-Time Coaching Interjections
Give SHORT, one-sentence interjections only when needed:

**Energy & Voice:**
- Enthusiasm drop → "Great energy — keep it up!"
- Voice dropping → "Voice dropped there — project through to the end of your sentence."
- Speaking too fast → "Slight pause here — let that point land."
- Good energy → "Strong delivery!"

**Slide Transitions:**
- Too long on one slide → "You've been on this slide for a while — consider moving on."
- Good transition → "Strong transition!"

**Filler Words:**
- Multiple fillers detected → "Try pausing instead of filler words — it sounds more confident."

**Structure & Clarity:**
- Good logical flow → "Clear structure — nice."
- Confusing section → "That point might need a bit more context for your audience."

### 4. Slide Analysis (when you receive a slide image)
Analyze the slide and give 1-2 sentence feedback:
- Too much text (>50 words): "That slide has a lot of text — consider splitting it."
- Too many bullets (>5): "Too many bullet points here — aim for 3-4 max."
- No clear headline: "That slide needs a stronger headline to anchor the audience."
- Weak data viz: "The chart could be clearer — consider a simpler format."
- Good slide: "Clean slide — well designed."
- Strong data: "That data visualization is excellent."

### 5. Eye Contact (when you receive a webcam frame)
If the speaker appears to be reading from slides (head down/away from camera):
→ "Eye contact with your audience — they want to connect with you."

### 6. Session Close
When the session ends:
- Congratulate them on completing the presentation.
- Give 2-3 brief verbal highlights.
- Say: "Your full coaching report is now ready."

## Communication Style
- Be a supportive, expert coach — not a critic.
- BRIEF. One sentence per interjection.
- Never talk over the presenter for more than 5 seconds.
- Acknowledge good moments as much as correcting bad ones.
"""


def get_presentation_config(session_config: SessionConfig) -> types.LiveConnectConfig:
    """
    Build a LiveConnectConfig for the presentation agent.

    Args:
        session_config: The session's configuration.

    Returns:
        A configured LiveConnectConfig ready for client.aio.live.connect()
    """
    topic_str = session_config.presentation_topic or "their presentation"
    audience_str = session_config.audience_type or "a general audience"

    context_note = (
        f"\n\nSESSION CONTEXT:\n"
        f"- Presentation Topic: {topic_str}\n"
        f"- Audience: {audience_str}\n"
        f"- Duration: {session_config.duration_minutes} minutes\n"
        f"- Focus Areas: {', '.join(session_config.focus_areas) if session_config.focus_areas else 'overall delivery'}"
    )

    full_prompt = PRESENTATION_SYSTEM_PROMPT + context_note

    config = types.LiveConnectConfig(
        response_modalities=["AUDIO", "TEXT"],
        system_instruction=types.Content(
            parts=[types.Part(text=full_prompt)]
        ),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Kore"  # Warm, supportive voice
                )
            )
        ),
    )
    return config


async def analyze_slide(image_bytes: bytes, slide_number: int) -> SlideReport:
    """
    Send a slide screenshot to Gemini Flash and get a structured SlideReport.

    Args:
        image_bytes: Raw JPEG bytes of the slide screenshot.
        slide_number: The 1-based slide number in the presentation.

    Returns:
        A SlideReport with status and feedback.
    """
    client = get_genai_client()

    prompt = (
        "Analyze this presentation slide and respond with a JSON object in this exact format:\n"
        '{"status": "good" | "needs_work" | "revise", "feedback": "one or two sentence feedback"}\n\n'
        "Evaluation criteria:\n"
        "- 'good': clear headline, ≤5 bullets, ≤50 words of body text, clean layout\n"
        "- 'needs_work': minor issues (slightly too much text, weak headline, or small layout issue)\n"
        "- 'revise': major issues (wall of text, no headline, >5 bullets, confusing layout)\n\n"
        "Be concise and actionable in the feedback."
    )

    try:
        response = await client.aio.models.generate_content(
            model=FLASH_MODEL,
            contents=[
                types.Part(
                    inline_data=types.Blob(
                        data=image_bytes, mime_type="image/jpeg")
                ),
                types.Part(text=prompt),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        result = json.loads(response.text)
        return SlideReport(
            slide_number=slide_number,
            status=result.get("status", "needs_work"),
            feedback=result.get("feedback", "Unable to analyze slide."),
        )
    except Exception as e:
        logger.error(f"analyze_slide error for slide {slide_number}: {e}")
        return SlideReport(
            slide_number=slide_number,
            status="needs_work",
            feedback="Slide analysis unavailable at this time.",
        )
