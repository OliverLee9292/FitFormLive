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

const baseExercises = {
  right_curl: {
    name: "Right Arm Curl",
    type: "기구운동",
    shortDesc: "오른팔로 덤벨을 들어 이두근을 집중적으로 단련합니다.",
    angleJoints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
    thresholds: { up: 155, down: 60 },
    start: {
      hint: "오른팔을 옆으로 내려 완전히 편 상태로 덤벨을 들고 서세요.",
      check(angle) {
        return angle > 150;
      },
    },
    feedback(angle) {
      if (angle > 150) {
        return {
          label: "Ready",
          detail: "팔을 완전히 편 상태에서 시작합니다.",
          good: false,
        };
      }
      if (angle < 70) {
        return {
          label: "Curl",
          detail: "수축 구간입니다. 상완이 흔들리지 않게 천천히 내려가세요.",
          good: true,
        };
      }
      return {
        label: "Moving",
        detail: "좋아요, 일정한 속도로 올렸다 내리세요.",
        good: true,
      };
    },
  },
  left_curl: {
    name: "Left Arm Curl",
    type: "기구운동",
    shortDesc: "왼팔 이두근을 강화하는 단일 관절 덤벨 운동입니다.",
    angleJoints: [KEY.leftShoulder, KEY.leftElbow, KEY.leftWrist],
    thresholds: { up: 155, down: 60 },
    start: {
      hint: "왼팔을 옆으로 내려 완전히 편 상태로 덤벨을 들고 서세요.",
      check(angle) {
        return angle > 150;
      },
    },
    feedback(angle) {
      if (angle > 150) {
        return {
          label: "Ready",
          detail: "왼팔을 완전히 편 상태에서 시작합니다.",
          good: false,
        };
      }
      if (angle < 70) {
        return {
          label: "Curl",
          detail: "왼팔 수축 구간입니다. 어깨는 고정하세요.",
          good: true,
        };
      }
      return {
        label: "Moving",
        detail: "좋아요, 리듬을 일정하게 유지하세요.",
        good: true,
      };
    },
  },
  squat: {
    name: "Squat",
    type: "맨몸운동",
    shortDesc: "하체 전반과 코어를 동시에 사용하는 대표적인 맨몸 스쿼트입니다.",
    angleJoints: [KEY.leftHip, KEY.leftKnee, KEY.leftAnkle],
    thresholds: { up: 165, down: 100 },
    start: {
      hint: "발을 어깨너비로 벌리고 상체를 세운 상태로 똑바로 서세요.",
      check(angle) {
        return angle > 165;
      },
    },
    feedback(angle) {
      if (angle > 170) {
        return {
          label: "Stand",
          detail: "완전히 서 있는 상태입니다. 준비가 되면 천천히 내려가세요.",
          good: false,
        };
      }
      if (angle < 90) {
        return {
          label: "Too Low",
          detail: "너무 낮아요. 허리/무릎 부담에 주의하세요.",
          good: false,
        };
      }
      if (angle >= 90 && angle <= 110) {
        return {
          label: "Good Depth",
          detail: "좋은 깊이입니다. 가슴은 펴고 코어를 조이세요.",
          good: true,
        };
      }
      return {
        label: "Half Squat",
        detail: "조금 더 내려가면 좋아요.",
        good: false,
      };
    },
  },
  lunge_right: {
    name: "Right Lunge",
    type: "맨몸운동",
    shortDesc: "오른발을 내딛으며 하체 균형과 근력을 기르는 런지 동작입니다.",
    angleJoints: [KEY.rightHip, KEY.rightKnee, KEY.rightAnkle],
    thresholds: { up: 165, down: 95 },
    start: {
      hint: "오른발을 앞으로 내딛고 상체를 세운 상태로 준비하세요.",
      check(angle) {
        return angle > 165;
      },
    },
    feedback(angle) {
      if (angle > 170) {
        return {
          label: "Stand",
          detail: "상체를 세우고 중심을 잡은 뒤 천천히 내려가세요.",
          good: false,
        };
      }
      if (angle < 85) {
        return {
          label: "Too Low",
          detail: "너무 깊습니다. 앞무릎이 발끝을 넘지 않게!",
          good: false,
        };
      }
      if (angle >= 90 && angle <= 110) {
        return {
          label: "Good Lunge",
          detail: "좋아요. 상체는 세우고 코어를 긴장하세요.",
          good: true,
        };
      }
      return {
        label: "Shallow",
        detail: "조금 더 내려가면 좋아요.",
        good: false,
      };
    },
  },
  lunge_left: {
    name: "Left Lunge",
    type: "맨몸운동",
    shortDesc: "왼발을 내딛으며 하체 균형과 근력을 기르는 런지 동작입니다.",
    angleJoints: [KEY.leftHip, KEY.leftKnee, KEY.leftAnkle],
    thresholds: { up: 165, down: 95 },
    start: {
      hint: "왼발을 앞으로 내딛고 상체를 세운 상태로 준비하세요.",
      check(angle) {
        return angle > 165;
      },
    },
    feedback(angle) {
      if (angle > 170) {
        return {
          label: "Stand",
          detail: "상체를 세우고 중심을 잡은 뒤 천천히 내려가세요.",
          good: false,
        };
      }
      if (angle < 85) {
        return {
          label: "Too Low",
          detail: "너무 깊습니다. 앞무릎이 발끝을 넘지 않게!",
          good: false,
        };
      }
      if (angle >= 90 && angle <= 110) {
        return {
          label: "Good Lunge",
          detail: "좋아요. 상체는 세우고 코어를 긴장하세요.",
          good: true,
        };
      }
      return {
        label: "Shallow",
        detail: "조금 더 내려가면 좋아요.",
        good: false,
      };
    },
  },
  pushup: {
    name: "Push-up",
    type: "맨몸운동",
    shortDesc: "가슴, 어깨, 삼두근을 동시에 사용하는 대표적인 푸시업 동작입니다.",
    angleJoints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
    thresholds: { up: 165, down: 80 },
    start: {
      hint: "팔을 완전히 펴고 플랭크 자세를 유지하세요.",
      check(angle) {
        return angle > 160;
      },
    },
    feedback(angle) {
      if (angle > 165) {
        return {
          label: "Top",
          detail: "팔을 과하게 잠그지 말고 살짝 굽힌 상태를 유지하세요.",
          good: true,
        };
      }
      if (angle < 70) {
        return {
          label: "Bottom",
          detail: "가슴이 바닥 가까이 올 때까지 내려가되 허리는 꺾이지 않게!",
          good: true,
        };
      }
      return {
        label: "Moving",
        detail: "호흡을 유지하면서 일정한 속도로 내려갔다 올라오세요.",
        good: true,
      };
    },
  },
  shoulder_press: {
    name: "Shoulder Press",
    type: "기구운동",
    shortDesc: "덤벨을 위로 밀어 올리며 어깨와 상체를 강화하는 운동입니다.",
    angleJoints: [KEY.rightShoulder, KEY.rightElbow, KEY.rightWrist],
    thresholds: { up: 160, down: 90 },
    start: {
      hint: "덤벨을 귀 옆 정도 높이로 들고, 팔꿈치가 몸 앞에 오도록 유지하세요.",
      check(angle) {
        return angle >= 90 && angle <= 130;
      },
    },
    feedback(angle) {
      if (angle > 155) {
        return {
          label: "Lockout",
          detail: "팔을 완전히 잠그지 말고 살짝 굽혀 주세요.",
          good: false,
        };
      }
      if (angle < 90) {
        return {
          label: "Bottom",
          detail: "어깨 아래로 너무 내리지 않게 주의!",
          good: false,
        };
      }
      return {
        label: "Pressing",
        detail: "천천히 위로 밀어 올리며 코어를 조이세요.",
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
  animationId: null,
  stream: null,
  showSkeleton: true,
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
  if (exercise.start && typeof exercise.start.check === "function") {
    return exercise.start.check(angle, keypoints);
  }
  return angle > (exercise.thresholds?.up || 140) - 5;
}

export function updateRepsForExercise(exercise, angle) {
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

  let qualityText = "분석할 데이터가 부족합니다.";
  if (total > 30) {
    if (ratio >= 0.7) {
      qualityText = `자세 안정도: 좋음 (좋은 자세 비율 약 ${Math.round(ratio * 100)}%)`;
    } else if (ratio >= 0.4) {
      qualityText = `자세 안정도: 보통 (좋은 자세 비율 약 ${Math.round(ratio * 100)}%)`;
    } else {
      qualityText = `자세 안정도: 개선 필요 (좋은 자세 비율 약 ${Math.round(ratio * 100)}%)`;
    }
  }

  return {
    exerciseName: EXERCISES[state.currentKey]?.name || "-",
    reps: state.reps,
    qualityText,
  };
}

export function setCurrentExercise(key) {
  if (EXERCISES[key]) {
    state.currentKey = key;
  }
}
