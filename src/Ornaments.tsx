import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore, getRandomConePosition, getRandomSpherePosition } from './store';

const tempObject = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();

// 定义装饰品类型
type OrnamentType = 'heavy' | 'light' | 'polaroid';

interface OrnamentsProps {
  count: number;
  type: OrnamentType;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export const InstancedOrnaments = ({ count, type, geometry, material }: OrnamentsProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lerpFactor = useAppStore((state) => state.lerpFactor);

  // 不同的物体有不同的“归位”速度 (模拟重量)
  const lerpSpeedModifier = useMemo(() => {
    switch (type) {
        case 'heavy': return 0.8; // 慢
        case 'light': return 1.2; // 快
        case 'polaroid': return 1.0; // 中等
        default: return 1.0;
    }
  }, [type]);

  // 存储双重坐标和随机旋转
  const data = useMemo(() => {
    return Array.from({ length: count }, () => ({
      chaosPos: new THREE.Vector3(...getRandomSpherePosition(30)),
      targetPos: new THREE.Vector3(...getRandomConePosition(11, 4.2)), // 稍微在针叶外部
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      scale: Math.random() * 0.3 + 0.2,
      currentPos: new THREE.Vector3(), // 用于追踪当前位置实现平滑
    }));
  }, [count]);

  // 初始化位置
  useLayoutEffect(() => {
      data.forEach((item, i) => {
          item.currentPos.copy(item.targetPos); // 初始设为目标位置
          tempObject.position.copy(item.targetPos);
          tempObject.rotation.copy(item.rotation);
          tempObject.scale.setScalar(item.scale);
          tempObject.updateMatrix();
          meshRef.current!.setMatrixAt(i, tempObject.matrix);
      })
      meshRef.current!.instanceMatrix.needsUpdate = true;
  }, [data]);


  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // 根据修改后的速度计算当前的插值目标
    // 这里做一个简单的近似，实际物理模拟会更复杂
    const adjustedLerp = Math.pow(lerpFactor, lerpSpeedModifier);

    data.forEach((item, i) => {
      // 计算目标位置
      tempVec3.lerpVectors(item.chaosPos, item.targetPos, adjustedLerp);
      
      // 使用额外的 lerp 使移动更平滑 (可选)
      // item.currentPos.lerp(tempVec3, delta * 5);
      item.currentPos.copy(tempVec3);

      tempObject.position.copy(item.currentPos);
      
      // 在混乱状态下缓慢旋转
      if (lerpFactor < 0.95) {
         tempObject.rotation.x += delta * 0.2;
         tempObject.rotation.y += delta * 0.1;
      } else {
         // 回归原始旋转
         tempObject.rotation.copy(item.rotation);
      }

      tempObject.scale.setScalar(item.scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />
  );
};