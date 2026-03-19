export const KEY = {
  nose: 0,
  leftEye: 1,
  rightEye: 2,
  leftEar: 3,
  rightEar: 4,
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftWrist: 9,
  rightWrist: 10,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
};

export const KEY_BP = {
  nose: 0,
  leftEyeInner: 1,
  leftEye: 2,
  leftEyeOuter: 3,
  rightEyeInner: 4,
  rightEye: 5,
  rightEyeOuter: 6,
  leftEar: 7,
  rightEar: 8,
  mouthLeft: 9,
  mouthRight: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftPinky: 17,
  rightPinky: 18,
  leftIndex: 19,
  rightIndex: 20,
  leftThumb: 21,
  rightThumb: 22,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
};

const baseExercises = {
  right_curl: {
    name: "Right Arm Curl",
    type: "기구운동",
    typeEn: "Equipment",
    shortDesc: "오른팔로 덤벨을 들어 이두근을 집중적으로 단련합니다.",
    shortDescEn: "Right arm dumbbell curl focusing on biceps.",
    angleJoints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
    angleJointsBP: [KEY_BP.rightShoulder, KEY_BP.rightElbow, KEY_BP.rightWrist],
    thresholds: { up: 155, down: 60 },
    start: {
      hint: "오른팔을 옆으로 내려 완전히 편 상태로 덤벨을 들고 서세요.",
      hint_en: "Stand with your right arm straight down at your side holding a dumbbell.",
      check(angle) {
        return angle > 150;
      },
    },
    feedback(angle) {
      if (angle > 150) {
        return {
          label: "Ready",
          label_en: "Ready",
          detail: "팔을 완전히 편 상태에서 시작합니다.",
          detail_en: "Start with your arm fully extended.",
          good: false,
        };
      }
      if (angle < 70) {
        return {
          label: "Curl",
          label_en: "Curl",
          detail: "수축 구간입니다. 상완이 흔들리지 않게 천천히 내려가세요.",
          detail_en: "Contraction phase. Lower slowly without swaying.",
          good: true,
        };
      }
      return {
        label: "Moving",
        label_en: "Moving",
        detail: "좋아요, 일정한 속도로 올렸다 내리세요.",
        detail_en: "Good, maintain a steady pace.",
        good: true,
      };
    },
  },
  left_curl: {
    name: "Left Arm Curl",
    type: "기구운동",
    typeEn: "Equipment",
    shortDesc: "왼팔 이두근을 강화하는 단일 관절 덤벨 운동입니다.",
    shortDescEn: "Left arm dumbbell curl focusing on biceps.",
    angleJoints: [KEY.leftShoulder, KEY.leftElbow, KEY.leftWrist],
    angleJointsBP: [KEY_BP.leftShoulder, KEY_BP.leftElbow, KEY_BP.leftWrist],
    thresholds: { up: 155, down: 60 },
    start: {
      hint: "왼팔을 옆으로 내려 완전히 편 상태로 덤벨을 들고 서세요.",
      hint_en: "Stand with your left arm straight down at your side holding a dumbbell.",
      check(angle) {
        return angle > 150;
      },
    },
    feedback(angle) {
      if (angle > 150) {
        return {
          label: "Ready",
          label_en: "Ready",
          detail: "왼팔을 완전히 편 상태에서 시작합니다.",
          detail_en: "Start with your left arm fully extended.",
          good: false,
        };
      }
      if (angle < 70) {
        return {
          label: "Curl",
          label_en: "Curl",
          detail: "왼팔 수축 구간입니다. 어깨는 고정하세요.",
          detail_en: "Contraction phase. Keep your shoulder fixed.",
          good: true,
        };
      }
      return {
        label: "Moving",
        label_en: "Moving",
        detail: "좋아요, 리듬을 일정하게 유지하세요.",
        detail_en: "Good, keep a consistent rhythm.",
        good: true,
      };
    },
  },
  squat: {
    name: "Squat",
    type: "맨몸운동",
    typeEn: "Bodyweight",
    shortDesc: "하체 전반과 코어를 동시에 사용하는 대표적인 맨몸 스쿼트입니다.",
    shortDescEn: "Bodyweight squat working legs and core.",
    angleJoints: [KEY.leftHip, KEY.leftKnee, KEY.leftAnkle],
    angleJointsBP: [KEY_BP.leftHip, KEY_BP.leftKnee, KEY_BP.leftAnkle],
    thresholds: { up: 165, down: 100 },
    qualityTargets: {
      primary: [
        {
          id: "left_knee_depth",
          label: "왼쪽 무릎 각도",
          joints: [KEY.leftHip, KEY.leftKnee, KEY.leftAnkle],
          sweetSpot: [90, 110],
        },
        {
          id: "right_knee_depth",
          label: "오른쪽 무릎 각도",
          joints: [KEY.rightHip, KEY.rightKnee, KEY.rightAnkle],
          sweetSpot: [90, 110],
        },
      ],
      secondary: [
        {
          id: "torso_angle",
          label: "상체 기울기",
          joints: [KEY.leftShoulder, KEY.leftHip, KEY.leftKnee],
          sweetSpot: [165, 180],
        },
        {
          id: "hip_balance",
          label: "골반 균형",
          joints: [KEY.leftHip, KEY.rightHip, KEY.rightKnee],
          sweetSpot: [160, 185],
        },
      ],
    },
    start: {
      hint: "발을 어깨너비로 벌리고 상체를 세운 상태로 똑바로 서세요.",
      hint_en: "Stand tall with feet shoulder-width apart and chest up.",
      check(angle) {
        return angle > 165;
      },
    },
    feedback(angle) {
      if (angle > 170) {
        return {
          label: "Stand",
          label_en: "Stand",
          detail: "완전히 서 있는 상태입니다. 준비가 되면 천천히 내려가세요.",
          detail_en: "Standing upright. Go down slowly when ready.",
          good: false,
        };
      }
      if (angle < 90) {
        return {
          label: "Too Low",
          label_en: "Too Low",
          detail: "너무 낮아요. 허리/무릎 부담에 주의하세요.",
          detail_en: "Too low. Mind your back and knees.",
          good: false,
        };
      }
      if (angle >= 90 && angle <= 110) {
        return {
          label: "Good Depth",
          label_en: "Good Depth",
          detail: "좋은 깊이입니다. 가슴은 펴고 코어를 조이세요.",
          detail_en: "Good depth. Keep chest up and core tight.",
          good: true,
        };
      }
      return {
        label: "Half Squat",
        label_en: "Half Squat",
        detail: "조금 더 내려가면 좋아요.",
        detail_en: "Go a little deeper if you can.",
        good: false,
      };
    },
  },
  lunge_right: {
    name: "Right Lunge",
    type: "맨몸운동",
    typeEn: "Bodyweight",
    shortDesc: "오른발을 내딛으며 하체 균형과 근력을 기르는 런지 동작입니다.",
    shortDescEn: "Right-foot forward lunge for balance and leg strength.",
    angleJoints: [KEY.rightHip, KEY.rightKnee, KEY.rightAnkle],
    angleJointsBP: [KEY_BP.rightHip, KEY_BP.rightKnee, KEY_BP.rightAnkle],
    thresholds: { up: 165, down: 95 },
    start: {
      hint: "오른발을 앞으로 내딛고 상체를 세운 상태로 준비하세요.",
      hint_en: "Step forward with the right foot, keep torso upright, and hold the stance.",
      check(angle) {
        return angle > 165;
      },
    },
    feedback(angle) {
      if (angle > 170) {
        return {
          label: "Stand",
          label_en: "Stand",
          detail: "상체를 세우고 중심을 잡은 뒤 천천히 내려가세요.",
          detail_en: "Keep body upright, balance, and lower slowly.",
          good: false,
        };
      }
      if (angle < 85) {
        return {
          label: "Too Low",
          label_en: "Too Low",
          detail: "너무 깊습니다. 앞무릎이 발끝을 넘지 않게!",
          detail_en: "Too low. Don't let your knee cross your toes!",
          good: false,
        };
      }
      if (angle >= 90 && angle <= 110) {
        return {
          label: "Good Lunge",
          label_en: "Good Lunge",
          detail: "좋아요. 상체는 세우고 코어를 긴장하세요.",
          detail_en: "Good depth. Keep torso upright and core tight.",
          good: true,
        };
      }
      return {
        label: "Shallow",
        label_en: "Shallow",
        detail: "조금 더 내려가면 좋아요.",
        detail_en: "Go a little deeper if you can.",
        good: false,
      };
    },
  },
  lunge_left: {
    name: "Left Lunge",
    type: "맨몸운동",
    typeEn: "Bodyweight",
    shortDesc: "왼발을 내딛으며 하체 균형과 근력을 기르는 런지 동작입니다.",
    shortDescEn: "Left-foot forward lunge for balance and leg strength.",
    angleJoints: [KEY.leftHip, KEY.leftKnee, KEY.leftAnkle],
    angleJointsBP: [KEY_BP.leftHip, KEY_BP.leftKnee, KEY_BP.leftAnkle],
    thresholds: { up: 165, down: 95 },
    start: {
      hint: "왼발을 앞으로 내딛고 상체를 세운 상태로 준비하세요.",
      hint_en: "Step forward with the left foot, keep torso upright, and hold the stance.",
      check(angle) {
        return angle > 165;
      },
    },
    feedback(angle) {
      if (angle > 170) {
        return {
          label: "Stand",
          label_en: "Stand",
          detail: "상체를 세우고 중심을 잡은 뒤 천천히 내려가세요.",
          detail_en: "Keep body upright, balance, and lower slowly.",
          good: false,
        };
      }
      if (angle < 85) {
        return {
          label: "Too Low",
          label_en: "Too Low",
          detail: "너무 깊습니다. 앞무릎이 발끝을 넘지 않게!",
          detail_en: "Too low. Don't let your knee cross your toes!",
          good: false,
        };
      }
      if (angle >= 90 && angle <= 110) {
        return {
          label: "Good Lunge",
          label_en: "Good Lunge",
          detail: "좋아요. 상체는 세우고 코어를 긴장하세요.",
          detail_en: "Good depth. Keep torso upright and core tight.",
          good: true,
        };
      }
      return {
        label: "Shallow",
        label_en: "Shallow",
        detail: "조금 더 내려가면 좋아요.",
        detail_en: "Go a little deeper if you can.",
        good: false,
      };
    },
  },
  pushup: {
    name: "Push-up",
    type: "맨몸운동",
    typeEn: "Bodyweight",
    shortDesc: "가슴, 어깨, 삼두근을 동시에 사용하는 대표적인 푸시업 동작입니다.",
    shortDescEn: "Standard push-up hitting chest, shoulders, triceps.",
    angleJoints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
    angleJointsBP: [KEY_BP.rightShoulder, KEY_BP.rightElbow, KEY_BP.rightWrist],
    thresholds: { up: 165, down: 80 },
    qualityTargets: {
      primary: [
        {
          id: "right_elbow_depth",
          label: "오른쪽 팔꿈치 굽힘",
          joints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
          sweetSpot: [70, 110],
        },
        {
          id: "left_elbow_depth",
          label: "왼쪽 팔꿈치 굽힘",
          joints: [KEY.leftShoulder, KEY.leftElbow, KEY.leftWrist],
          sweetSpot: [70, 110],
        },
      ],
      secondary: [
        {
          id: "core_alignment_left",
          label: "코어 정렬(왼쪽)",
          joints: [KEY.leftShoulder, KEY.leftHip, KEY.leftAnkle],
          sweetSpot: [165, 180],
        },
        {
          id: "core_alignment_right",
          label: "코어 정렬(오른쪽)",
          joints: [KEY.rightShoulder, KEY.rightHip, KEY.rightAnkle],
          sweetSpot: [165, 180],
        },
      ],
    },
    start: {
      hint: "팔을 완전히 펴고 플랭크 자세를 유지하세요.",
      hint_en: "Hold a plank with arms extended and body straight.",
      check(angle) {
        return angle > 160;
      },
    },
    feedback(angle) {
      if (angle > 165) {
        return {
          label: "Top",
          label_en: "Top",
          detail: "팔을 과하게 잠그지 말고 살짝 굽힌 상태를 유지하세요.",
          detail_en: "Do not aggressively lock your elbows. Keep them slightly bent.",
          good: true,
        };
      }
      if (angle < 70) {
        return {
          label: "Bottom",
          label_en: "Bottom",
          detail: "가슴이 바닥 가까이 올 때까지 내려가되 허리는 꺾이지 않게!",
          detail_en: "Lower chest near the floor, but keep your back straight!",
          good: true,
        };
      }
      return {
        label: "Moving",
        label_en: "Moving",
        detail: "호흡을 유지하면서 일정한 속도로 내려갔다 올라오세요.",
        detail_en: "Maintain breathing and keep a steady pace.",
        good: true,
      };
    },
  },
  shoulder_press: {
    name: "Shoulder Press",
    type: "기구운동",
    typeEn: "Equipment",
    shortDesc: "덤벨을 위로 밀어 올리며 어깨와 상체를 강화하는 운동입니다.",
    shortDescEn: "Dumbbell shoulder press to strengthen shoulders and upper body.",
    angleJoints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
    angleJointsBP: [KEY_BP.rightShoulder, KEY_BP.rightElbow, KEY_BP.rightWrist],
    thresholds: { up: 160, down: 90 },
    qualityTargets: {
      primary: [
        {
          id: "right_press_path",
          label: "오른팔 프레스 각도",
          joints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
          sweetSpot: [100, 150],
        },
        {
          id: "left_press_path",
          label: "왼팔 프레스 각도",
          joints: [KEY.leftShoulder, KEY.leftElbow, KEY.leftWrist],
          sweetSpot: [100, 150],
        },
      ],
      secondary: [
        {
          id: "spine_alignment",
          label: "척추 정렬",
          joints: [KEY.leftHip, KEY.leftShoulder, KEY.leftElbow],
          sweetSpot: [160, 185],
        },
        {
          id: "hip_stability",
          label: "골반 안정성",
          joints: [KEY.leftHip, KEY.rightHip, KEY.rightShoulder],
          sweetSpot: [165, 185],
        },
      ],
    },
    start: {
      hint: "덤벨을 귀 옆 정도 높이로 들고, 팔꿈치가 몸 앞에 오도록 유지하세요.",
      hint_en: "Hold dumbbells near ear level, elbows slightly forward.",
      check(angle) {
        return angle >= 90 && angle <= 130;
      },
    },
    feedback(angle) {
      if (angle > 155) {
        return {
          label: "Lockout",
          label_en: "Lockout",
          detail: "팔을 완전히 잠그지 말고 살짝 굽혀 주세요.",
          detail_en: "Do not lock elbows completely. Keep them slightly bent.",
          good: false,
        };
      }
      if (angle < 90) {
        return {
          label: "Bottom",
          label_en: "Bottom",
          detail: "어깨 아래로 너무 내리지 않게 주의!",
          detail_en: "Careful not to lower past your shoulders!",
          good: false,
        };
      }
      return {
        label: "Pressing",
        label_en: "Pressing",
        detail: "천천히 위로 밀어 올리며 코어를 조이세요.",
        detail_en: "Press up slowly and tighten your core.",
        good: true,
      };
    },
  },
};

