/**
 * AudioWorklet processor for capturing and resampling microphone PCM audio.
 * Runs in the AudioWorklet thread — no DOM access.
 *
 * Receives raw float32 samples from the microphone, resamples to 16 kHz
 * (the rate expected by Gemini Live API), converts to Int16, and posts
 * the buffer back to the main thread.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._targetRate = (options.processorOptions && options.processorOptions.targetSampleRate) || 16000;
    // sampleRate is a global AudioWorklet constant (the AudioContext's sample rate)
    this._inputRate = sampleRate;
    // Accumulate ~100 ms worth of input samples before sending
    this._bufferSize = Math.floor(this._inputRate * 0.1);
    this._buf = new Float32Array(this._bufferSize * 2);
    this._ptr = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buf[this._ptr++] = channel[i];

      if (this._ptr >= this._bufferSize) {
        const chunk = this._buf.subarray(0, this._ptr);
        const resampled = this._resample(chunk);
        const int16 = this._toInt16(resampled);
        this.port.postMessage({ pcm: int16 }, [int16.buffer]);
        this._ptr = 0;
      }
    }
    return true;
  }

  _resample(samples) {
    if (this._inputRate === this._targetRate) return samples;
    const ratio = this._inputRate / this._targetRate;
    const outLen = Math.floor(samples.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const src = i * ratio;
      const lo = Math.floor(src);
      const hi = Math.min(lo + 1, samples.length - 1);
      const t = src - lo;
      out[i] = samples[lo] * (1 - t) + samples[hi] * t;
    }
    return out;
  }

  _toInt16(samples) {
    const out = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }
    return out;
  }
}

registerProcessor("audio-capture-processor", AudioCaptureProcessor);
