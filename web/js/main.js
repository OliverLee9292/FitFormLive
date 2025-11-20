import { initSpeechOnce, speakText, playCountTTS, playCountdownPrompt, playAvatarPhrase } from "./tts.js";
import {
  EXERCISES,
  state,
  resetCounter,
  updateRepsForExercise,
  isStartReady,
  buildSummary,
  setCurrentExercise,
} from "./workout.js";
import { createDetector, toVec2, angleBetween, drawSkeleton, isFullBodyVisible } from "./pose.js";
import {
  initAvatar,
  startAvatarAnimation,
  stopAvatarAnimation,
  loadAvatarModel,
  updateAvatarFromPose,
} from "./avatar.js";
import { renderExercisePicker, updateHud, showSummaryOverlay, hideSummaryOverlay, setActiveMenu } from "./ui.js";
import { setChallengeDuration, startChallengeTimer, updateChallengeTimer, resetChallenge } from "./challenge.js";

const videoEl = document.getElementById("video");
const canvasEl = document.getElementById("canvas");
const ctx = canvasEl.getContext("2d");

const hudExercise = document.getElementById("hud-exercise");
const hudReps = document.getElementById("hud-reps");
const hudAngle = document.getElementById("hud-angle");
const hudFps = document.getElementById("hud-fps");
const statusDot = document.getElementById("status-dot");
const statusLabel = document.getElementById("status-label");
const statusDetail = document.getElementById("status-detail");
const toggleCameraBtn = document.getElementById("toggle-camera");
const toggleOverlayBtn = document.getElementById("toggle-overlay");
const resetBtn = document.getElementById("reset-btn");
const startWorkoutBtn = document.getElementById("start-workout-btn");
const countdownEl = document.getElementById("countdown-overlay");
const repOverlayEl = document.getElementById("rep-overlay");
const summaryOverlayEl = document.getElementById("summary-overlay");
const currentExerciseNameEl = document.getElementById("current-exercise-name");
const exercisePickerOverlay = document.getElementById("exercise-picker-overlay");
const exercisePickerPanel = document.getElementById("exercise-picker-panel");
const openExercisePickerBtn = document.getElementById("open-exercise-picker");
const avatarStyleWrapper = document.getElementById("avatar-style-wrapper");
const avatarStyleSelect = document.getElementById("avatar-style-select");
const avatarWarningEl = document.getElementById("avatar-warning");
const avatarContainer = document.getElementById("avatar-container");
const cameraLayer = document.getElementById("camera-layer");
const challengeRemainingEl = document.getElementById("challenge-remaining");
const challengeView = document.getElementById("challenge-view");
const summaryCloseHandler = () => hideSummaryOverlay(summaryOverlayEl);

const trainingView = document.getElementById("training-view");
const avatarView = document.getElementById("avatar-view");
const devView = document.getElementById("dev-view");

const menuTrainingBtn = document.getElementById("menu-training");
const menuAvatarBtn = document.getElementById("menu-avatar");
const menuChallengeBtn = document.getElementById("menu-challenge");
const menuDevBtn = document.getElementById("menu-dev");
const menuButtons = document.querySelectorAll("#top-menu .btn.secondary");

const challengeButtons = document.querySelectorAll(".challenge-timer");

const uiTargets = {
  hudReps,
  hudAngle,
  hudFps,
  statusLabel,
  statusDetail,
  statusDot,
};

function updateCurrentExerciseLabel() {
  const ex = EXERCISES[state.currentKey];
  if (hudExercise && ex) {
    hudExercise.textContent = ex.name;
  }
  if (currentExerciseNameEl && ex) {
    currentExerciseNameEl.textContent = ex.name;
  }
}

function openExercisePicker() {
  if (!exercisePickerOverlay || !exercisePickerPanel) return;
  renderExercisePicker(exercisePickerPanel, EXERCISES, (key) => {
    selectExerciseAndStart(key);
  }, closeExercisePicker);
  exercisePickerOverlay.style.opacity = 1;
  exercisePickerOverlay.style.pointerEvents = "auto";
}

function closeExercisePicker() {
  if (!exercisePickerOverlay) return;
  exercisePickerOverlay.style.opacity = 0;
  exercisePickerOverlay.style.pointerEvents = "none";
}