export const EXERCISES = baseExercises;

const timeNow = typeof performance !== "undefined" ? performance.now() : 0;

export const state = {
  currentKey: "right_curl",
  currentMode: "training",
  reps: 0,
  stage: "up",
  lastAngle: 0,
  fps: 0,
  lastFrameTime: timeNow,
  running: false,
  detector: null,
  detectorType: "movenet",
  animationId: null,
  stream: null,
  showSkeleton: true,
  avatarViewMode: "avatar",
  workoutStarted: false,
  startStableFrames: 0,
  downStableFrames: 0,
  upStableFrames: 0,
  countdownActive: false,
  countdownValue: 0,
  repOverlayTimer: null,
  totalFrames: 0,
  goodFrames: 0,
  isAvatarMode: false,
  challengeActive: false,
  challengeEndTime: 0,
  challengeDurationMinutes: null,
  fullBodyDetected: false,
  lastFullBodyTime: timeNow,
  workoutPausedForNoBody: false,
  waitingForFullBodyStart: false,
  countdownTimerId: null,
  fullBodyStableFrames: 0,
};

export function resetCounter(options = {}) {
  const { keepButtonLabel = false } = options;
  state.reps = 0;
  state.stage = "up";
  state.lastAngle = 0;
  state.workoutStarted = false;
  state.startStableFrames = 0;
  state.downStableFrames = 0;
  state.upStableFrames = 0;
  state.countdownActive = false;
  state.countdownValue = 0;
  state.totalFrames = 0;
  state.goodFrames = 0;
  state.challengeActive = false;
  if (!keepButtonLabel) {
    state.countdownTimerId = null;
  }
}

