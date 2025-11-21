import { KEY } from "./workout.js";

export const DETECTOR_TYPES = {
  MOVENET: "movenet",
  BLAZEPOSE: "blazepose",
};

const MIN_SCORE = 0.3;

// BlazePose 33 키 인덱스 (아바타용 별도 스키마)
const BP = {
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

const SKELETON_CONNECTIONS = [
  [KEY.leftShoulder, KEY.rightShoulder],
  [KEY.leftShoulder, KEY.leftElbow],
  [KEY.leftElbow, KEY.leftWrist],
  [KEY.rightShoulder, KEY.rightElbow],
  [KEY.rightElbow, KEY.rightWrist],
  [KEY.leftShoulder, KEY.leftHip],
  [KEY.rightShoulder, KEY.rightHip],
  [KEY.leftHip, KEY.leftKnee],
  [KEY.leftKnee, KEY.leftAnkle],
  [KEY.rightHip, KEY.rightKnee],
  [KEY.rightKnee, KEY.rightAnkle],
];

const BLAZE_TO_MV = [
  BP.nose,
  BP.leftEye,
  BP.rightEye,
  BP.leftEar,
  BP.rightEar,
  BP.leftShoulder,
  BP.rightShoulder,
  BP.leftElbow,
  BP.rightElbow,
  BP.leftWrist,
  BP.rightWrist,
  BP.leftHip,
  BP.rightHip,
  BP.leftKnee,
  BP.rightKnee,
  BP.leftAnkle,
  BP.rightAnkle,
];

const MOVENET_TO_BP = [
  { src: KEY.nose, dst: BP.nose },
  { src: KEY.leftEye, dst: BP.leftEye },
  { src: KEY.rightEye, dst: BP.rightEye },
  { src: KEY.leftEar, dst: BP.leftEar },
  { src: KEY.rightEar, dst: BP.rightEar },
  { src: KEY.leftShoulder, dst: BP.leftShoulder },
  { src: KEY.rightShoulder, dst: BP.rightShoulder },
  { src: KEY.leftElbow, dst: BP.leftElbow },
  { src: KEY.rightElbow, dst: BP.rightElbow },
  { src: KEY.leftWrist, dst: BP.leftWrist },
  { src: KEY.rightWrist, dst: BP.rightWrist },
  { src: KEY.leftHip, dst: BP.leftHip },
  { src: KEY.rightHip, dst: BP.rightHip },
  { src: KEY.leftKnee, dst: BP.leftKnee },
  { src: KEY.rightKnee, dst: BP.rightKnee },
  { src: KEY.leftAnkle, dst: BP.leftAnkle },
  { src: KEY.rightAnkle, dst: BP.rightAnkle },
];

const MOVENET_DUPLICATES = [
  { from: BP.leftEye, to: [BP.leftEyeInner, BP.leftEyeOuter] },
  { from: BP.rightEye, to: [BP.rightEyeInner, BP.rightEyeOuter] },
  { from: BP.leftWrist, to: [BP.leftPinky, BP.leftIndex, BP.leftThumb] },
  { from: BP.rightWrist, to: [BP.rightPinky, BP.rightIndex, BP.rightThumb] },
  { from: BP.leftAnkle, to: [BP.leftHeel, BP.leftFootIndex] },
  { from: BP.rightAnkle, to: [BP.rightHeel, BP.rightFootIndex] },
];

function clonePoint(kp) {
  if (!kp) return null;
  const score = kp.score ?? kp.visibility ?? kp.presence ?? 0;
  return {
    x: kp.x ?? 0,
    y: kp.y ?? 0,
    z: kp.z ?? 0,
    score,
    name: kp.name,
  };
}

function emptyArray(len) {
  return new Array(len).fill(null);
}

function mapBlazePoseToArrays(pose) {
  const out17 = emptyArray(17);
  const out3d17 = emptyArray(17);
  const out33 = emptyArray(33);
  const out3d33 = emptyArray(33);
  const kp2d = pose?.keypoints || [];
  const kp3d = pose?.keypoints3D || [];
  for (let i = 0; i < 33; i++) {
    if (kp2d[i]) out33[i] = clonePoint(kp2d[i]);
    if (kp3d[i]) out3d33[i] = clonePoint(kp3d[i]);
  }
  BLAZE_TO_MV.forEach((bpIdx, mvIdx) => {
    if (kp2d[bpIdx]) out17[mvIdx] = clonePoint(kp2d[bpIdx]);
  });
  BLAZE_TO_MV.forEach((bpIdx, mvIdx) => {
    if (kp3d[bpIdx]) out3d17[mvIdx] = clonePoint(kp3d[bpIdx]);
  });
  return { keypoints: out17, keypoints33: out33, keypoints3D: out3d17, keypoints3D33: out3d33 };
}

function mapMoveNetToArrays(pose) {
  const keypoints = pose?.keypoints ? pose.keypoints.map(clonePoint) : emptyArray(17);
  const keypoints3D = emptyArray(17);
  const keypoints33 = emptyArray(33);
  MOVENET_TO_BP.forEach(({ src, dst }) => {
    const kp = pose?.keypoints?.[src];
    if (kp) keypoints33[dst] = clonePoint(kp);
  });
  MOVENET_DUPLICATES.forEach(({ from, to }) => {
    const base = keypoints33[from];
    if (!base) return;
    to.forEach((dst) => {
      if (!keypoints33[dst]) keypoints33[dst] = clonePoint(base);
    });
  });
  const keypoints3D33 = emptyArray(33);
  return { keypoints, keypoints3D, keypoints33, keypoints3D33 };
}

function projectToCanvas(kp, videoEl, canvasEl) {
  const nx = kp.x / (videoEl.videoWidth || 1);
  const ny = kp.y / (videoEl.videoHeight || 1);
  return {
    x: nx * canvasEl.width,
    y: ny * canvasEl.height,
  };
}

export function drawSkeleton({ ctx, canvasEl, videoEl, keypoints, showSkeleton }) {
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  if (!showSkeleton || !Array.isArray(keypoints)) {
    return;
  }

  keypoints.forEach((kp) => {
    if (!kp || kp.score < MIN_SCORE) return;
    const { x, y } = projectToCanvas(kp, videoEl, canvasEl);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = "#38bdf8";
    ctx.fill();
  });

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
  SKELETON_CONNECTIONS.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];
    if (!kp1 || !kp2) return;
    if (kp1.score < MIN_SCORE || kp2.score < MIN_SCORE) return;

    const p1 = projectToCanvas(kp1, videoEl, canvasEl);
    const p2 = projectToCanvas(kp2, videoEl, canvasEl);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });
}

