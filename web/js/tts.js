let ttsEnabled = true;
let isSpeaking = false;
let speechConfig = null;
let audioConfig = null;
let synthesizer = null;
let cacheSynthesizer = null;
let pendingText = null;
let speechInitPromise = null;
let ttsReady = false;
let countdownAudio = null;
const ttsCache = {};
const avatarTtsCache = {};

const KOREAN_UNITS = [
  "",
  "하나",
  "둘",
  "셋",
  "넷",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
];

const KOREAN_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
const KOREAN_HUNDREDS = ["", "백", "이백", "삼백", "사백", "오백", "육백", "칠백", "팔백", "구백"];

function getKoreanCountWord(n) {
  if (n >= 1 && n <= 999) {
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const unit = n % 10;

    let word = "";
    if (hundreds > 0) {
      word += KOREAN_HUNDREDS[hundreds];
    }
    if (tens > 0) {
      word += KOREAN_TENS[tens];
    }
    if (unit > 0 || (hundreds === 0 && tens === 0)) {
      word += KOREAN_UNITS[unit];
    }
    return word || String(n);
  }
  return String(n);
}

async function initSpeech() {
  if (!window.SpeechSDK) {
    console.warn("SpeechSDK가 아직 로드되지 않았습니다.");
    return;
  }
  if (speechConfig && audioConfig && synthesizer) {
    return;
  }
  try {
    const res = await fetch("/api/getspeechtoken");
    if (!res.ok) {
      console.error("Failed to fetch speech token:", res.status);
      return;
    }
    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.warn("/api/getspeechtoken 응답이 JSON이 아닙니다. TTS 초기화를 건너뜁니다.");
      return;
    }
    if (!data.token || !data.region) {
      console.error("Speech token response invalid:", data);
      return;
    }

    speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      data.token,
      data.region
    );
    speechConfig.speechSynthesisVoiceName = "ko-KR-SunHiNeural";
    if (SpeechSDK.SpeechSynthesisOutputFormat) {
      speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
    }

    audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    cacheSynthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, null);
    ttsReady = true;

    preloadCountdownAudio();
    preloadNumberRange(1, 5);
    preloadAvatarPhrases();

    if (pendingText) {
      const textToSpeak = pendingText;
      pendingText = null;
      internalSpeak(textToSpeak);
    }
  } catch (err) {
    console.error("initSpeech() 중 오류:", err);
  }
}

export function initSpeechOnce() {
  if (!speechInitPromise) {
    speechInitPromise = initSpeech();
  }
  return speechInitPromise;
}

export function speakText(text) {
  if (!ttsEnabled || !text) return;
  if (!window.SpeechSDK) {
    console.warn("SpeechSDK is not loaded yet.");
    return;
  }
  if (!ttsReady || !speechConfig || !audioConfig || !synthesizer) {
    pendingText = text;
    initSpeechOnce();
    return;
  }
  pendingText = text;
  if (isSpeaking) {
    synthesizer.stopSpeakingAsync(
      () => {
        isSpeaking = false;
        const next = pendingText;
        pendingText = null;
        if (next) internalSpeak(next);
      },
      (err) => {
        console.error("TTS stop error:", err);
        isSpeaking = false;
        const next = pendingText;
        pendingText = null;
        if (next) internalSpeak(next);
      }
    );
  } else {
    const next = pendingText;
    pendingText = null;
    internalSpeak(next);
  }
}

function internalSpeak(text) {
  if (!text || !synthesizer) return;
  try {
    isSpeaking = true;
    synthesizer.speakTextAsync(
      text,
      (result) => {
        isSpeaking = false;
        if (result.reason === SpeechSDK.ResultReason.Canceled) {
          const cancellation = SpeechSDK.CancellationDetails.fromResult(result);
          console.warn("TTS canceled:", cancellation.reason, cancellation.errorDetails);
        }
      },
      (err) => {
        console.error("TTS error:", err);
        isSpeaking = false;
      }
    );
  } catch (err) {
    console.error("TTS exception:", err);
    isSpeaking = false;
  }
}

