import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KEY } from "./workout.js";

export const AVATAR_MODELS = {
  basic: "models/basic.glb",
  cute: "models/cute.glb",
};

let avatarScene = null;
let avatarCamera = null;
let avatarRenderer = null;
let avatarModel = null;
let avatarBoneMap = {};
let avatarAnimationId = null;
let avatarLoadToken = 0;
let avatarBoneRestQuats = {};
let avatarBoneRestDirs = {};
let avatarBoneTargetQuats = {};

const LOCK_HEAD_FORWARD = true;
const BONE_SMOOTH_FACTOR = 0.2; // 0..1, higher is faster

const DEFAULT_DIRECTIONS = {
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

export function initAvatar(container) {
  if (!container || avatarRenderer) return;

  avatarScene = new THREE.Scene();
  const aspect = container.clientWidth / container.clientHeight || 1;
  avatarCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  avatarCamera.position.z = 800;
  avatarCamera.position.y = 500;

  avatarRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  avatarRenderer.setSize(container.clientWidth, container.clientHeight);
  avatarRenderer.setPixelRatio(window.devicePixelRatio || 1);
  container.appendChild(avatarRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  avatarScene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  avatarScene.add(directionalLight);

  loadAvatarModel("basic");
}

export function startAvatarAnimation() {
  if (!avatarRenderer || avatarAnimationId) return;
  const animate = () => {
    avatarAnimationId = requestAnimationFrame(animate);
    if (avatarRenderer && avatarScene && avatarCamera) {
      avatarRenderer.render(avatarScene, avatarCamera);
    }
  };
  animate();
}

export function stopAvatarAnimation() {
  if (avatarAnimationId) {
    cancelAnimationFrame(avatarAnimationId);
    avatarAnimationId = null;
  }
}

export function resizeAvatarRenderer(container) {
  if (!avatarRenderer || !avatarCamera || !container) return;
  avatarRenderer.setSize(container.clientWidth, container.clientHeight);
  avatarCamera.aspect = container.clientWidth / container.clientHeight;
  avatarCamera.updateProjectionMatrix();
}

export function loadAvatarModel(name) {
  const url = AVATAR_MODELS[name] || AVATAR_MODELS.basic;
  if (!url) return;

  const loader = new GLTFLoader();
  const requestId = ++avatarLoadToken;

  if (avatarModel && avatarScene) {
    avatarScene.remove(avatarModel);
  }
  avatarModel = null;
  avatarBoneMap = {};
  avatarBoneRestQuats = {};
  avatarBoneRestDirs = {};
  avatarBoneTargetQuats = {};

  loader.load(
    url,
    (gltf) => {
      if (requestId !== avatarLoadToken) {
        return;
      }
      avatarModel = gltf.scene;

      const box = new THREE.Box3().setFromObject(avatarModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      avatarModel.position.x -= center.x;
      avatarModel.position.z -= center.z;
      avatarModel.position.y -= box.min.y;

      const desiredHeight = 1.7;
      const scale = desiredHeight / (size.y || 1);
      if (isFinite(scale) && scale > 0) {
        avatarModel.scale.set(scale, scale, scale);
      }

      avatarScene.add(avatarModel);
      avatarModel.updateMatrixWorld(true);
      cacheBoneData(avatarModel);

      if (avatarCamera) {
        const newBox = new THREE.Box3().setFromObject(avatarModel);
        const newSize = newBox.getSize(new THREE.Vector3());
        const newCenter = newBox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(newSize.y, newSize.x);
        const fovRad = (avatarCamera.fov * Math.PI) / 180;
        let distance = (maxDim / 2) / Math.tan(fovRad / 2);
        distance *= 10;
        const targetY = newCenter.y + newSize.y * 0.05;
        avatarCamera.position.set(
          newCenter.x,
          targetY + newSize.y * 2,
          distance
        );
        avatarCamera.lookAt(newCenter.x, targetY + newSize.y * 2, newCenter.z);
      }
    },
    undefined,
    (error) => {
      console.error("Avatar GLB 로딩 실패:", error);
    }
  );
}

function isConfident(kp) {
  return kp && kp.score >= 0.3;
}

function normalizeBoneName(name) {
  return (name || "")
    .toLowerCase()
    .replace(/mixamorig|armature|_| |\./g, "");
}

function getDefaultDirection(normName) {
  const vec = DEFAULT_DIRECTIONS[normName];
  return vec ? vec.clone() : new THREE.Vector3(0, 1, 0);
}

function cacheBoneData(root) {
  if (!root) return;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!obj.isBone) return;
    const norm = normalizeBoneName(obj.name);
    if (!norm) return;
    avatarBoneMap[norm] = obj;
    avatarBoneRestQuats[norm] = obj.quaternion.clone();
    const restDir = computeRestDirection(obj, norm);
    avatarBoneRestDirs[norm] = restDir;
  });
}

function computeRestDirection(bone, normName) {
  const origin = new THREE.Vector3();
  const childPos = new THREE.Vector3();
  bone.getWorldPosition(origin);
  for (const child of bone.children) {
    if (!child.isBone) continue;
    child.getWorldPosition(childPos);
    const dir = childPos.clone().sub(origin);
    if (dir.lengthSq() > 1e-6) {
      return dir.normalize();
    }
  }
  return getDefaultDirection(normName);
}