function selectExerciseAndStart(key) {
  if (!EXERCISES[key]) return;
  setCurrentExercise(key);
  resetCounter();
  state.workoutStarted = false;
  state.stage = "up";

  const ex = EXERCISES[key];
  updateCurrentExerciseLabel();
  statusLabel.textContent = "동작 선택됨";
  statusDetail.textContent =
    (ex.start?.hint || "준비자세를 맞춰 주세요.") + " 운동 시작 버튼을 누르면 5초 후에 시작합니다.";
  speakText(
    `${ex.name}를 선택했습니다. ${ex.start?.hint || "준비자세를 맞춰 주세요."} 준비가 되면 운동 시작 버튼을 눌러 주세요.`
  );

  closeExercisePicker();
}

function handleRepCounted(rep) {
  if (repOverlayEl) {
    if (state.repOverlayTimer) {
      clearTimeout(state.repOverlayTimer);
    }
    repOverlayEl.textContent = rep;
    repOverlayEl.style.opacity = 1;
    state.repOverlayTimer = setTimeout(() => {
      repOverlayEl.style.opacity = 0;
    }, 700);
  }
  playCountTTS(rep);
}

const FULL_BODY_REQUIRED_FRAMES = 2;
const FULL_BODY_STABLE_MAX = 60;
const FULL_BODY_LOSS_GRACE_MS = 3500;

function handleFullBodyState(keypoints) {
  if (state.currentMode !== "avatar") {
    state.fullBodyDetected = false;
    state.workoutPausedForNoBody = false;
    state.waitingForFullBodyStart = false;
    state.fullBodyStableFrames = 0;
    if (avatarWarningEl) avatarWarningEl.style.display = "none";
    return;
  }
  const now = performance.now();
  const rawVisible = isFullBodyVisible(keypoints);
  if (rawVisible) {
    state.fullBodyStableFrames = Math.min(state.fullBodyStableFrames + 1, FULL_BODY_STABLE_MAX);
    state.lastFullBodyTime = now;
  } else {
    state.fullBodyStableFrames = Math.max(state.fullBodyStableFrames - 1, 0);
  }
  const visible = rawVisible && state.fullBodyStableFrames >= FULL_BODY_REQUIRED_FRAMES;

  if (visible) {
    state.fullBodyDetected = true;
    state.lastFullBodyTime = now;
    if (avatarWarningEl) avatarWarningEl.style.display = "none";

    if (state.waitingForFullBodyStart) {
      state.waitingForFullBodyStart = false;
      state.workoutPausedForNoBody = false;
      playAvatarPhrase(
        "avatar_fullbody_ready",
        "전신이 인식되었습니다. 운동을 시작합니다."
      );
      startCountdownAndWorkout();
      return;
    }

    if (state.workoutPausedForNoBody && state.workoutStarted && !state.countdownActive) {
      state.workoutPausedForNoBody = false;
      playAvatarPhrase(
        "avatar_resume",
        "전신이 다시 인식되었습니다. 운동을 계속합니다."
      );
    }
    return;
  }

  if (avatarWarningEl) {
    avatarWarningEl.style.display = "flex";
  }

  if (state.waitingForFullBodyStart) {
    state.fullBodyDetected = false;
    return;
  }

  if (state.workoutStarted && !state.countdownActive) {
    const elapsed = now - state.lastFullBodyTime;
    if (!state.workoutPausedForNoBody && elapsed > FULL_BODY_LOSS_GRACE_MS) {
      state.workoutPausedForNoBody = true;
      playAvatarPhrase(
        "avatar_lost",
        "전신이 인식되지 않습니다. 카메라와 충분한 거리를 벌려주십시오."
      );
    }
  }
  state.fullBodyDetected = false;
}

