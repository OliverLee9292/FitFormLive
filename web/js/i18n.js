const translations = {
  ko: {
    header_title: "FIT FORM LIVE - 헬린이를 위한 AI PT",
    subtitle: "Microsoft AI School 8기 1차 프로젝트 (2025.11.11 ~ 11.20) 이후 현재는 단독으로 개발/운영 중입니다.",
    menu_training: "트레이닝 모드",
    menu_avatar: "아바타 모드",
    menu_challenge: "도전 모드",
    menu_dev: "개발자 도구",
    btn_camera_start: "카메라 시작",
    btn_camera_stop: "카메라 정지",
    btn_overlay_on: "포즈선 켜기",
    btn_overlay_off: "포즈선 끄기",
    btn_start: "운동 시작",
    btn_stop: "운동 정지",
    cancelled_label: "취소됨",
    cancelled_detail: "카운트다운을 취소했습니다. 다시 시작하려면 버튼을 눌러주세요.",
    btn_challenge_start: "도전 시작",
    btn_challenge_stop: "도전 중지",
    btn_reset: "카운트 초기화",
    btn_select_exercise: "수행 동작 선택",
    warning_fullbody: "전신이 화면에 모두 들어오도록\n카메라와 충분한 거리를 두어주세요.",
    status_no_pose: "사람이 화면 안에 있도록 위치를 조정하세요.",
    status_no_pose_label: "사람 인식 안 됨",
    status_wait_fullbody: "카메라와 충분한 거리를 두어 전신이 모두 보이게 서주세요.",
    status_pose_detecting: "관절 포인트를 인식 중입니다. 전신이 보이도록 한 걸음 물러서 주세요.",
    challenge_done_label: "도전 종료",
    challenge_done_detail: "설정한 시간이 끝났습니다. 요약을 확인하세요.",
    countdown_label: "시작 준비",
    countdown_detail: "5초 후에 시작합니다.",
    start_message: "시작합니다.",
    cam_permission_needed: "카메라 권한을 허용해야 합니다. 브라우저 주소창의 카메라 아이콘을 눌러 허용으로 변경하세요.",
    btn_camera_retry: "카메라 재시도",
    loading_camera: "카메라 준비 중...",
    loading_model: "포즈 모델을 불러오는 중입니다...",
    loading_wait: "모델을 불러오고 있습니다. 잠시만 기다려 주세요.",
    summary_auto: "30회를 완료했습니다. 요약을 확인하세요.",
    summary_stop: "다시 시작하려면 '운동 시작'을 누르세요.",
    lang_toggle: "EN",
    model_movenet: "MoveNet Lightning · On-device",
    model_blazepose: "BlazePose GHUM 3D · On-device",
    pose_detecting_label: "포즈 인식 중",
    fullbody_wait_label: "전신 인식 대기",
    fullbody_lost_label: "전신 인식 안 됨",
    camera_started: "카메라가 시작되었습니다. 화면 중앙에 서서 자세를 맞춰 주세요.",
    challenge_time_needed: "시간 선택 필요",
    start_hint_suffix: "운동 시작 버튼을 누르면 5초 후에 시작합니다.",
    current_ex_label: "현재 수행 동작:",
    status_prefix: "상태:",
    picker_title: "운동 동작 선택",
    picker_close: "닫기",
    picker_start_btn: "이 동작으로 시작",
    picker_type_default: "운동",
    picker_desc_default: "이 동작을 선택해 자세를 인식합니다.",
    summary_title: "운동 요약",
    summary_total: "총 횟수",
    summary_hint: "다시 시작하려면 화면을 클릭하거나 아래 버튼을 누르세요.",
    exercise_selected: "동작 선택됨",
    exercise_selected_voice: "선택.",
    start_hint_default: "준비자세를 맞춰 주세요.",
    start_hint_ready: "정면을 보고 화면 중앙에 서세요.",
    hold_start: "시작 자세 유지",
    set_start: "시작 자세를 맞춰 주세요",
    pose_step_back: "관절을 더 명확히 보기 위해 한 걸음 물러서 주세요.",
    cam_error_generic: "카메라 접근 중 오류가 발생했습니다. 브라우저 권한 또는 다른 앱 사용 여부를 확인하세요.",
    challenge_time_needed_detail: "도전 모드에서는 먼저 도전 시간을 선택해 주세요.",
    challenge_time_needed_voice: "도전 시간을 먼저 선택해 주세요.",
    challenge_time_set_label: "도전 시간 선택됨",
    challenge_time_set_detail: "{mins}분 동안 수행 가능한 횟수를 측정합니다.",
    summary_voice: "총 {reps}회 수행했습니다. 수고하셨습니다.",
    btn_view_avatar: "아바타 보기",
    btn_view_camera: "카메라 보기",
    camera_blocked_title: "카메라가 차단되어 있습니다",
    camera_blocked_body:
      "Safari(아이폰/맥): 설정 → Safari → 카메라 → 허용으로 변경하거나, 주소창의 카메라 아이콘에서 허용으로 변경하세요. 시스템 카메라가 비활성화된 경우 설정 → 개인정보 보호 → 카메라에서 Safari 권한을 켜주세요.",
    camera_blocked_close: "닫기",
    intro_title: "시작할 모드를 선택하세요",
    intro_subtitle: "방문해 주셔서 감사합니다! 함께 운동 여정을 만들어가요.",
    intro_training_title: "트레이닝 모드",
    intro_training_desc: "MoveNet으로 빠르게 자세를 잡고 반복 횟수를 측정합니다.",
    intro_challenge_title: "도전 모드",
    intro_challenge_desc: "타이머를 켜고 최대 반복 횟수를 기록합니다.",
    intro_avatar_title: "아바타 모드",
    intro_avatar_desc: "BlazePose 3D로 전신을 인식하고 아바타로 미러링합니다.",
    intro_next: "다음",
    intro_camera_title: "카메라 접근 허용이 필요합니다",
    intro_camera_desc: "정확한 자세 인식을 위해 카메라 접근을 허용해야 합니다. 브라우저 주소창의 카메라 아이콘에서 허용으로 변경해 주세요.",
    intro_camera_btn: "카메라 시작",
    intro_back: "이전",
  },
  en: {
    header_title: "FIT FORM LIVE - AI PT for Beginners",
    subtitle: "Microsoft AI School 8th Cohort, 1st Project Team 7 (2025.11.11 ~ 11.20); currently developed and maintained solo.",
    menu_training: "Training Mode",
    menu_avatar: "Avatar Mode",
    menu_challenge: "Challenge Mode",
    menu_dev: "Developer Tools",
    btn_camera_start: "Start Camera",
    btn_camera_stop: "Stop Camera",
    btn_overlay_on: "Show Skeleton",
    btn_overlay_off: "Hide Skeleton",
    btn_start: "Start Workout",
    btn_stop: "Stop Workout",
    cancelled_label: "Cancelled",
    cancelled_detail: "Countdown cancelled. Press start to try again.",
    btn_challenge_start: "Start Challenge",
    btn_challenge_stop: "Stop Challenge",
    btn_reset: "Reset Count",
    btn_select_exercise: "Choose Exercise",
    warning_fullbody: "Keep your full body in view.\nStep back from the camera.",
    status_no_pose: "Adjust so you are inside the frame.",
    status_no_pose_label: "No pose detected",
    status_wait_fullbody: "Step back so your full body is visible.",
    status_pose_detecting: "Detecting pose. Step back so your full body is visible.",
    challenge_done_label: "Challenge finished",
    challenge_done_detail: "Time is up. Check the summary.",
    countdown_label: "Get Ready",
    countdown_detail: "Starting in 5 seconds.",
    start_message: "Starting now.",
    cam_permission_needed: "Camera permission is required. Click the camera icon in your browser and allow access.",
    btn_camera_retry: "Retry Camera",
    loading_camera: "Preparing camera...",
    loading_model: "Loading pose model...",
    loading_wait: "Loading models. This can take a few seconds on first start.",
    summary_auto: "Completed 30 reps. Check the summary.",
    summary_stop: "Press 'Start Workout' to begin again.",
    lang_toggle: "KO",
    model_movenet: "MoveNet Lightning · On-device",
    model_blazepose: "BlazePose GHUM 3D · On-device",
    pose_detecting_label: "Detecting pose",
    fullbody_wait_label: "Waiting for full body",
    fullbody_lost_label: "Full body not detected",
    camera_started: "Camera started. Stand in the center and match your posture.",
    challenge_time_needed: "Select a challenge duration first",
    start_hint_suffix: "Press start to begin in 5 seconds.",
    current_ex_label: "Current Exercise:",
    status_prefix: "Status:",
    picker_title: "Choose Exercise",
    picker_close: "Close",
    picker_start_btn: "Start with this",
    picker_type_default: "Exercise",
    picker_desc_default: "Select to start pose tracking.",
    summary_title: "Workout Summary",
    summary_total: "Total reps",
    summary_hint: "Click the screen or press the button below to restart.",
    exercise_selected: "Exercise selected",
    exercise_selected_voice: "selected.",
    start_hint_default: "Align your ready posture.",
    start_hint_ready: "Face forward and stand centered in frame.",
    hold_start: "Hold start position",
    set_start: "Set start position",
    pose_step_back: "Step back slightly so joints are clearer.",
    cam_error_generic: "Camera access failed. Check browser permissions or whether another app is using the camera.",
    challenge_time_needed_detail: "Please select a challenge duration before starting.",
    challenge_time_needed_voice: "Please choose a challenge duration before starting.",
    challenge_time_set_label: "Challenge time set",
    challenge_time_set_detail: "We will measure max reps in {mins} minutes.",
    summary_voice: "You completed {reps} reps. Great job!",
    btn_view_avatar: "Avatar View",
    btn_view_camera: "Camera View",
    camera_blocked_title: "Camera is blocked",
    camera_blocked_body:
      "If Safari or system settings block the camera, enable it in Settings → Safari → Camera (Allow), or click the camera icon in the address bar. On macOS/iOS, also check System/Privacy camera permissions.",
    camera_blocked_close: "Close",
    intro_title: "Choose your mode to start",
    intro_subtitle: "Thanks for visiting! We’re excited to build your training journey together.",
    intro_training_title: "Training Mode",
    intro_training_desc: "Use MoveNet for fast posture cues and rep counting.",
    intro_challenge_title: "Challenge Mode",
    intro_challenge_desc: "Run a timer and record your max reps.",
    intro_avatar_title: "Avatar Mode",
    intro_avatar_desc: "Use BlazePose 3D for full-body tracking and mirroring.",
    intro_next: "Next",
    intro_camera_title: "Camera access is required",
    intro_camera_desc: "Allow camera access for accurate posture tracking. Use your browser's camera icon to enable it.",
    intro_camera_btn: "Start Camera",
    intro_back: "Back",
  },
};