function computeDirection(from, to) {
  if (!isConfident(from) || !isConfident(to)) return null;
  const dx = to.x - from.x;
  const dy = -(to.y - from.y);
  const dz = 0;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 0.001) return null;
  return { x: dx / len, y: dy / len, z: dz / len };
}

function findBone(name) {
  if (!avatarModel) return null;
  const norm = normalizeBoneName(name);
  if (avatarBoneMap[norm]) return avatarBoneMap[norm];
  let found = null;
  avatarModel.traverse((child) => {
    if (!child.isBone) return;
    const childNorm = normalizeBoneName(child.name);
    if (childNorm === norm) {
      found = child;
    }
  });
  if (found) {
    avatarBoneMap[norm] = found;
    if (!avatarBoneRestQuats[norm]) {
      avatarBoneRestQuats[norm] = found.quaternion.clone();
    }
    if (!avatarBoneRestDirs[norm]) {
      avatarBoneRestDirs[norm] = getDefaultDirection(norm);
    }
  }
  return found;
}

function rotateBone(boneName, dir) {
  if (!dir) return;
  const bone = findBone(boneName);
  if (!bone) return;
  const norm = normalizeBoneName(boneName);
  const restQuat = (avatarBoneRestQuats[norm] || bone.quaternion).clone();
  const restDir = (avatarBoneRestDirs[norm] || getDefaultDirection(norm)).clone();
  const targetVec = new THREE.Vector3(dir.x, dir.y, dir.z ?? 0);
  if (targetVec.lengthSq() < 1e-6 || restDir.lengthSq() < 1e-6) return;
  targetVec.normalize();
  restDir.normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(restDir, targetVec);
  const targetQuat = restQuat.multiply(delta);
  avatarBoneTargetQuats[norm] = targetQuat.clone();
  if (BONE_SMOOTH_FACTOR >= 1) {
    bone.quaternion.copy(targetQuat);
  } else {
    bone.quaternion.slerp(targetQuat, BONE_SMOOTH_FACTOR);
  }
}

function resetBoneToRest(boneName) {
  const bone = findBone(boneName);
  if (!bone) return;
  const norm = normalizeBoneName(boneName);
  const restQuat = avatarBoneRestQuats[norm];
  if (restQuat) {
    avatarBoneTargetQuats[norm] = restQuat.clone();
    if (BONE_SMOOTH_FACTOR >= 1) {
      bone.quaternion.copy(restQuat);
    } else {
      bone.quaternion.slerp(restQuat, BONE_SMOOTH_FACTOR);
    }
  }
}

export function updateAvatarFromPose(keypoints) {
  if (!avatarModel || !keypoints || keypoints.length < 17) return;

  const rShoulder = keypoints[KEY.rightShoulder];
  const rElbow = keypoints[KEY.rightElbow];
  const rWrist = keypoints[KEY.rightWrist];
  rotateBone("mixamorigRightArm", computeDirection(rShoulder, rElbow));
  rotateBone("mixamorigRightForeArm", computeDirection(rElbow, rWrist));

  const lShoulder = keypoints[KEY.leftShoulder];
  const lElbow = keypoints[KEY.leftElbow];
  const lWrist = keypoints[KEY.leftWrist];
  rotateBone("mixamorigLeftArm", computeDirection(lShoulder, lElbow));
  rotateBone("mixamorigLeftForeArm", computeDirection(lElbow, lWrist));

  const rHip = keypoints[KEY.rightHip];
  const rKnee = keypoints[KEY.rightKnee];
  const rAnkle = keypoints[KEY.rightAnkle];
  rotateBone("mixamorigRightUpLeg", computeDirection(rHip, rKnee));
  rotateBone("mixamorigRightLeg", computeDirection(rKnee, rAnkle));

  const lHip = keypoints[KEY.leftHip];
  const lKnee = keypoints[KEY.leftKnee];
  const lAnkle = keypoints[KEY.leftAnkle];
  rotateBone("mixamorigLeftUpLeg", computeDirection(lHip, lKnee));
  rotateBone("mixamorigLeftLeg", computeDirection(lKnee, lAnkle));

  const lShoulderKp = keypoints[KEY.leftShoulder];
  const rShoulderKp = keypoints[KEY.rightShoulder];
  const lHipKp = keypoints[KEY.leftHip];
  const rHipKp = keypoints[KEY.rightHip];
  if (
    isConfident(lShoulderKp) &&
    isConfident(rShoulderKp) &&
    isConfident(lHipKp) &&
    isConfident(rHipKp)
  ) {
    const spineMid = {
      x: (lShoulderKp.x + rShoulderKp.x) / 2,
      y: (lShoulderKp.y + rShoulderKp.y) / 2,
    };
    const hipMid = {
      x: (lHipKp.x + rHipKp.x) / 2,
      y: (lHipKp.y + rHipKp.y) / 2,
    };
    rotateBone("mixamorigSpine2", computeDirection(hipMid, spineMid));
  }

  if (LOCK_HEAD_FORWARD) {
    resetBoneToRest("mixamorigHead");
    resetBoneToRest("mixamorigNeck");
  } else {
    const nose = keypoints[KEY.nose];
    const lEar = keypoints[KEY.leftEar];
    const rEar = keypoints[KEY.rightEar];
    const refEar = isConfident(rEar) ? rEar : lEar;
    if (isConfident(nose) && isConfident(refEar)) {
      const dir = computeDirection(refEar, nose);
      rotateBone("mixamorigHead", dir);
      rotateBone("mixamorigNeck", dir);
    }
  }
}