async function renderLoop() {
  if (!state.detector || !state.running) return;
  const now = performance.now();
  const dt = now - state.lastFrameTime;
  state.lastFrameTime = now;
  state.fps = 1000 / dt;

  const poses = await state.detector.estimatePoses(videoEl, {
    maxPoses: 1,
    flipHorizontal: true,
  });

  if (poses.length > 0) {
    const kp = poses[0].keypoints;
    handleFullBodyState(kp);
    const ex = EXERCISES[state.currentKey];
    const [ia, ib, ic] = ex.angleJoints;
    const a = toVec2(kp[ia]);
    const b = toVec2(kp[ib]);
    const c = toVec2(kp[ic]);
    const angle = angleBetween(a, b, c);
    state.lastAngle = angle;

    if (state.isAvatarMode && state.fullBodyDetected) {
      updateAvatarFromPose(kp);
    }

    if (!state.workoutStarted) {
      const ok = isStartReady(ex, angle, kp);
      state.startStableFrames = ok ? state.startStableFrames + 1 : 0;
      drawSkeleton({ ctx, canvasEl, videoEl, keypoints: kp, showSkeleton: state.showSkeleton });
      updateHud(uiTargets, {
        reps: state.reps,
        angle,
        fps: state.fps,
        label: ok ? "Hold start position" : "Set start position",
        detail: ex.start?.hint || "준비자세를 맞춰 주세요. (정면을 보고 화면 중앙에 서세요.)",
        good: ok,
      });
    } else if (state.currentMode === "avatar" && state.workoutPausedForNoBody) {
      drawSkeleton({ ctx, canvasEl, videoEl, keypoints: kp, showSkeleton: state.showSkeleton });
      updateHud(uiTargets, {
        reps: state.reps,
        angle,
        fps: state.fps,
        label: "전신 인식 안 됨",
        detail: "카메라와 충분한 거리를 두어 전신이 모두 보이게 서주세요.",
        good: false,
      });
    } else {
      const counted = updateRepsForExercise(ex, angle);
      if (counted && state.reps > 0) {
        handleRepCounted(state.reps);
        if (state.currentMode !== "challenge" && state.reps >= 30 && state.workoutStarted) {
          stopWorkout(true);
        }
      }
      const fb = ex.feedback(angle);
      state.totalFrames += 1;
      if (fb.good) state.goodFrames += 1;
      drawSkeleton({ ctx, canvasEl, videoEl, keypoints: kp, showSkeleton: state.showSkeleton });
      updateHud(uiTargets, {
        reps: state.reps,
        angle,
        fps: state.fps,
        label: fb.label,
        detail: fb.detail,
        good: fb.good,
      });
    }
  } else {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    statusLabel.textContent = "No pose";
    statusDetail.textContent = "사람이 화면 안에 있도록 위치를 조정하세요.";
    statusDot.classList.remove("good", "bad");
    handleFullBodyState(null);
  }

  updateChallengeTimer(challengeRemainingEl, () => stopWorkout(true));
  state.animationId = requestAnimationFrame(renderLoop);
}

async function startCamera() {
  if (state.running) return;
  try {
    toggleCameraBtn.disabled = true;
    toggleCameraBtn.textContent = "카메라 준비 중...";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false,
    });
    state.stream = stream;
    videoEl.srcObject = stream;
    await videoEl.play();
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    if (!state.detector) {
      state.detector = await createDetector();
    }

    state.running = true;
    state.lastFrameTime = performance.now();
    toggleCameraBtn.textContent = "카메라 정지";
    toggleCameraBtn.disabled = false;
    renderLoop();
    speakText("카메라가 시작되었습니다. 화면 중앙에 서서 자세를 맞춰 주세요.");
  } catch (err) {
    console.error(err);
    alert("카메라 접근 중 오류가 발생했습니다. 브라우저 권한을 확인하세요.");
    toggleCameraBtn.textContent = "카메라 시작";
    toggleCameraBtn.disabled = false;
  }
}

function stopCamera() {
  state.running = false;
  if (state.animationId) cancelAnimationFrame(state.animationId);
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  toggleCameraBtn.textContent = "카메라 시작";
  toggleCameraBtn.disabled = false;
}

function playCountdown() {
  countdownEl.textContent = state.countdownValue;
  countdownEl.style.opacity = 1;
  playCountdownPrompt();
}

