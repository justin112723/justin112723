import { create } from 'zustand';
import { MathUtils } from 'three';

interface AppState {
  mode: 'CHAOS' | 'FORMED';
  lerpFactor: number; // 0 到 1 之间的值
  handPosition: { x: number; y: number }; // 手的位置，用于控制旋转
  setMode: (mode: 'CHAOS' | 'FORMED') => void;
  updateLerp: (delta: number) => void;
  setHandPosition: (position: { x: number; y: number }) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'FORMED', // 初始状态为成型
  lerpFactor: 1,
  handPosition: { x: 0.5, y: 0.5 }, // 初始位置在中心
  setMode: (mode) => set({ mode }),
  // 在每一帧调用，平滑过渡 lerpFactor
  updateLerp: (delta) => {
    const { mode, lerpFactor } = get();
    const target = mode === 'FORMED' ? 1 : 0;
    // 使用阻尼平滑过渡，速度可调
    const newLerp = MathUtils.damp(lerpFactor, target, 2, delta);
    set({ lerpFactor: newLerp });
  },
  // 设置手的位置
  setHandPosition: (position) => set({ handPosition: position }),
}));

// 工具函数：生成圆锥体（树）上的随机点
export const getRandomConePosition = (height: number, baseRadius: number) => {
  const h = Math.random() * height;
  const r = (baseRadius * (height - h)) / height; // 越高半径越小
  const theta = Math.random() * Math.PI * 2;
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  return [x, h - height / 2, z] as [number, number, number]; // 中心化
};

// 工具函数：生成球体空间内的随机点 (Chaos)
export const getRandomSpherePosition = (radius: number) => {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius; // 使用立方根保证分布均匀
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const x = r * sinPhi * cosTheta;
    const y = r * sinPhi * sinTheta;
    const z = r * cosPhi;
    return [x, y, z] as [number, number, number];
};