let currentLanguage = "en";

export function setLanguage(lang) {
  if (!translations[lang]) lang = "ko";
  currentLanguage = lang;
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
  applyStaticText();
  try {
    localStorage.setItem("fitform_lang", lang);
  } catch (_) {
    /* ignore */
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, fallback = "") {
  return translations[currentLanguage]?.[key] ?? fallback ?? key;
}

export function applyStaticText() {
  const map = {
    "header-title": "header_title",
    "subtitle-text": "subtitle",
    "menu-training": "menu_training",
    "menu-avatar": "menu_avatar",
    "menu-challenge": "menu_challenge",
    "menu-dev": "menu_dev",
    "toggle-camera": "btn_camera_start",
    "toggle-overlay": "btn_overlay_off",
    "start-workout-btn": "btn_start",
    "reset-btn": "btn_reset",
    "open-exercise-picker": "btn_select_exercise",
    "avatar-warning": "warning_fullbody",
    "lang-toggle": "lang_toggle",
    "current-ex-label": "current_ex_label",
    "status-label-prefix": "status_prefix",
    "camera-permission-text": "cam_permission_needed",
    "camera-retry-btn": "btn_camera_retry",
    "camera-loading-text": "loading_camera",
    "camera-loading-sub": "loading_wait",
    "intro-title": "intro_title",
    "intro-subtitle": "intro_subtitle",
    "intro-card-training-title": "intro_training_title",
    "intro-card-training-desc": "intro_training_desc",
    "intro-card-challenge-title": "intro_challenge_title",
    "intro-card-challenge-desc": "intro_challenge_desc",
    "intro-card-avatar-title": "intro_avatar_title",
    "intro-card-avatar-desc": "intro_avatar_desc",
    "intro-next": "intro_next",
    "intro-camera-title": "intro_camera_title",
    "intro-camera-desc": "intro_camera_desc",
    "intro-camera-btn": "intro_camera_btn",
    "intro-back": "intro_back",
    "camera-blocked-title": "camera_blocked_title",
    "camera-blocked-body": "camera_blocked_body",
    "camera-blocked-close": "camera_blocked_close",
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerText = t(key, el.innerText);
    }
  });
}

export function initLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem("fitform_lang");
  } catch (_) {
    /* ignore */
  }
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = currentLanguage;
  }
  applyStaticText();
}