function startCountdownAndWorkout() {
  if (!state.running || state.countdownActive) return;

  if (state.currentMode === "challenge" && !state.challengeDurationMinutes) {
    statusLabel.textContent = "시간 선택 필요";
    statusDetail.textContent = "도전 모드에서는 먼저 도전 시간을 선택해 주세요.";
    speakText("도전 시간을 먼저 선택해 주세요.");
    return;
  }

  if (startWorkoutBtn) {
    startWorkoutBtn.textContent = state.currentMode === "challenge" ? "도전 중지" : "운동 정지";
  }

  resetCounter({ keepButtonLabel: true });
  state.countdownActive = true;
  state.countdownValue = 5;
  statusLabel.textContent = "시작 준비";
  statusDetail.textContent = "5초 후에 시작합니다.";
  playCountdown();

  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
  }

  state.countdownTimerId = setInterval(() => {
    state.countdownValue -= 1;
    if (state.countdownValue > 0) {
      countdownEl.textContent = state.countdownValue;
    } else {
      clearInterval(state.countdownTimerId);
      state.countdownTimerId = null;
      countdownEl.style.opacity = 0;
      state.countdownActive = false;
      state.workoutStarted = true;
      statusLabel.textContent = state.currentMode === "challenge" ? "도전 시작" : "운동 시작";
      statusDetail.textContent = "";
      speakText("시작합니다.");
      if (state.currentMode === "challenge") {
        startChallengeTimer();
      } else {
        state.challengeActive = false;
        if (challengeRemainingEl) challengeRemainingEl.textContent = "-";
      }
    }
  }, 1000);
}

function stopWorkout(auto = false) {
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }
  state.challengeActive = false;
  if (challengeRemainingEl) {
    challengeRemainingEl.textContent = "-";
  }
  state.workoutStarted = false;
  state.countdownActive = false;
  state.startStableFrames = 0;
  state.waitingForFullBodyStart = false;
  state.workoutPausedForNoBody = false;
  state.fullBodyDetected = false;
  countdownEl.style.opacity = 0;
  if (startWorkoutBtn) {
    startWorkoutBtn.textContent = state.currentMode === "challenge" ? "도전 시작" : "운동 시작";
  }

  if (auto) {
    statusLabel.textContent = "목표 완료";
    statusDetail.textContent = "30회를 완료했습니다. 요약을 확인하세요.";
  } else {
    statusLabel.textContent = "운동 정지";
    statusDetail.textContent = "다시 시작하려면 '운동 시작'을 누르세요.";
  }

  const summaryData = buildSummary();
  showSummaryOverlay(summaryOverlayEl, summaryData, summaryCloseHandler);
  if (state.reps > 0) {
    speakText(`총 ${state.reps}회 수행했습니다. 수고하셨습니다.`);
  }
}

function hideSummary() {
  hideSummaryOverlay(summaryOverlayEl);
}

function handleMenuChange(target) {
  if (!target) return;

  if (target === menuTrainingBtn) {
    trainingView.style.display = "block";
    avatarView.style.display = "none";
    devView.style.display = "none";
    if (challengeView) challengeView.style.display = "none";
    state.currentMode = "training";
    state.isAvatarMode = false;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "none";
    state.showSkeleton = true;
    toggleOverlayBtn.style.display = "inline-flex";
    toggleOverlayBtn.textContent = "포즈선 끄기";
    if (avatarContainer) avatarContainer.style.display = "none";
    if (cameraLayer) cameraLayer.style.display = "block";
    stopAvatarAnimation();
    resetChallenge(challengeRemainingEl);
    if (startWorkoutBtn) startWorkoutBtn.textContent = "운동 시작";
  } else if (target === menuAvatarBtn) {
    trainingView.style.display = "block";
    avatarView.style.display = "block";
    devView.style.display = "none";
    if (challengeView) challengeView.style.display = "none";
    state.currentMode = "avatar";
    state.isAvatarMode = true;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "block";
    state.showSkeleton = false;
    toggleOverlayBtn.style.display = "none";
    if (avatarContainer) {
      avatarContainer.style.display = "block";
      if (cameraLayer) cameraLayer.style.display = "none";
      avatarContainer.style.borderRadius = "18px";
      avatarContainer.style.inset = "0";
      avatarContainer.style.width = "100%";
      avatarContainer.style.height = "100%";
    }
    if (avatarWarningEl) avatarWarningEl.style.display = "flex";
    state.fullBodyDetected = false;
    state.workoutPausedForNoBody = false;
    state.waitingForFullBodyStart = false;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    if (!window.__avatarInitialized) {
      initAvatar(avatarContainer);
      window.__avatarInitialized = true;
    }
    startAvatarAnimation();
    if (startWorkoutBtn) startWorkoutBtn.textContent = "운동 시작";
    resetChallenge(challengeRemainingEl);
  } else if (target === menuChallengeBtn) {
    trainingView.style.display = "block";
    avatarView.style.display = "none";
    devView.style.display = "none";
    state.currentMode = "challenge";
    state.isAvatarMode = false;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "none";
    state.showSkeleton = true;
    toggleOverlayBtn.style.display = "inline-flex";
    toggleOverlayBtn.textContent = "포즈선 끄기";
    if (avatarContainer) avatarContainer.style.display = "none";
    if (cameraLayer) cameraLayer.style.display = "block";
    stopAvatarAnimation();
    if (startWorkoutBtn) startWorkoutBtn.textContent = "도전 시작";
    if (challengeView) challengeView.style.display = "block";
  } else if (target === menuDevBtn) {
    trainingView.style.display = "none";
    avatarView.style.display = "none";
    devView.style.display = "block";
    if (challengeView) challengeView.style.display = "none";
    state.currentMode = "dev";
    state.isAvatarMode = false;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "none";
    stopAvatarAnimation();
    resetChallenge(challengeRemainingEl);
    if (startWorkoutBtn) startWorkoutBtn.textContent = "운동 시작";
  }
  setActiveMenu(menuButtons, target);
}

