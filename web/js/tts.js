let ttsEnabled = true;
let voiceReady = false;
let preferredVoice = null;
let countdownAudio = null;
const audioCache = {};
let ttsLanguage = "ko"; // "ko" or "en"

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
    if (hundreds > 0) word += KOREAN_HUNDREDS[hundreds];
    if (tens > 0) word += KOREAN_TENS[tens];
    if (unit > 0 || (hundreds === 0 && tens === 0)) word += KOREAN_UNITS[unit];
    return word || String(n);
  }
  return String(n);
}

function getCountWord(n) {
  if (ttsLanguage === "en") {
    return String(n);
  }
  return getKoreanCountWord(n);
}

function loadVoice() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices();
  const desiredPrefix = ttsLanguage === "en" ? "en" : "ko";
  const filtered = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(desiredPrefix));
  preferredVoice = filtered[0] || voices[0] || null;
  voiceReady = true;
}

export function initSpeechOnce() {
  if (!window.speechSynthesis) {
    console.warn("speechSynthesis is not available in this browser.");
    return;
  }
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => loadVoice();
  }
  loadVoice();
}

function speak(text) {
  if (!ttsEnabled || !text) return;
  if (!window.speechSynthesis) return;
  if (!voiceReady) loadVoice();
  const utter = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utter.voice = preferredVoice;
  utter.lang = preferredVoice?.lang || (ttsLanguage === "en" ? "en-US" : "ko-KR");
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function playLocal(path) {
  if (!audioCache[path]) {
    audioCache[path] = new Audio(path);
  }
  return audioCache[path].play();
}

export function playAvatarPhrase(key, fallbackText) {
  const base = ttsLanguage === "en" ? "audio/tts_en/avatar" : "audio/tts/avatar";
  const path = `${base}/${key}.mp3`;
  playLocal(path).catch(() => fallbackText && speak(fallbackText));
}

export function playCountTTS(rep) {
  if (rep <= 0 || rep > 999) return;
  const base = ttsLanguage === "en" ? "audio/tts_en/count" : "audio/tts/count";
  const path = `${base}/${rep}.mp3`;
  playLocal(path).catch(() => speak(getCountWord(rep) + "!"));
}

export function playCountdownPrompt() {
  if (!countdownAudio) {
    const file = ttsLanguage === "en" ? "audio/tts_en/countdown.mp3" : "audio/tts/countdown.mp3";
    countdownAudio = new Audio(file);
  }
  countdownAudio.play().catch(() => {
    const fallback = ttsLanguage === "en" ? "Starting in 5 seconds." : "5초 후에 시작합니다.";
    speak(fallback);
  });
}

export function speakText(text) {
  speak(text);
}

export function setTTSEnabled(value) {
  ttsEnabled = Boolean(value);
}

export function setTtsLanguage(lang) {
  ttsLanguage = lang === "en" ? "en" : "ko";
  voiceReady = false;
  preferredVoice = null;
  countdownAudio = null;
  loadVoice();
}
