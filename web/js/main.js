import { initSpeechOnce, speakText, playCountTTS, playCountdownPrompt, playAvatarPhrase } from "./tts.js";
import {
  EXERCISES,
  state,
  resetCounter,
  updateRepsForExercise,
  isStartReady,
  buildSummary,
  setCurrentExercise,
  getStartHint,
} from "./workout.js";
import {
  createDetector,
  drawSkeleton,
  isFullBodyVisible,
  normalizeKeypoints,
  DETECTOR_TYPES,
  computeJointAngle,
} from "./pose.js";
import {
  initAvatar,
  startAvatarAnimation,
  stopAvatarAnimation,
  loadAvatarModel,
  updateAvatarFromPose,
  setAvatarExerciseKey,
  resizeAvatarRenderer,
} from "./avatar.js";
import { renderExercisePicker, updateHud, showSummaryOverlay, hideSummaryOverlay, setActiveMenu } from "./ui.js";
import { setChallengeDuration, startChallengeTimer, updateChallengeTimer, resetChallenge } from "./challenge.js";
import { initLanguage, setLanguage, getLanguage, t, applyStaticText } from "./i18n.js";
import { setTtsLanguage } from "./tts.js";

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
const toggleAvatarViewBtn = document.getElementById("toggle-avatar-view");
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
const modelLabelEl = document.getElementById("model-label");
const avatarContainer = document.getElementById("avatar-container");
const cameraLayer = document.getElementById("camera-layer");
const challengeRemainingEl = document.getElementById("challenge-remaining");
const challengeView = document.getElementById("challenge-view");
const summaryCloseHandler = () => hideSummaryOverlay(summaryOverlayEl);
const langToggleBtn = document.getElementById("lang-toggle");

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

function applyMirror(useMirror) {
  const scale = useMirror ? "scaleX(-1)" : "scaleX(1)";
  if (videoEl) videoEl.style.transform = scale;
  if (canvasEl) canvasEl.style.transform = scale;
}

