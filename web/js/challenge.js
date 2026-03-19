import { speakText } from "./tts.js";
import { state } from "./workout.js";
import { getLanguage } from "./i18n.js";

export function setChallengeDuration(minutes, remainingEl) {
  state.challengeDurationMinutes = minutes;
  state.challengeActive = false;
  if (remainingEl) {
    remainingEl.textContent = String(minutes).padStart(2, "0") + ":00";
  }
  const lang = getLanguage();
  const text = lang === "en" ? `Selected ${minutes} minute challenge.` : `${minutes}분 도전을 선택했습니다.`;
  speakText(text);
}

export function startChallengeTimer() {
  if (!state.challengeDurationMinutes) return;
  state.challengeActive = true;
  state.challengeEndTime = performance.now() + state.challengeDurationMinutes * 60000;
  const lang = getLanguage();
  const text = lang === "en" ? `Starting ${state.challengeDurationMinutes} minute challenge.` : `${state.challengeDurationMinutes}분 도전 시작합니다.`;
  speakText(text);
}

export function updateChallengeTimer(remainingEl, onComplete) {
  if (!state.challengeActive) return;
  const now = performance.now();
  const remainingMs = state.challengeEndTime - now;
  if (remainingMs <= 0) {
    state.challengeActive = false;
    if (remainingEl) remainingEl.textContent = "00:00";
    if (typeof onComplete === "function") {
      onComplete();
    }
    const lang = getLanguage();
    const text = lang === "en" ? "Challenge finished! Great job." : "도전 종료! 수고하셨습니다.";
    speakText(text);
    return;
  }
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (remainingEl) {
    remainingEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

export function resetChallenge(remainingEl) {
  state.challengeActive = false;
  state.challengeDurationMinutes = null;
  if (remainingEl) {
    remainingEl.textContent = "-";
  }
}
