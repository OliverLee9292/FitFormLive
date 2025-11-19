import { speakText } from "./tts.js";
import { state } from "./workout.js";

export function setChallengeDuration(minutes, remainingEl) {
  state.challengeDurationMinutes = minutes;
  state.challengeActive = false;
  if (remainingEl) {
    remainingEl.textContent = String(minutes).padStart(2, "0") + ":00";
  }
  speakText(`${minutes}분 도전을 선택했습니다.`);
}

export function startChallengeTimer() {
  if (!state.challengeDurationMinutes) return;
  state.challengeActive = true;
  state.challengeEndTime = performance.now() + state.challengeDurationMinutes * 60000;
  speakText(`${state.challengeDurationMinutes}분 도전 시작합니다.`);
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
    speakText("도전 종료! 수고하셨습니다.");
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
