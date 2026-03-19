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
/* Avatar module dynamically loaded */
let avatarModule = null;

async function loadAvatarModule() {
  if (avatarModule) return avatarModule;
  try {
    avatarModule = await import("./avatar.js");
  } catch (err) {
    console.error("Failed to load avatar module", err);
  }
  return avatarModule;
}
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
const cameraPermissionBanner = document.getElementById("camera-permission-banner");
const cameraPermissionText = document.getElementById("camera-permission-text");
const cameraRetryBtn = document.getElementById("camera-retry-btn");
const cameraLoadingOverlay = document.getElementById("camera-loading-overlay");
const cameraLoadingText = document.getElementById("camera-loading-text");
const challengeRemainingEl = document.getElementById("challenge-remaining");
const challengeView = document.getElementById("challenge-view");
const summaryCloseHandler = () => hideSummaryOverlay(summaryOverlayEl);
const langToggleBtn = document.getElementById("lang-toggle");
const devDetectorEl = document.getElementById("dev-detector");
const devBackendEl = document.getElementById("dev-backend");
const devFpsEl = document.getElementById("dev-fps");
const devResEl = document.getElementById("dev-res");
const devKp2dEl = document.getElementById("dev-kp2d");
const devKp3dEl = document.getElementById("dev-kp3d");
const devModeEl = document.getElementById("dev-mode");
const devExerciseEl = document.getElementById("dev-exercise");
const devRepsEl = document.getElementById("dev-reps");
const devAngleEl = document.getElementById("dev-angle");

const trainingView = document.getElementById("training-view");
const avatarView = document.getElementById("avatar-view");
const devView = document.getElementById("dev-view");

const introOverlay = document.getElementById("intro-overlay");
const introStep1 = document.getElementById("intro-step1");
const introStep2 = document.getElementById("intro-step2");
const introNextBtn = document.getElementById("intro-next");
const introBackBtn = document.getElementById("intro-back");
const introCameraBtn = document.getElementById("intro-camera-btn");
const introCards = document.querySelectorAll(".intro-card");
const cameraBlockedModal = document.getElementById("camera-blocked-modal");
const cameraBlockedClose = document.getElementById("camera-blocked-close");

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

let preloadScheduled = false;
let introSelectedMode = null;

function applyMirror(useMirror) {
  const scale = useMirror ? "scaleX(-1)" : "scaleX(1)";
  if (videoEl) videoEl.style.transform = scale;
  if (canvasEl) canvasEl.style.transform = scale;
}

function goToIntroStep(step) {
  if (!introOverlay) return;
  const introStep0 = document.getElementById("intro-step0");
  if (introStep0) introStep0.style.display = step === 0 ? "flex" : "none";
  if (introStep1) introStep1.style.display = step === 1 ? "flex" : "none";
  if (introStep2) introStep2.style.display = step === 2 ? "flex" : "none";
  introOverlay.style.display = "flex";
}

function hideIntro() {
  if (introOverlay) introOverlay.style.display = "none";
  try {
    sessionStorage.setItem("fitform_intro_shown", "1");
  } catch (_) {
    /* ignore */
  }
}

function applyIntroSelection(mode) {
  introSelectedMode = mode;
  introCards.forEach((card) => {
    if (card.dataset.mode === mode) card.classList.add("selected");
    else card.classList.remove("selected");
  });
  if (introNextBtn) {
    introNextBtn.disabled = !mode;
    introNextBtn.style.opacity = mode ? 1 : 0.7;
  }
  if (mode === "training") handleMenuChange(menuTrainingBtn);
  else if (mode === "challenge") handleMenuChange(menuChallengeBtn);
  else if (mode === "avatar") handleMenuChange(menuAvatarBtn);
}

function updateCameraPermissionText() {
  if (cameraPermissionText) cameraPermissionText.textContent = t("cam_permission_needed", cameraPermissionText.textContent);
  if (cameraRetryBtn) cameraRetryBtn.textContent = t("btn_camera_retry", cameraRetryBtn.textContent || "Retry Camera");
}

function showCameraPermissionWarning() {
  updateCameraPermissionText();
  if (cameraPermissionBanner) {
    cameraPermissionBanner.style.display = "flex";
  }
}

function hideCameraPermissionWarning() {
  if (cameraPermissionBanner) {
    cameraPermissionBanner.style.display = "none";
  }
}

function showCameraLoading(messageKey = "loading_camera", fallback = "Preparing camera...") {
  const overlay = document.getElementById("global-loading-overlay");
  const title = document.getElementById("global-loading-title");
  const sub = document.getElementById("global-loading-subtitle");
  if (overlay && title) {
    title.textContent = t(messageKey, fallback);
    if (sub) sub.style.display = "none";
    overlay.style.display = "flex";
  }
}

