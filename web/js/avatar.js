import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const AVATAR_MODELS = {
  basic: "models/basic.glb",
  cute: "models/cute.glb",
};

// BlazePose 33 포인트 인덱스
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

const BONE_MAPPINGS = [
  { bone: "mixamorigRightArm", from: BP.rightShoulder, to: BP.rightElbow },
  { bone: "mixamorigRightForeArm", from: BP.rightElbow, to: BP.rightWrist },
  { bone: "mixamorigLeftArm", from: BP.leftShoulder, to: BP.leftElbow },
  { bone: "mixamorigLeftForeArm", from: BP.leftElbow, to: BP.leftWrist },
  { bone: "mixamorigRightUpLeg", from: BP.rightHip, to: BP.rightKnee },
  { bone: "mixamorigRightLeg", from: BP.rightKnee, to: BP.rightAnkle },
  { bone: "mixamorigLeftUpLeg", from: BP.leftHip, to: BP.leftKnee },
  { bone: "mixamorigLeftLeg", from: BP.leftKnee, to: BP.leftAnkle },
  { bone: "mixamorigSpine2", from: "midHip", to: "midShoulder" },
];

const FALLBACK_REST_AXES = {
  rightarm: new THREE.Vector3(1, 0, 0),
  rightforearm: new THREE.Vector3(1, 0, 0),
  leftarm: new THREE.Vector3(-1, 0, 0),
  leftforearm: new THREE.Vector3(-1, 0, 0),
  rightupleg: new THREE.Vector3(0, -1, 0),
  rightleg: new THREE.Vector3(0, -1, 0),
  leftupleg: new THREE.Vector3(0, -1, 0),
  leftleg: new THREE.Vector3(0, -1, 0),
  spine2: new THREE.Vector3(0, 1, 0),
  neck: new THREE.Vector3(0, 1, 0),
  head: new THREE.Vector3(0, 1, 0),
};

const BONE_SMOOTH = 0.35;
const TARGET_HEIGHT = 1.55;

let scene = null;
let camera = null;
let renderer = null;
let model = null;
let animationId = null;
let loadToken = 0;
let boneMap = {};
let boneRestQuat = {};
let boneRestDir = {};

function normalizeBoneName(name) {
  return (name || "").toLowerCase().replace(/mixamorig|armature|_| |\./g, "");
}

function cacheRestData(root) {
  boneMap = {};
  boneRestQuat = {};
  boneRestDir = {};
  root.traverse((obj) => {
    if (!obj.isBone) return;
    const norm = normalizeBoneName(obj.name);
    boneMap[norm] = obj;
    boneRestQuat[norm] = obj.quaternion.clone();
    const dir = firstChildDir(obj);
    if (dir) boneRestDir[norm] = dir;
  });
}

function firstChildDir(bone) {
  const origin = new THREE.Vector3();
  const childPos = new THREE.Vector3();
  bone.getWorldPosition(origin);
  for (const child of bone.children) {
    if (!child.isBone) continue;
    child.getWorldPosition(childPos);
    const dir = childPos.clone().sub(origin);
    if (dir.lengthSq() > 1e-6) return dir.normalize();
  }
  return null;
}

function findBone(name) {
  const norm = normalizeBoneName(name);
  return boneMap[norm] || null;
}

function getRestAxis(norm) {
  if (boneRestDir[norm]) return boneRestDir[norm].clone();
  if (FALLBACK_REST_AXES[norm]) return FALLBACK_REST_AXES[norm].clone();
  return new THREE.Vector3(0, 1, 0);
}

function rotateBoneTowards(boneName, targetDir) {
  if (!targetDir) return;
  const bone = findBone(boneName);
  if (!bone) return;
  const norm = normalizeBoneName(boneName);
  const restQuat = (boneRestQuat[norm] || bone.quaternion).clone();
  const restAxis = getRestAxis(norm);
  if (restAxis.lengthSq() < 1e-6) return;

  const from = restAxis.clone().normalize();
  const to = new THREE.Vector3(targetDir.x, targetDir.y, targetDir.z ?? 0).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(from, to);
  const targetQuat = restQuat.clone().multiply(delta);
  if (BONE_SMOOTH >= 1) {
    bone.quaternion.copy(targetQuat);
  } else {
    bone.quaternion.slerp(targetQuat, BONE_SMOOTH);
  }
}

function safeScore(kp) {
  return kp?.score ?? kp?.visibility ?? kp?.presence ?? 0;
}