function updateCurrentExerciseLabel() {
  const ex = EXERCISES[state.currentKey];
  if (hudExercise && ex) {
    hudExercise.textContent = ex.name;
  }
  if (currentExerciseNameEl && ex) {
    currentExerciseNameEl.textContent = ex.name;
  }
  const exLabelEl = document.getElementById("current-ex-label");
  if (exLabelEl) {
    exLabelEl.textContent = t("current_ex_label", "Current Exercise:");
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
  setAvatarExerciseKey(key);
  resetCounter();
  state.workoutStarted = false;
  state.stage = "up";

  const ex = EXERCISES[key];
  updateCurrentExerciseLabel();
  statusLabel.textContent = "동작 선택됨";
  statusDetail.textContent =
    (getStartHint(ex, getLanguage()) || "준비자세를 맞춰 주세요.") + " " + t("start_hint_suffix", "Press start to begin in 5 seconds.");
  speakText(
    `${ex.name} 선택. ${getStartHint(ex, getLanguage()) || ""} ${t("start_hint_suffix", "Press start to begin in 5 seconds.")}`
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

function getDesiredDetectorType() {
  return state.currentMode === "avatar" ? DETECTOR_TYPES.BLAZEPOSE : DETECTOR_TYPES.MOVENET;
}

function setModelLabel(type) {
  if (!modelLabelEl) return;
  if (type === DETECTOR_TYPES.BLAZEPOSE) {
    modelLabelEl.textContent = t("model_blazepose", "BlazePose GHUM 3D · On-device");
  } else {
    modelLabelEl.textContent = t("model_movenet", "MoveNet Lightning · On-device");
  }
}

function applyAvatarViewMode(mode) {
  state.avatarViewMode = mode;
  if (mode === "camera") {
    if (avatarContainer) avatarContainer.style.display = "none";
    if (cameraLayer) cameraLayer.style.display = "block";
    state.showSkeleton = true;
    applyMirror(false);
    if (toggleOverlayBtn) {
      toggleOverlayBtn.style.display = "inline-flex";
      toggleOverlayBtn.textContent = state.showSkeleton ? t("btn_overlay_off", "Hide Skeleton") : t("btn_overlay_on", "Show Skeleton");
    }
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.textContent = "아바타 보기";
    if (avatarWarningEl) avatarWarningEl.style.display = "none";
  } else {
    if (avatarContainer) avatarContainer.style.display = "block";
    if (cameraLayer) cameraLayer.style.display = "none";
    state.showSkeleton = true; // 카메라층은 숨기지만 포즈선 계산은 유지
    applyMirror(true);
    if (toggleOverlayBtn) {
      toggleOverlayBtn.style.display = "none";
      toggleOverlayBtn.textContent = state.showSkeleton ? t("btn_overlay_off", "Hide Skeleton") : t("btn_overlay_on", "Show Skeleton");
    }
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.textContent = "카메라 보기";
    if (avatarWarningEl) avatarWarningEl.style.display = "flex";
    if (avatarContainer && window.__avatarInitialized) {
      resizeAvatarRenderer(avatarContainer);
    }
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  }
}

async function ensureDetectorForMode() {
  const desired = getDesiredDetectorType();
  if (state.detector && state.detectorType === desired) {
    return state.detector;
  }
  const previous = state.detector;
  const newDetector = await createDetector(desired);
  if (previous && typeof previous.dispose === "function") {
    try {
      previous.dispose();
    } catch (e) {
      console.warn("Detector dispose failed", e);
    }
  }
  state.detector = newDetector;
  state.detectorType = desired;
  setModelLabel(desired);
  return state.detector;
}

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
    flipHorizontal: !(state.currentMode === "avatar" && state.avatarViewMode === "camera"),
  });

  if (poses.length > 0) {
    const { keypoints: kp, keypoints3D, keypoints33, keypoints3D33 } = normalizeKeypoints(
      poses[0],
      state.detectorType
    );
    handleFullBodyState(kp);
    const ex = EXERCISES[state.currentKey];
    const useAvatar = state.currentMode === "avatar";
    const keypointsForLogic = useAvatar ? keypoints33 : kp;
    const keypoints3DForLogic = useAvatar ? keypoints3D33 : keypoints3D;
    const joints = useAvatar && ex.angleJointsBP ? ex.angleJointsBP : ex.angleJoints;
    const drawPoints = useAvatar ? keypoints33 : kp;
    const [ia, ib, ic] = joints;
    const angle = computeJointAngle(keypointsForLogic, keypoints3DForLogic, ia, ib, ic);
    state.lastAngle = angle ?? 0;
    const angleForHud = angle ?? 0;

    if (state.isAvatarMode && state.fullBodyDetected) {
      updateAvatarFromPose(keypoints33, keypoints3D33);
    }

    if (!state.workoutStarted) {
      const ok = angle != null ? isStartReady(ex, angle, kp) : false;
      state.startStableFrames = ok ? state.startStableFrames + 1 : 0;
      drawSkeleton({
        ctx,
        canvasEl,
        videoEl,
        keypoints: drawPoints,
        showSkeleton:
          state.currentMode === "avatar"
            ? state.showSkeleton && state.avatarViewMode === "camera"
            : state.showSkeleton,
      });
      updateHud(uiTargets, {
        reps: state.reps,
        angle: angleForHud,
        fps: state.fps,
        label: angle == null ? t("pose_detecting_label", "Detecting pose") : ok ? "Hold start position" : "Set start position",
        detail:
          angle == null
            ? t("status_pose_detecting")
            : getStartHint(ex, getLanguage()) || "준비자세를 맞춰 주세요. (정면을 보고 화면 중앙에 서세요.)",
        good: ok,
      });
    } else if (state.currentMode === "avatar" && state.workoutPausedForNoBody) {
      drawSkeleton({
        ctx,
        canvasEl,
        videoEl,
        keypoints: drawPoints,
        showSkeleton:
          state.currentMode === "avatar"
            ? state.showSkeleton && state.avatarViewMode === "camera"
            : state.showSkeleton,
      });
      updateHud(uiTargets, {
        reps: state.reps,
        angle: angleForHud,
        fps: state.fps,
        label: t("fullbody_lost_label", "Full body not detected"),
        detail: t("status_wait_fullbody"),
        good: false,
      });
    } else {
      const counted = angle != null ? updateRepsForExercise(ex, angle) : false;
      if (counted && state.reps > 0) {
        handleRepCounted(state.reps);
        if (state.currentMode !== "challenge" && state.reps >= 30 && state.workoutStarted) {
          stopWorkout(true);
        }
      }
      const fb =
        angle == null
          ? { label: "Detecting", detail: "관절을 더 명확히 보기 위해 한 걸음 물러서 주세요.", good: false }
          : ex.feedback(angle);
      state.totalFrames += 1;
      if (fb.good) state.goodFrames += 1;
      drawSkeleton({
        ctx,
        canvasEl,
        videoEl,
        keypoints: drawPoints,
        showSkeleton:
          state.currentMode === "avatar"
            ? state.showSkeleton && state.avatarViewMode === "camera"
            : state.showSkeleton,
      });
      updateHud(uiTargets, {
        reps: state.reps,
        angle: angleForHud,
        fps: state.fps,
        label: fb.label,
        detail: fb.detail,
        good: fb.good,
      });
    }
  } else {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    statusLabel.textContent = "No pose";
    statusDetail.textContent = t("status_no_pose");
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

    await ensureDetectorForMode();

    state.running = true;
    state.lastFrameTime = performance.now();
    toggleCameraBtn.textContent = t("btn_camera_stop", "Stop Camera");
    toggleCameraBtn.disabled = false;
    renderLoop();
    speakText(t("camera_started", "Camera started. Stand in the center and match your posture."));
  } catch (err) {
    console.error(err);
    alert("카메라 접근 중 오류가 발생했습니다. 브라우저 권한을 확인하세요.");
    toggleCameraBtn.textContent = t("btn_camera_start", "Start Camera");
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
  if (state.detector && typeof state.detector.dispose === "function") {
    try {
      state.detector.dispose();
    } catch (e) {
      console.warn("Detector dispose failed", e);
    }
  }
  state.detector = null;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  toggleCameraBtn.textContent = t("btn_camera_start", "Start Camera");
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
    statusLabel.textContent = t("challenge_time_needed", "Select duration first");
    statusDetail.textContent = "도전 모드에서는 먼저 도전 시간을 선택해 주세요.";
    speakText("도전 시간을 먼저 선택해 주세요.");
    return;
  }

  if (startWorkoutBtn) {
    startWorkoutBtn.textContent = state.currentMode === "challenge" ? t("btn_challenge_stop", "Stop Challenge") : t("btn_stop", "Stop Workout");
  }

  resetCounter({ keepButtonLabel: true });
  state.countdownActive = true;
  state.countdownValue = 5;
  statusLabel.textContent = t("countdown_label", "Get Ready");
  statusDetail.textContent = t("countdown_detail", "Starting in 5 seconds.");
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
      statusLabel.textContent = state.currentMode === "challenge" ? t("btn_challenge_start", "Start Challenge") : t("btn_start", "Start Workout");
      statusDetail.textContent = "";
      speakText(t("start_message", "Starting now."));
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
    startWorkoutBtn.textContent = state.currentMode === "challenge" ? t("btn_challenge_start", "Start Challenge") : t("btn_start", "Start Workout");
  }

  if (auto) {
    statusLabel.textContent = t("goal_done", "Goal completed");
    statusDetail.textContent = t("summary_auto", "Completed 30 reps. Check the summary.");
  } else {
    statusLabel.textContent = t("btn_stop", "Stop Workout");
    statusDetail.textContent = t("summary_stop", "Press 'Start Workout' to begin again.");
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
    state.avatarViewMode = "avatar";
    state.lastAngle = 0;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "none";
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.style.display = "none";
    state.showSkeleton = true;
    applyMirror(true);
    toggleOverlayBtn.style.display = "inline-flex";
    toggleOverlayBtn.textContent = t("btn_overlay_off", "Hide Skeleton");
    if (avatarContainer) avatarContainer.style.display = "none";
    if (cameraLayer) cameraLayer.style.display = "block";
    stopAvatarAnimation();
    resetChallenge(challengeRemainingEl);
    if (startWorkoutBtn) startWorkoutBtn.textContent = t("btn_start", "Start Workout");
  } else if (target === menuAvatarBtn) {
    trainingView.style.display = "block";
    avatarView.style.display = "block";
    devView.style.display = "none";
    if (challengeView) challengeView.style.display = "none";
    state.currentMode = "avatar";
    state.isAvatarMode = true;
    state.avatarViewMode = "avatar";
    state.lastAngle = 0;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "block";
    state.showSkeleton = true;
    applyMirror(false);
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.style.display = "inline-flex";
    if (avatarContainer) {
      avatarContainer.style.borderRadius = "18px";
      avatarContainer.style.inset = "0";
      avatarContainer.style.width = "100%";
      avatarContainer.style.height = "100%";
    }
    applyAvatarViewMode("avatar");
    state.fullBodyDetected = false;
    state.workoutPausedForNoBody = false;
    state.waitingForFullBodyStart = false;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    if (!window.__avatarInitialized) {
      initAvatar(avatarContainer);
      window.__avatarInitialized = true;
    }
    startAvatarAnimation();
    if (startWorkoutBtn) startWorkoutBtn.textContent = t("btn_start", "Start Workout");
    resetChallenge(challengeRemainingEl);
  } else if (target === menuChallengeBtn) {
    trainingView.style.display = "block";
    avatarView.style.display = "none";
    devView.style.display = "none";
    state.currentMode = "challenge";
    state.isAvatarMode = false;
    state.avatarViewMode = "avatar";
    state.lastAngle = 0;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "none";
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.style.display = "none";
    state.showSkeleton = true;
    applyMirror(true);
    toggleOverlayBtn.style.display = "inline-flex";
    toggleOverlayBtn.textContent = t("btn_overlay_off", "Hide Skeleton");
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
    state.avatarViewMode = "avatar";
    state.lastAngle = 0;
    if (avatarStyleWrapper) avatarStyleWrapper.style.display = "none";
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.style.display = "none";
    stopAvatarAnimation();
    resetChallenge(challengeRemainingEl);
    if (startWorkoutBtn) startWorkoutBtn.textContent = t("btn_start", "Start Workout");
    applyMirror(true);
  }
  setModelLabel(getDesiredDetectorType());
  if (state.running) {
    stopCamera();
    startCamera();
  }
  setActiveMenu(menuButtons, target);
}

