"""
Generate all required TTS audio files (offline pre-generation) for FIT FORM LIVE.

Outputs:
  - web/audio/tts/count/1.mp3 ... 999.mp3
  - web/audio/tts/countdown.mp3
  - web/audio/tts/avatar/<phrase>.mp3

Dependencies:
  pip install edge-tts

Usage:
  python tools/generate_tts.py
"""

import asyncio
import os
from pathlib import Path
import edge_tts

try:
    import azure.cognitiveservices.speech as speechsdk
except ImportError:  # pragma: no cover - optional dependency
    speechsdk = None

VOICE = "ko-KR-SunHiNeural"
OUTPUT_ROOT = Path(__file__).resolve().parents[1] / "web" / "audio" / "tts"

COUNT_DIR = OUTPUT_ROOT / "count"
AVATAR_DIR = OUTPUT_ROOT / "avatar"

AVATAR_PHRASES = {
    "avatar_start_warning": "아바타 모드에서는 전신이 화면에 모두 들어와야 합니다. 카메라와 충분한 거리를 두어주세요.",
    "avatar_fullbody_ready": "전신이 인식되었습니다. 운동을 시작합니다.",
    "avatar_resume": "전신이 다시 인식되었습니다. 운동을 계속합니다.",
    "avatar_lost": "전신이 인식되지 않습니다. 카메라와 충분한 거리를 벌려주십시오.",
}

COUNTDOWN_TEXT = "5초 후에 시작합니다."

COUNT_START = int(os.getenv("TTS_COUNT_START", "1"))
COUNT_END = int(os.getenv("TTS_COUNT_END", "999"))
CONCURRENCY = int(os.getenv("TTS_CONCURRENCY", "2"))  # lower to avoid 429
RETRIES = int(os.getenv("TTS_RETRIES", "4"))
BACKOFF_BASE = float(os.getenv("TTS_BACKOFF_BASE", "1.5"))
PROVIDER = os.getenv("TTS_PROVIDER", "edge").lower()  # "edge" or "azure"
AZURE_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_REGION = os.getenv("AZURE_SPEECH_REGION")


def ensure_dirs():
    COUNT_DIR.mkdir(parents=True, exist_ok=True)
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)


async def synthesize_edge(text: str, outfile: Path, voice: str = VOICE, sem: asyncio.Semaphore | None = None):
    if outfile.exists():
        return
    attempt = 0
    while attempt <= RETRIES:
        attempt += 1
        if sem:
            async with sem:
                try:
                    await edge_tts.Communicate(text=text, voice=voice).save(str(outfile))
                    print(f"✔ Saved {outfile}")
                    return
                except Exception as exc:  # pylint: disable=broad-except
                    outfile.unlink(missing_ok=True)
                    wait = BACKOFF_BASE ** attempt
                    print(f"✖ Failed {outfile} (attempt {attempt}/{RETRIES}): {exc}. Retrying in {wait:.1f}s")
                    await asyncio.sleep(wait)
        else:
            try:
                await edge_tts.Communicate(text=text, voice=voice).save(str(outfile))
                print(f"✔ Saved {outfile}")
                return
            except Exception as exc:  # pylint: disable=broad-except
                outfile.unlink(missing_ok=True)
                wait = BACKOFF_BASE ** attempt
                print(f"✖ Failed {outfile} (attempt {attempt}/{RETRIES}): {exc}. Retrying in {wait:.1f}s")
                await asyncio.sleep(wait)
    print(f"⚠ Gave up on {outfile} after {RETRIES} retries.")


async def synthesize_azure(text: str, outfile: Path, voice: str = VOICE, sem: asyncio.Semaphore | None = None):
    if outfile.exists():
        return
    if not (AZURE_KEY and AZURE_REGION and speechsdk):
        raise RuntimeError("Azure Speech SDK not available or AZURE_SPEECH_KEY/REGION not set.")
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_KEY, region=AZURE_REGION)
    speech_config.speech_synthesis_voice_name = voice
    audio_format = speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
    speech_config.set_speech_synthesis_output_format(audio_format)

    async def _speak():
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
        result = await asyncio.get_event_loop().run_in_executor(
            None, lambda: synthesizer.speak_text_async(text).get()
        )
        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            raise RuntimeError(f"Azure synthesis failed: {result.reason}")
        data = result.audio_data
        if not data:
            raise RuntimeError("Azure synthesis returned no audio data")
        outfile.parent.mkdir(parents=True, exist_ok=True)
        with open(outfile, "wb") as f:
            f.write(data)
        print(f"✔ Saved {outfile} (azure)")

    attempt = 0
    while attempt <= RETRIES:
        attempt += 1
        try:
            if sem:
                async with sem:
                    await _speak()
            else:
                await _speak()
            return
        except Exception as exc:  # pylint: disable=broad-except
            outfile.unlink(missing_ok=True)
            wait = BACKOFF_BASE ** attempt
            print(f"✖ Failed {outfile} (attempt {attempt}/{RETRIES}): {exc}. Retrying in {wait:.1f}s")
            await asyncio.sleep(wait)
    print(f"⚠ Gave up on {outfile} after {RETRIES} retries.")


async def synthesize(text: str, outfile: Path, voice: str = VOICE, sem: asyncio.Semaphore | None = None):
    if PROVIDER == "azure":
        return await synthesize_azure(text, outfile, voice, sem)
    return await synthesize_edge(text, outfile, voice, sem)


async def generate_counts():
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    for n in range(COUNT_START, COUNT_END + 1):
        text = f"{n}회"
        outfile = COUNT_DIR / f"{n}.mp3"
        tasks.append(synthesize(text, outfile, sem=sem))
    await asyncio.gather(*tasks)


async def generate_avatar_phrases():
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    for key, text in AVATAR_PHRASES.items():
        outfile = AVATAR_DIR / f"{key}.mp3"
        tasks.append(synthesize(text, outfile, sem=sem))
    await asyncio.gather(*tasks)


async def generate_countdown():
    sem = asyncio.Semaphore(CONCURRENCY)
    await synthesize(COUNTDOWN_TEXT, OUTPUT_ROOT / "countdown.mp3", sem=sem)


async def main():
    ensure_dirs()
    await asyncio.gather(
        generate_counts(),
        generate_avatar_phrases(),
        generate_countdown(),
    )


if __name__ == "__main__":
    asyncio.run(main())
