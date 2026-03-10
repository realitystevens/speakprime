"""
Speech analysis utilities for Speakprime.

Lightweight, dependency-free helpers for analysing transcript text in real time:
filler word detection, pacing estimation, STAR framework scoring, and confidence
signal detection.
"""

import re
from collections import Counter
from typing import NamedTuple

# Constants
FILLER_WORDS: list[str] = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "literally",
    "sort of",
    "kind of",
    "right",
    "i mean",
    "actually",
    "so yeah",
]

STAR_SITUATION_SIGNALS: list[str] = [
    "was working at",
    "was at",
    "at the time",
    "we were",
    "i was",
    "the situation was",
    "when i",
    "in my role",
    "context was",
]

STAR_TASK_SIGNALS: list[str] = [
    "my responsibility",
    "i was responsible",
    "my role was",
    "i needed to",
    "i had to",
    "i was tasked",
    "the goal was",
    "i was assigned",
]

STAR_ACTION_SIGNALS: list[str] = [
    "i decided",
    "i implemented",
    "i created",
    "i built",
    "i led",
    "i reached out",
    "i proposed",
    "i worked with",
    "i solved",
    "i developed",
    "i coordinated",
    "so i",
    "what i did",
]

STAR_RESULT_SIGNALS: list[str] = [
    "as a result",
    "the result was",
    "we achieved",
    "we increased",
    "we reduced",
    "saved",
    "improved by",
    "increased by",
    "reduced by",
    "outcome was",
    "ultimately",
    "in the end",
    "the impact was",
]

LOW_CONFIDENCE_SIGNALS: list[str] = [
    "i think maybe",
    "i'm not sure",
    "i guess",
    "kind of sort of",
    "i don't know",
    "hopefully",
    "i suppose",
    "probably",
    "might have",
]


# Data types

class FillerWordResult(NamedTuple):
    word: str
    count: int
    positions: list[int]  # character offsets in the text


class StarAnalysis(NamedTuple):
    has_situation: bool
    has_task: bool
    has_action: bool
    has_result: bool
    score: int  # 0-100 based on how many components are present


class PacingResult(NamedTuple):
    word_count: int
    estimated_wpm: float
    is_fast: bool    # > 170 WPM
    is_slow: bool    # < 100 WPM


# Analysis functions

def detect_filler_words(text: str) -> list[FillerWordResult]:
    """
    Detect filler words in a transcript segment.

    Args:
        text: Transcript text from the user.

    Returns:
        List of FillerWordResult named tuples, one per unique filler word found.
    """
    text_lower = text.lower()
    results: list[FillerWordResult] = []

    for fw in FILLER_WORDS:
        positions: list[int] = []
        start = 0
        while True:
            idx = text_lower.find(fw, start)
            if idx == -1:
                break
            positions.append(idx)
            start = idx + len(fw)

        if positions:
            results.append(FillerWordResult(
                word=fw, count=len(positions), positions=positions))

    return results


def count_all_filler_words(texts: list[str]) -> Counter:
    """
    Count filler words across a list of transcript texts.

    Args:
        texts: List of user transcript strings.

    Returns:
        Counter mapping filler word → total count.
    """
    totals: Counter = Counter()
    for text in texts:
        for fw in FILLER_WORDS:
            count = text.lower().count(fw)
            if count:
                totals[fw] += count
    return totals


def analyze_star_structure(answer_text: str) -> StarAnalysis:
    """
    Score an interview answer against the STAR framework.

    Looks for linguistic signals of each STAR component.

    Args:
        answer_text: The candidate's full answer text.

    Returns:
        StarAnalysis with boolean flags and an overall score 0-100.
    """
    lower = answer_text.lower()

    has_situation = any(signal in lower for signal in STAR_SITUATION_SIGNALS)
    has_task = any(signal in lower for signal in STAR_TASK_SIGNALS)
    has_action = any(signal in lower for signal in STAR_ACTION_SIGNALS)
    has_result = any(signal in lower for signal in STAR_RESULT_SIGNALS)

    components_present = sum([has_situation, has_task, has_action, has_result])
    score = components_present * 25  # 0, 25, 50, 75 or 100

    return StarAnalysis(
        has_situation=has_situation,
        has_task=has_task,
        has_action=has_action,
        has_result=has_result,
        score=score,
    )


def estimate_pacing(text: str, duration_seconds: float) -> PacingResult:
    """
    Estimate speaking pace (words per minute) from text and duration.

    Args:
        text: The transcript text for the segment.
        duration_seconds: How long the segment took to speak.

    Returns:
        PacingResult with WPM and pace flags.
    """
    if duration_seconds <= 0:
        return PacingResult(word_count=0, estimated_wpm=0.0, is_fast=False, is_slow=False)

    words = text.split()
    word_count = len(words)
    wpm = (word_count / duration_seconds) * 60.0

    return PacingResult(
        word_count=word_count,
        estimated_wpm=round(wpm, 1),
        is_fast=wpm > 170,
        is_slow=wpm < 100,
    )


def detect_low_confidence(text: str) -> bool:
    """
    Detect low-confidence linguistic signals in a transcript segment.

    Args:
        text: Transcript text.

    Returns:
        True if low-confidence signals are detected, False otherwise.
    """
    lower = text.lower()
    return any(signal in lower for signal in LOW_CONFIDENCE_SIGNALS)


def count_words(text: str) -> int:
    """Return the word count of a text string."""
    return len(text.split())


def extract_numbers_from_result(text: str) -> list[str]:
    """
    Extract numerical outcomes from a STAR result statement.

    Looks for patterns like "30%", "by 50", "$2M", "doubled", etc.
    Useful for assessing whether the candidate quantified their result.

    Args:
        text: The result portion of a STAR answer.

    Returns:
        List of matched numeric strings.
    """
    patterns = [
        r"\d+\s*%",           # percentages: 30%, 15 %
        r"\$[\d,]+[kmKMB]?",  # dollar amounts: $2M, $500k
        r"\d+[xX]",           # multipliers: 3x, 10X
        r"\b(?:doubled|tripled|halved)\b",  # qualitative multipliers
        r"\bby\s+\d+",        # "by 30", "by half"
        r"\d+\s*(?:hours|days|weeks|months|employees|customers|users)",
    ]
    results: list[str] = []
    for pattern in patterns:
        results.extend(re.findall(pattern, text, re.IGNORECASE))
    return results
