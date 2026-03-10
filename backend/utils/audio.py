"""
Audio processing utilities for Speakprime.

Helpers for working with raw PCM audio, sample rate conversion,
and audio format validation used across the WebSocket handlers.
"""

import struct
from typing import Generator


# Expected audio format from the browser client
CLIENT_SAMPLE_RATE = 16000
CLIENT_CHANNELS = 1
CLIENT_BIT_DEPTH = 16
CLIENT_BYTES_PER_SAMPLE = CLIENT_BIT_DEPTH // 8


def pcm_chunk_duration_ms(chunk: bytes) -> float:
    """
    Calculate the duration in milliseconds of a raw PCM audio chunk.

    Assumes 16-bit, mono, 16 kHz PCM (the format expected from the browser).

    Args:
        chunk: Raw PCM audio bytes.

    Returns:
        Duration in milliseconds.
    """
    num_samples = len(chunk) / CLIENT_BYTES_PER_SAMPLE
    return (num_samples / CLIENT_SAMPLE_RATE) * 1000.0


def estimate_word_count(audio_duration_seconds: float, words_per_minute: float = 130.0) -> int:
    """
    Estimate the number of words spoken given an audio duration.

    Args:
        audio_duration_seconds: Length of the audio segment.
        words_per_minute: Average speaking rate. Defaults to 130 WPM (normal pace).

    Returns:
        Estimated word count (integer).
    """
    return max(0, int(audio_duration_seconds / 60.0 * words_per_minute))


def is_silence(chunk: bytes, threshold: int = 200) -> bool:
    """
    Detect whether a PCM chunk is effectively silent.

    Computes the peak amplitude of the chunk and compares it to a threshold.
    Useful for avoiding sending empty audio to the Gemini API.

    Args:
        chunk: Raw 16-bit little-endian PCM bytes.
        threshold: RMS threshold below which audio is considered silence.

    Returns:
        True if the chunk is silent, False otherwise.
    """
    if len(chunk) < CLIENT_BYTES_PER_SAMPLE:
        return True

    num_samples = len(chunk) // CLIENT_BYTES_PER_SAMPLE
    samples = struct.unpack_from(f"<{num_samples}h", chunk)
    peak = max(abs(s) for s in samples)
    return peak < threshold


def split_into_chunks(audio_bytes: bytes, chunk_size_ms: int = 100) -> Generator[bytes, None, None]:
    """
    Split a continuous PCM byte string into fixed-duration chunks.

    Args:
        audio_bytes: Complete PCM audio buffer.
        chunk_size_ms: Target chunk duration in milliseconds. Defaults to 100 ms.

    Yields:
        PCM byte chunks of the specified duration.
    """
    bytes_per_chunk = int(CLIENT_SAMPLE_RATE *
                          (chunk_size_ms / 1000.0)) * CLIENT_BYTES_PER_SAMPLE
    offset = 0
    while offset < len(audio_bytes):
        yield audio_bytes[offset: offset + bytes_per_chunk]
        offset += bytes_per_chunk


def validate_pcm_chunk(chunk: bytes) -> bool:
    """
    Basic validation of a PCM chunk to ensure it is non-empty and correctly aligned.

    Args:
        chunk: Raw PCM audio bytes.

    Returns:
        True if the chunk is valid PCM data, False otherwise.
    """
    if not chunk:
        return False
    if len(chunk) % CLIENT_BYTES_PER_SAMPLE != 0:
        return False
    return True
