import { KEY } from "./workout.js";

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

export function toVec2(keypoint) {
  return [keypoint.x, keypoint.y];
}

export function angleBetween(a, b, c) {
  const ab = [a[0] - b[0], a[1] - b[1]];
  const cb = [c[0] - b[0], c[1] - b[1]];
  const dot = ab[0] * cb[0] + ab[1] * cb[1];
  const magAB = Math.hypot(ab[0], ab[1]);
  const magCB = Math.hypot(cb[0], cb[1]);
  const cosine = dot / (magAB * magCB + 1e-6);
  const rad = Math.acos(Math.min(Math.max(cosine, -1), 1));
  return (rad * 180) / Math.PI;
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
  if (!showSkeleton) {
    return;
  }

  keypoints.forEach((kp) => {
    if (!kp || kp.score < 0.3) return;
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
    if (kp1.score < 0.3 || kp2.score < 0.3) return;

    const p1 = projectToCanvas(kp1, videoEl, canvasEl);
    const p2 = projectToCanvas(kp2, videoEl, canvasEl);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });
}

export function isFullBodyVisible(keypoints) {
  if (!keypoints || keypoints.length < 17) return false;
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

export async function createDetector() {
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  };
  return poseDetection.createDetector(model, detectorConfig);
}