export function isFullBodyVisible(keypoints) {
  if (!Array.isArray(keypoints) || keypoints.length < 17) return false;
  const required = [
    KEY.leftShoulder,
    KEY.rightShoulder,
    KEY.leftHip,
    KEY.rightHip,
    KEY.leftKnee,
    KEY.rightKnee,
    KEY.leftAnkle,
    KEY.rightAnkle,
  ];
  return required.every((idx) => {
    const kp = keypoints[idx];
    return kp && kp.score != null && kp.score >= 0.4;
  });
}

export async function createDetector(type = DETECTOR_TYPES.MOVENET) {
  if (type === DETECTOR_TYPES.BLAZEPOSE) {
    const model = poseDetection.SupportedModels.BlazePose;
    const detectorConfig = {
      runtime: "mediapipe",
      modelType: "lite",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404",
      enableSegmentation: false,
      smoothLandmarks: true,
    };
    return poseDetection.createDetector(model, detectorConfig);
  }

  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  };
  return poseDetection.createDetector(model, detectorConfig);
}

export function normalizeKeypoints(pose, detectorType = DETECTOR_TYPES.MOVENET) {
  if (!pose) {
    return {
      keypoints: emptyArray(17),
      keypoints3D: emptyArray(17),
      keypoints33: emptyArray(33),
      keypoints3D33: emptyArray(33),
    };
  }
  if (detectorType === DETECTOR_TYPES.BLAZEPOSE) {
    return mapBlazePoseToArrays(pose);
  }
  return mapMoveNetToArrays(pose);
}

function getPoint(keypoints, keypoints3D, idx) {
  const kp3d = keypoints3D?.[idx];
  if (kp3d && kp3d.score != null && kp3d.score >= MIN_SCORE) {
    return { x: kp3d.x ?? 0, y: kp3d.y ?? 0, z: kp3d.z ?? 0, score: kp3d.score };
  }
  const kp2d = keypoints?.[idx];
  if (kp2d && kp2d.score != null && kp2d.score >= MIN_SCORE) {
    return { x: kp2d.x ?? 0, y: kp2d.y ?? 0, z: 0, score: kp2d.score };
  }
  return null;
}

export function computeJointAngle(keypoints, keypoints3D, aIdx, bIdx, cIdx) {
  const a = getPoint(keypoints, keypoints3D, aIdx);
  const b = getPoint(keypoints, keypoints3D, bIdx);
  const c = getPoint(keypoints, keypoints3D, cIdx);
  if (!a || !b || !c) return null;
  const use3d = Boolean(
    (keypoints3D && keypoints3D[aIdx]) ||
      (keypoints3D && keypoints3D[bIdx]) ||
      (keypoints3D && keypoints3D[cIdx])
  );
  const ab = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: use3d ? a.z - b.z : 0,
  };
  const cb = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: use3d ? c.z - b.z : 0,
  };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.hypot(ab.x, ab.y, ab.z);
  const magCB = Math.hypot(cb.x, cb.y, cb.z);
  if (!magAB || !magCB) return null;
  const cosine = Math.min(Math.max(dot / (magAB * magCB), -1), 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}
