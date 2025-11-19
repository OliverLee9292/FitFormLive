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

  loader.load(
    url,
    (gltf) => {
      if (requestId !== avatarLoadToken) {
        return;
      }
      avatarModel = gltf.scene;
      avatarBoneMap = {};

      avatarModel.traverse((obj) => {
        if (obj.isBone) {
          avatarBoneMap[obj.name] = obj;
        }
      });

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
  if (avatarBoneMap[name]) return avatarBoneMap[name];
  let found = null;
  avatarModel.traverse((child) => {
    if (
      child.name === name ||
      child.name.toLowerCase() === name.toLowerCase()
    ) {
      found = child;
    }
  });
  if (found) {
    avatarBoneMap[name] = found;
  }
  return found;
}

function rotateBone(boneName, dir) {
  if (!dir) return;
  const bone = findBone(boneName);
  if (!bone) return;
  const targetPos = new THREE.Vector3(
    bone.position.x + dir.x,
    bone.position.y + dir.y,
    bone.position.z + dir.z
  );
  bone.lookAt(targetPos);
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