function updateCameraLoading(messageKey = "loading_model", fallback = "Loading pose model...") {
  const title = document.getElementById("global-loading-title");
  if (title) title.textContent = t(messageKey, fallback);
}

function hideCameraLoading() {
  const overlay = document.getElementById("global-loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function showCameraBlockedModal() {
  if (cameraBlockedModal) cameraBlockedModal.style.display = "flex";
}

function hideCameraBlockedModal() {
  if (cameraBlockedModal) cameraBlockedModal.style.display = "none";
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

function updateDevPanel(info) {
  if (devDetectorEl) devDetectorEl.textContent = info.detector || "-";
  if (devBackendEl) devBackendEl.textContent = info.backend ? `Backend: ${info.backend}` : "Backend: -";
  if (devFpsEl) devFpsEl.textContent = info.fps != null ? info.fps.toFixed(0) : "-";
  if (devResEl) devResEl.textContent = info.resolution || "-";
  if (devKp2dEl) devKp2dEl.textContent = info.kp2d != null ? info.kp2d : "-";
  if (devKp3dEl) devKp3dEl.textContent = info.kp3d != null ? info.kp3d : "-";
  if (devModeEl) devModeEl.textContent = info.mode || "-";
  if (devExerciseEl) devExerciseEl.textContent = info.exercise || "-";
  if (devRepsEl) devRepsEl.textContent = info.reps != null ? info.reps : "-";
  if (devAngleEl) devAngleEl.textContent = info.angle != null ? Math.round(info.angle) : "-";
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

function scheduleDetectorPreload() {
  if (preloadScheduled) return;
  preloadScheduled = true;
  const handler = () => {
    setTimeout(() => {
      ensureDetectorForMode().catch((e) => console.warn("Preload detector failed", e));
    }, 0);
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
  window.addEventListener("touchstart", handler, { once: true });
}

function maybeShowIntro() {
  goToIntroStep(0);
  applyIntroSelection(introSelectedMode || "training");
  if (introOverlay) introOverlay.style.display = "flex";
}

function selectExerciseAndStart(key) {
  if (!EXERCISES[key]) return;
  setCurrentExercise(key);
  if (avatarModule) avatarModule.setAvatarExerciseKey(key);
  resetCounter();
  state.workoutStarted = false;
  state.stage = "up";

  const ex = EXERCISES[key];
  updateCurrentExerciseLabel();
  statusLabel.textContent = t("exercise_selected", "Exercise selected");
  statusDetail.textContent =
    (getStartHint(ex, getLanguage()) || t("start_hint_default", "Align your ready posture.")) +
    " " +
    t("start_hint_suffix", "Press start to begin in 5 seconds.");
  speakText(
    `${ex.name} ${t("exercise_selected_voice", "selected.")} ${getStartHint(ex, getLanguage()) || ""} ${t(
      "start_hint_suffix",
      "Press start to begin in 5 seconds."
    )}`
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
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.textContent = t("btn_view_avatar", "Avatar View");
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
    if (toggleAvatarViewBtn) toggleAvatarViewBtn.textContent = t("btn_view_camera", "Camera View");
    if (avatarWarningEl) avatarWarningEl.style.display = "flex";
    if (avatarContainer && window.__avatarInitialized) {
      if (avatarModule) avatarModule.resizeAvatarRenderer(avatarContainer);
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
      if (avatarModule) avatarModule.updateAvatarFromPose(keypoints33, keypoints3D33);
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
        label: angle == null ? t("pose_detecting_label", "Detecting pose") : ok ? t("hold_start", "Hold start position") : t("set_start", "Set start position"),
        detail: angle == null ? t("status_pose_detecting") : getStartHint(ex, getLanguage()) || t("start_hint_ready", "Face the camera and align your start posture."),
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
          ? { label: t("pose_detecting_label", "Detecting pose"), detail: t("pose_step_back", "Step back slightly so joints are clearer."), good: false }
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
        label: getLanguage() === "en" && fb.label_en ? fb.label_en : fb.label,
        detail: getLanguage() === "en" && fb.detail_en ? fb.detail_en : fb.detail,
        good: fb.good,
      });
    }
  } else {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    statusLabel.textContent = t("status_no_pose_label", "No pose");
    statusDetail.textContent = t("status_no_pose");
    statusDot.classList.remove("good", "bad");
    handleFullBodyState(null);
  }

  updateChallengeTimer(challengeRemainingEl, () => stopWorkout({ reason: "challenge_complete" }));
  updateDevPanel({
    detector: state.detectorType === DETECTOR_TYPES.BLAZEPOSE ? "BlazePose GHUM 3D" : "MoveNet Lightning",
    backend: (tf.getBackend && tf.getBackend()) || "-",
    fps: state.fps,
    resolution: `${videoEl.videoWidth || "-"}x${videoEl.videoHeight || "-"}`,
    kp2d: state.detectorType === DETECTOR_TYPES.BLAZEPOSE ? 33 : 17,
    kp3d: state.detectorType === DETECTOR_TYPES.BLAZEPOSE ? 33 : 0,
    mode: state.currentMode,
    exercise: EXERCISES[state.currentKey]?.name || "-",
    reps: state.reps,
    angle: state.lastAngle,
  });
  state.animationId = requestAnimationFrame(renderLoop);
}

async function getStreamWithFallback() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const idealWidth = isPortrait ? 480 : 1280;
  const idealHeight = isPortrait ? 640 : 720;

  const primary = { 
    video: { 
      width: { ideal: idealWidth }, 
      height: { ideal: idealHeight }, 
      facingMode: "user" 
    }, 
    audio: false 
  };
  
  const fallback = { 
    video: { 
      width: { ideal: isPortrait ? 360 : 640 }, 
      height: { ideal: isPortrait ? 480 : 480 }, 
      facingMode: "user" 
    }, 
    audio: false 
  };

  try {
    return await navigator.mediaDevices.getUserMedia(primary);
  } catch (e) {
    console.warn("Primary constraints failed, trying fallback:", e?.name || e);
    return await navigator.mediaDevices.getUserMedia(fallback);
  }
}

async function startCamera() {
  if (state.running) return;
  try {
    toggleCameraBtn.disabled = true;
    toggleCameraBtn.textContent = t("btn_camera_start", "Start Camera");
    hideCameraPermissionWarning();
    showCameraLoading("loading_camera", "Preparing camera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("getUserMedia unsupported");
    }

    const stream = await getStreamWithFallback();
    state.stream = stream;
    videoEl.srcObject = stream;
    await videoEl.play();
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    updateCameraLoading("loading_model", "Loading pose model...");
    await ensureDetectorForMode();

    if (state.currentMode === "avatar") {
      updateCameraLoading("loading_avatar", "Loading 3D Engine...");
      const mod = await loadAvatarModule();
      if (mod && !window.__avatarInitialized) {
        await mod.initAvatar(avatarContainer);
        window.__avatarInitialized = true;
      }
      if (mod && state.running) mod.startAvatarAnimation(); 
      // check state.running again in case user stopped camera during load
    }

    state.running = true;
    state.lastFrameTime = performance.now();
    toggleCameraBtn.textContent = t("btn_camera_stop", "Stop Camera");
    toggleCameraBtn.disabled = false;
    hideCameraLoading();
    hideCameraBlockedModal();
    renderLoop();
    speakText(t("camera_started", "Camera started. Stand in the center and match your posture."));
  } catch (err) {
    console.error("Camera error:", err);
    const isPermission = err?.name === "NotAllowedError" || err?.name === "SecurityError";
  const msg = isPermission
    ? t("cam_permission_needed", "Camera permission is required. Click the camera icon in your browser and allow access.")
    : t("cam_error_generic", "Camera access failed. Check browser permissions or whether another app is using the camera.");
    statusLabel.textContent = isPermission ? t("fullbody_lost_label", "Full body not detected") : "Camera error";
    statusDetail.textContent = msg;
    if (isPermission) {
      showCameraPermissionWarning();
      showCameraBlockedModal();
    }
    hideCameraLoading();
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
  hideCameraPermissionWarning();
  hideCameraLoading();
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
    statusDetail.textContent = t("challenge_time_needed_detail", "Please select a challenge duration before starting.");
    speakText(t("challenge_time_needed_voice", "Please choose a challenge duration before starting."));
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

function stopWorkout(options = {}) {
  const opts = typeof options === "boolean" ? { auto: options } : options;
  const { auto = false, reason = "manual", skipSummary = false } = opts;
  if (state.countdownTimerId) {
    clearInterval(state.countdownTimerId);
    state.countdownTimerId = null;
  }
  state.challengeActive = false;
  if (challengeRemainingEl) {
    if (reason !== "challenge_complete") {
      challengeRemainingEl.textContent = "-";
    }
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

  if (reason === "challenge_complete") {
    statusLabel.textContent = t("challenge_done_label", "Challenge finished");
    statusDetail.textContent = t("challenge_done_detail", "Time is up. Check the summary.");
  } else if (reason === "cancel_before_start") {
    statusLabel.textContent = t("cancelled_label", "Cancelled");
    statusDetail.textContent = t("cancelled_detail", "Countdown cancelled. Press start to try again.");
  } else if (auto) {
    statusLabel.textContent = t("goal_done", "Goal completed");
    statusDetail.textContent = t("summary_auto", "Completed 30 reps. Check the summary.");
  } else {
    statusLabel.textContent = t("btn_stop", "Stop Workout");
    statusDetail.textContent = t("summary_stop", "Press 'Start Workout' to begin again.");
  }

  if (skipSummary) {
    hideSummaryOverlay(summaryOverlayEl);
    return;
  }

  const summaryData = buildSummary();
  showSummaryOverlay(summaryOverlayEl, summaryData, summaryCloseHandler);
  if (state.reps > 0) {
    speakText(t("summary_voice", "You completed {reps} reps. Great job!").replace("{reps}", state.reps));
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
    if (avatarModule) avatarModule.stopAvatarAnimation();
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
    if (avatarModule) avatarModule.stopAvatarAnimation();
    if (startWorkoutBtn) startWorkoutBtn.textContent = t("btn_challenge_start", "Start Challenge");
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
    if (avatarModule) avatarModule.stopAvatarAnimation();
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

  const langCards = document.querySelectorAll(".lang-card");
  langCards.forEach((card) => {
    card.addEventListener("click", () => {
      const lang = card.dataset.lang;
      setLanguage(lang);
      setTtsLanguage(lang);
      applyStaticText();
      
      goToIntroStep(1);
    });
  });

  introCards.forEach((card) => {
    card.addEventListener("click", () => {
      applyIntroSelection(card.dataset.mode);
    });
  });

  if (introNextBtn) {
    introNextBtn.addEventListener("click", () => {
      if (!introSelectedMode) return;
      goToIntroStep(2);
    });
  }

  if (introBackBtn) {
    introBackBtn.addEventListener("click", () => goToIntroStep(1));
  }

  if (introCameraBtn) {
    introCameraBtn.addEventListener("click", async () => {
      await startCamera();
      if (state.running) hideIntro();
    });
  }

  if (cameraBlockedClose) {
    cameraBlockedClose.addEventListener("click", () => hideCameraBlockedModal());
  }

  if (cameraRetryBtn) {
    cameraRetryBtn.addEventListener("click", () => {
      hideCameraPermissionWarning();
      startCamera();
    });
  }

  resetBtn.addEventListener("click", () => {
    resetCounter();
    hudReps.textContent = "0";
    hudAngle.textContent = "0°";
    if (repOverlayEl) repOverlayEl.style.opacity = 0;
    hideSummary();
  });

  startWorkoutBtn.addEventListener("click", () => {
    if (state.countdownActive || state.waitingForFullBodyStart) {
      stopWorkout({ reason: "cancel_before_start", skipSummary: true });
      return;
    }

    if (state.workoutStarted || state.workoutPausedForNoBody) {
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
  avatarStyleSelect.addEventListener("change", async (e) => {
    const value = e.target.value;
    showCameraLoading("loading_avatar", "Loading 3D Engine...");
    const mod = await loadAvatarModule();
    if (!mod) {
      hideCameraLoading();
      return;
    }
    if (!window.__avatarInitialized) {
      await mod.initAvatar(avatarContainer);
      window.__avatarInitialized = true;
    }
    mod.loadAvatarModel(value);
    hideCameraLoading();
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
      statusLabel.textContent = t("challenge_time_set_label", "Challenge time set");
      statusDetail.textContent = t("challenge_time_set_detail", "We will measure max reps in the selected time.").replace("{mins}", mins);
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
  scheduleDetectorPreload();
  if (avatarModule) avatarModule.setAvatarExerciseKey(state.currentKey);
  setModelLabel(getDesiredDetectorType());
  updateCurrentExerciseLabel();
  if (hudExercise) {
    hudExercise.textContent = EXERCISES[state.currentKey].name;
  }
  handleMenuChange(menuTrainingBtn);
  initEventListeners();
  maybeShowIntro();

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      const next = getLanguage() === "ko" ? "en" : "ko";
      setLanguage(next);
      setTtsLanguage(next);
      applyStaticText();
      setModelLabel(getDesiredDetectorType());
      toggleCameraBtn.textContent = state.running ? t("btn_camera_stop", "Stop Camera") : t("btn_camera_start", "Start Camera");
      updateCameraPermissionText();
    });
  }
}

window.addEventListener("DOMContentLoaded", init);