function initEventListeners() {
  toggleOverlayBtn.addEventListener("click", () => {
    state.showSkeleton = !state.showSkeleton;
    toggleOverlayBtn.textContent = state.showSkeleton ? "포즈선 끄기" : "포즈선 켜기";
    if (!state.showSkeleton) {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
  });

  toggleCameraBtn.addEventListener("click", () => {
    if (!state.running) startCamera();
    else stopCamera();
  });

  resetBtn.addEventListener("click", () => {
    resetCounter();
    hudReps.textContent = "0";
    hudAngle.textContent = "0°";
    if (repOverlayEl) repOverlayEl.style.opacity = 0;
    hideSummary();
  });

  startWorkoutBtn.addEventListener("click", () => {
    if (
      state.workoutStarted ||
      state.countdownActive ||
      state.waitingForFullBodyStart ||
      state.workoutPausedForNoBody
    ) {
      stopWorkout(false);
      return;
    }

    if (state.currentMode === "avatar") {
      state.waitingForFullBodyStart = true;
      state.workoutPausedForNoBody = false;
      state.fullBodyDetected = false;
      statusLabel.textContent = "전신 인식 대기";
      statusDetail.textContent = "카메라와 충분한 거리를 두어 전신이 모두 보이게 서주세요.";
      if (avatarWarningEl) avatarWarningEl.style.display = "flex";
      if (startWorkoutBtn) startWorkoutBtn.textContent = "운동 정지";
      playAvatarPhrase(
        "avatar_start_warning",
        "아바타 모드에서는 전신이 화면에 모두 들어와야 합니다. 카메라와 충분한 거리를 두어주세요."
      );
      return;
    }

    startCountdownAndWorkout();
  });

  if (openExercisePickerBtn) {
    openExercisePickerBtn.addEventListener("click", () => openExercisePicker());
  }

  if (exercisePickerOverlay) {
    exercisePickerOverlay.addEventListener("click", (ev) => {
      if (ev.target === exercisePickerOverlay) {
        closeExercisePicker();
      }
    });
  }

  if (avatarStyleSelect) {
    avatarStyleSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      if (!window.__avatarInitialized) {
        initAvatar(avatarContainer);
        window.__avatarInitialized = true;
      }
      loadAvatarModel(value);
    });
  }

  challengeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mins = parseInt(btn.dataset.minutes, 10);
      challengeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setChallengeDuration(mins, challengeRemainingEl);
      statusLabel.textContent = "도전 시간 선택됨";
      statusDetail.textContent = `${mins}분 동안 수행 가능한 횟수를 측정합니다.`;
    });
  });

  menuTrainingBtn.addEventListener("click", () => handleMenuChange(menuTrainingBtn));
  menuAvatarBtn.addEventListener("click", () => handleMenuChange(menuAvatarBtn));
  menuChallengeBtn.addEventListener("click", () => handleMenuChange(menuChallengeBtn));
  menuDevBtn.addEventListener("click", () => handleMenuChange(menuDevBtn));

}

function init() {
  initSpeechOnce();
  updateCurrentExerciseLabel();
  if (hudExercise) {
    hudExercise.textContent = EXERCISES[state.currentKey].name;
  }
  handleMenuChange(menuTrainingBtn);
  initEventListeners();
}

window.addEventListener("DOMContentLoaded", init);
