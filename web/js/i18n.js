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
  },
};

let currentLanguage = "ko";

export function setLanguage(lang) {
  if (!translations[lang]) lang = "ko";
  currentLanguage = lang;
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
  applyStaticText();
}