function preloadSingleNumber(n) {
  if (!ttsReady || !cacheSynthesizer || ttsCache[n]) return;
  const word = getKoreanCountWord(n) + "!";
  cacheSynthesizer.speakTextAsync(
    word,
    (result) => {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        const audioData = result.audioData;
        if (audioData) {
          try {
            const blob = new Blob([audioData], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);
            ttsCache[n] = new Audio(url);
          } catch (e) {
            console.warn("Failed to build audio blob for rep", n, e);
          }
        }
      }
    },
    (err) => {
      console.error("Preload TTS error:", err);
    }
  );
}

function preloadNumberRange(start, end) {
  for (let n = start; n <= end; n += 1) {
    preloadSingleNumber(n);
  }
}

function preloadCountdownAudio() {
  if (!ttsReady || !cacheSynthesizer || countdownAudio) return;
  const text = "5초 후에 시작합니다.";
  cacheSynthesizer.speakTextAsync(
    text,
    (result) => {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        const audioData = result.audioData;
        if (audioData) {
          try {
            const blob = new Blob([audioData], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);
            countdownAudio = new Audio(url);
          } catch (e) {
            console.warn("Failed to build countdown audio blob", e);
          }
        }
      }
    },
    (err) => {
      console.error("Preload countdown TTS error:", err);
    }
  );
}

function preloadAvatarPhrase(key, text) {
  if (!ttsReady || !cacheSynthesizer || avatarTtsCache[key]) return;
  cacheSynthesizer.speakTextAsync(
    text,
    (result) => {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        const audioData = result.audioData;
        if (audioData) {
          try {
            const blob = new Blob([audioData], { type: "audio/mpeg" });
            const url = URL.createObjectURL(blob);
            avatarTtsCache[key] = new Audio(url);
          } catch (e) {
            console.warn("Failed to build avatar phrase audio blob", e);
          }
        }
      }
    },
    (err) => {
      console.error("Preload avatar phrase TTS error:", err);
    }
  );
}

function preloadAvatarPhrases() {
  preloadAvatarPhrase(
    "avatar_start_warning",
    "아바타 모드에서는 전신이 화면에 모두 들어와야 합니다. 카메라와 충분한 거리를 두어주세요."
  );
  preloadAvatarPhrase(
    "avatar_fullbody_ready",
    "전신이 인식되었습니다. 운동을 시작합니다."
  );
  preloadAvatarPhrase(
    "avatar_resume",
    "전신이 다시 인식되었습니다. 운동을 계속합니다."
  );
  preloadAvatarPhrase(
    "avatar_lost",
    "전신이 인식되지 않습니다. 카메라와 충분한 거리를 벌려주십시오."
  );
}

export function playAvatarPhrase(key, fallbackText) {
  const audio = avatarTtsCache[key];
  if (audio) {
    try {
      audio.currentTime = 0;
      audio.play();
      return;
    } catch (e) {
      console.warn("Avatar cached audio play error, fallback to live TTS:", e);
    }
  }
  if (fallbackText) {
    speakText(fallbackText);
  }
}

export function playCountTTS(rep) {
  if (rep <= 0 || rep > 999) return;
  const cached = ttsCache[rep];
  if (cached) {
    try {
      cached.currentTime = 0;
      cached.play();
    } catch (e) {
      console.warn("Cached audio play error, fallback to live TTS:", e);
      const word = getKoreanCountWord(rep);
      speakText(word + "!");
    }
  } else {
    const word = getKoreanCountWord(rep);
    speakText(word + "!");
    if (rep >= 1 && rep < 999) {
      preloadSingleNumber(rep + 1);
    }
    return;
  }
  if (rep >= 1 && rep < 999) {
    preloadSingleNumber(rep + 1);
  }
}

export function playCountdownPrompt() {
  if (countdownAudio) {
    try {
      countdownAudio.currentTime = 0;
      countdownAudio.play();
      return;
    } catch (e) {
      console.warn("Countdown cached audio play error, fallback to TTS:", e);
    }
  }
  speakText("5초 후에 시작합니다.");
  if (ttsReady) {
    preloadCountdownAudio();
  }
}