function initEventListeners() {
  toggleOverlayBtn.addEventListener("click", () => {
    state.showSkeleton = !state.showSkeleton;
    toggleOverlayBtn.textContent = state.showSkeleton ? t("btn_overlay_off", "Hide Skeleton") : t("btn_overlay_on", "Show Skeleton");
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
      if (state.fullBodyDetected) {
        startCountdownAndWorkout();
        return;
      }
      state.waitingForFullBodyStart = true;
      state.workoutPausedForNoBody = false;
      state.fullBodyDetected = false;
      statusLabel.textContent = t("fullbody_wait_label", "Waiting for full body");
      statusDetail.textContent = t("status_wait_fullbody");
      if (avatarWarningEl) avatarWarningEl.style.display = "flex";
      if (startWorkoutBtn) startWorkoutBtn.textContent = t("btn_stop", "Stop Workout");
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

  if (toggleAvatarViewBtn) {
    toggleAvatarViewBtn.addEventListener("click", () => {
      if (state.currentMode !== "avatar") return;
      const next = state.avatarViewMode === "avatar" ? "camera" : "avatar";
      applyAvatarViewMode(next);
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
  initLanguage();
  initSpeechOnce();
  setTtsLanguage(getLanguage());
  setAvatarExerciseKey(state.currentKey);
  setModelLabel(getDesiredDetectorType());
  updateCurrentExerciseLabel();
  if (hudExercise) {
    hudExercise.textContent = EXERCISES[state.currentKey].name;
  }
  handleMenuChange(menuTrainingBtn);
  initEventListeners();

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      const next = getLanguage() === "ko" ? "en" : "ko";
      setLanguage(next);
      setTtsLanguage(next);
      applyStaticText();
      setModelLabel(getDesiredDetectorType());
      toggleCameraBtn.textContent = state.running ? t("btn_camera_stop", "Stop Camera") : t("btn_camera_start", "Start Camera");
    });
  }
}

window.addEventListener("DOMContentLoaded", init);
