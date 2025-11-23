"""
Generate English TTS audio files for FIT FORM LIVE (offline pre-generation).

Outputs:
  - web/audio/tts_en/count/1.mp3 ... 999.mp3
  - web/audio/tts_en/countdown.mp3
  - web/audio/tts_en/avatar/<phrase>.mp3

Dependencies:
  pip install edge-tts

Usage:
  python tools/generate_tts_en.py
"""

import asyncio
import os
from pathlib import Path
import edge_tts

VOICE = "en-US-AnaNeural"
OUTPUT_ROOT = Path(__file__).resolve().parents[1] / "web" / "audio" / "tts_en"

COUNT_DIR = OUTPUT_ROOT / "count"
AVATAR_DIR = OUTPUT_ROOT / "avatar"

AVATAR_PHRASES = {
    "avatar_start_warning": "In avatar mode, please keep your full body in view and stand back from the camera.",
    "avatar_fullbody_ready": "Full body detected. Starting your workout.",
    "avatar_resume": "Full body detected again. Resuming your workout.",
    "avatar_lost": "Full body not detected. Please step back so your whole body is visible.",
}

COUNTDOWN_TEXT = "Starting in five seconds."

COUNT_START = int(os.getenv("TTS_COUNT_START", "1"))
COUNT_END = int(os.getenv("TTS_COUNT_END", "999"))
CONCURRENCY = int(os.getenv("TTS_CONCURRENCY", "2"))
RETRIES = int(os.getenv("TTS_RETRIES", "4"))
BACKOFF_BASE = float(os.getenv("TTS_BACKOFF_BASE", "1.5"))


def ensure_dirs():
    COUNT_DIR.mkdir(parents=True, exist_ok=True)
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)


async def synthesize(text: str, outfile: Path, voice: str = VOICE, sem: asyncio.Semaphore | None = None):
    if outfile.exists():
        return
    attempt = 0
    while attempt <= RETRIES:
        attempt += 1
        try:
            if sem:
                async with sem:
                    await edge_tts.Communicate(text=text, voice=voice).save(str(outfile))
            else:
                await edge_tts.Communicate(text=text, voice=voice).save(str(outfile))
            print(f"✔ Saved {outfile}")
            return
        except Exception as exc:  # pylint: disable=broad-except
            outfile.unlink(missing_ok=True)
            wait = BACKOFF_BASE ** attempt
            print(f"✖ Failed {outfile} (attempt {attempt}/{RETRIES}): {exc}. Retrying in {wait:.1f}s")
            await asyncio.sleep(wait)
    print(f"⚠ Gave up on {outfile} after {RETRIES} retries.")


async def generate_counts():
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []
    for n in range(COUNT_START, COUNT_END + 1):
        text = f"{n} reps"
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