export function isStartReady(exercise, angle, keypoints) {
  if (angle == null || Number.isNaN(angle)) return false;
  if (exercise.start && typeof exercise.start.check === "function") {
    return exercise.start.check(angle, keypoints);
  }
  return angle > (exercise.thresholds?.up || 140) - 5;
}

export function getStartHint(exercise, lang = "ko") {
  if (lang === "en" && exercise.start?.hint_en) {
    return exercise.start.hint_en;
  }
  return exercise.start?.hint || "";
}

export function updateRepsForExercise(exercise, angle) {
  if (angle == null || Number.isNaN(angle)) return false;
  const { up, down } = exercise.thresholds;

  if (angle <= down) {
    state.downStableFrames += 1;
    state.upStableFrames = 0;
  } else if (angle >= up) {
    state.upStableFrames += 1;
    state.downStableFrames = 0;
  } else {
    state.downStableFrames = 0;
    state.upStableFrames = 0;
  }

  let repCounted = false;

  if (state.stage === "up" && state.downStableFrames >= 2) {
    state.stage = "down";
  }

  if (state.stage === "down" && state.upStableFrames >= 2) {
    state.stage = "up";
    state.reps += 1;
    repCounted = true;
  }

  return repCounted;
}

export function buildSummary() {
  const total = state.totalFrames || 0;
  const good = state.goodFrames || 0;
  const ratio = total > 0 ? good / total : 0;

  let qtKo = "분석할 데이터가 부족합니다.";
  let qtEn = "Not enough data to analyze.";
  if (total > 30) {
    const pct = Math.round(ratio * 100);
    if (ratio >= 0.7) {
      qtKo = `자세 안정도: 좋음 (좋은 자세 비율 약 ${pct}%)`;
      qtEn = `Posture Stability: Good (Approx ${pct}% good posture)`;
    } else if (ratio >= 0.4) {
      qtKo = `자세 안정도: 보통 (좋은 자세 비율 약 ${pct}%)`;
      qtEn = `Posture Stability: Fair (Approx ${pct}% good posture)`;
    } else {
      qtKo = `자세 안정도: 개선 필요 (좋은 자세 비율 약 ${pct}%)`;
      qtEn = `Posture Stability: Needs Improvement (Approx ${pct}% good posture)`;
    }
  }

  return {
    exerciseName: EXERCISES[state.currentKey]?.name || "-",
    reps: state.reps,
    qualityText: qtKo,
    qualityTextEn: qtEn,
  };
}