function getPoint(keypoints, idx) {
  const kp = keypoints?.[idx];
  if (!kp || safeScore(kp) < 0.2) return null;
  return {
    x: kp.x ?? 0,
    y: -(kp.y ?? 0), // 화면 좌표를 월드 y축으로 뒤집음
    z: kp.z ?? 0,
  };
}

function midpoint(a, b) {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

function direction(from, to) {
  if (!from || !to) return null;
  const v = new THREE.Vector3(to.x - from.x, to.y - from.y, to.z - from.z);
  if (v.lengthSq() < 1e-6) return null;
  v.normalize();
  return { x: v.x, y: v.y, z: v.z };
}

function retargetBones(keypoints) {
  const midHip = midpoint(getPoint(keypoints, BP.leftHip), getPoint(keypoints, BP.rightHip));
  const midShoulder = midpoint(getPoint(keypoints, BP.leftShoulder), getPoint(keypoints, BP.rightShoulder));

  BONE_MAPPINGS.forEach((m) => {
    let dir = null;
    if (m.from === "midHip" || m.to === "midShoulder") {
      if (midHip && midShoulder) dir = direction(midHip, midShoulder);
    } else if (m.from === "midHip") {
      const target = getPoint(keypoints, m.to);
      if (midHip && target) dir = direction(midHip, target);
    } else if (m.to === "midShoulder") {
      const source = getPoint(keypoints, m.from);
      if (source && midShoulder) dir = direction(source, midShoulder);
    } else {
      const a = getPoint(keypoints, m.from);
      const b = getPoint(keypoints, m.to);
      dir = direction(a, b);
    }
    if (dir) rotateBoneTowards(m.bone, dir);
  });
}

export function initAvatar(container) {
  if (!container || renderer) return Promise.resolve();
  scene = new THREE.Scene();
  const aspect = container.clientWidth / container.clientHeight || 1;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
  camera.position.set(0, 150, 500);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.domElement.style.transform = "scaleX(-1)"; // 거울 모드
  renderer.domElement.style.transformOrigin = "center";
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(1, 1.5, 1);
  scene.add(ambient, dir);

  return loadAvatarModel("basic");
}

export function resizeAvatarRenderer(container) {
  if (!renderer || !camera || !container) return;
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
}

export function startAvatarAnimation() {
  if (!renderer || animationId) return;
  const renderLoop = () => {
    animationId = requestAnimationFrame(renderLoop);
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };
  renderLoop();
}

export function stopAvatarAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

export function loadAvatarModel(name) {
  return new Promise((resolve, reject) => {
    const url = AVATAR_MODELS[name] || AVATAR_MODELS.basic;
    if (!url) {
      resolve();
      return;
    }
    const loader = new GLTFLoader();
    const token = ++loadToken;

    loader.load(
      url,
      (gltf) => {
        if (token !== loadToken) {
          resolve();
          return;
        }
        if (model && scene) {
          scene.remove(model);
        }
        model = gltf.scene || gltf.scenes?.[0];
        if (!model) {
          resolve();
          return;
        }

        // 중앙 정렬 및 스케일
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const height = size.y || 1;
        const scale = TARGET_HEIGHT / height;
        model.scale.setScalar(scale);
        // align pelvis (약 35% 지점) to world origin then push it further downward
        const pelvisApprox = (box.min.y + height * 0.35) * scale;
        model.position.y -= pelvisApprox;
        model.position.y -= size.y * scale * 5.25; // push further downward (50% more)

        scene.add(model);
        model.updateMatrixWorld(true);
        cacheRestData(model);

        // 카메라 프레이밍
        const newBox = new THREE.Box3().setFromObject(model);
        const newSize = newBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(newSize.x, newSize.y);
        const fovRad = (camera.fov * Math.PI) / 180;
        let distance = (maxDim / 2) / Math.tan(fovRad / 2) + newSize.z * 1.2;
        distance *= 3.0;
        const targetY = -newSize.y * 2.25; // move camera target further below
        camera.position.set(0, targetY + newSize.y * 0.25, distance);
        camera.lookAt(0, targetY, 0);
        
        resolve();
      },
      undefined,
      (err) => {
        console.error("Avatar load failed", err);
        resolve(); // resolve anyway so we don't break the promise chain
      }
    );
  });
}

export function setAvatarExerciseKey() {
  // no-op in simplified version
}

export function updateAvatarFromPose(keypoints33, keypoints3D33) {
  if (!model || !Array.isArray(keypoints3D33) || keypoints3D33.length < 33) return;
  const merged = keypoints3D33.map((kp) =>
    kp && safeScore(kp) >= 0.2 ? { x: kp.x, y: kp.y, z: kp.z, score: safeScore(kp) } : null
  );
  retargetBones(merged);
}