export function setCurrentExercise(key) {
  if (EXERCISES[key]) {
    state.currentKey = key;
  }
}

const MIN_JOINT_SCORE = 0.3;

function jointsVisible(keypoints, keypoints3D, joints) {
  return joints.every((idx) => {
    const kp3 = keypoints3D?.[idx];
    const kp2 = keypoints?.[idx];
    const score = kp3?.score ?? kp2?.score ?? 0;
    return score >= MIN_JOINT_SCORE;
  });
}

function computeAngleFromKeypoints(keypoints, keypoints3D, joints) {
  if (!Array.isArray(joints) || joints.length !== 3) return null;
  if (!jointsVisible(keypoints, keypoints3D, joints)) return null;
  const [aIdx, bIdx, cIdx] = joints;
  const a3 = keypoints3D?.[aIdx];
  const b3 = keypoints3D?.[bIdx];
  const c3 = keypoints3D?.[cIdx];
  const use3d = a3 || b3 || c3;
  const a = use3d ? a3 : keypoints[aIdx];
  const b = use3d ? b3 : keypoints[bIdx];
  const c = use3d ? c3 : keypoints[cIdx];
  if (!a || !b || !c) return null;
  const abx = (a.x ?? 0) - (b.x ?? 0);
  const aby = (a.y ?? 0) - (b.y ?? 0);
  const abz = use3d ? (a.z ?? 0) - (b.z ?? 0) : 0;
  const cbx = (c.x ?? 0) - (b.x ?? 0);
  const cby = (c.y ?? 0) - (b.y ?? 0);
  const cbz = use3d ? (c.z ?? 0) - (b.z ?? 0) : 0;
  const dot = abx * cbx + aby * cby + abz * cbz;
  const magAB = Math.hypot(abx, aby, abz);
  const magCB = Math.hypot(cbx, cby, cbz);
  if (!magAB || !magCB) return null;
  const cosine = dot / (magAB * magCB);
  const clamped = Math.min(Math.max(cosine, -1), 1);
  return (Math.acos(clamped) * 180) / Math.PI;
}

function mapTargets(targets = [], keypoints, keypoints3D) {
  return targets.map((target) => {
    const angle = computeAngleFromKeypoints(keypoints, keypoints3D, target.joints);
    return {
      ...target,
      angle,
      visible: typeof angle === "number",
    };
  });
}

export function captureQualityTargets(exerciseKey, keypoints, keypoints3D) {
  const exercise = EXERCISES[exerciseKey];
  if (!exercise || !exercise.qualityTargets) return null;
  return {
    primary: mapTargets(exercise.qualityTargets.primary || [], keypoints, keypoints3D),
    secondary: mapTargets(exercise.qualityTargets.secondary || [], keypoints, keypoints3D),
  };
}

export function summarizeQualityMetrics(metrics) {
  if (!metrics) return null;
  const summarize = (entries = []) => {
    const visibleEntries = entries.filter((entry) => entry.visible && typeof entry.angle === "number");
    const average =
      visibleEntries.length > 0
        ? visibleEntries.reduce((sum, entry) => sum + entry.angle, 0) / visibleEntries.length
        : null;
    return {
      count: entries.length,
      visible: visibleEntries.length,
      angles: visibleEntries.map((entry) => ({
        id: entry.id,
        angle: entry.angle,
        sweetSpot: entry.sweetSpot,
        label: entry.label,
      })),
      missing: entries.filter((entry) => !entry.visible).map((entry) => entry.id),
      average,
    };
  };
  return {
    primary: summarize(metrics.primary),
    secondary: summarize(metrics.secondary),
  };
}
