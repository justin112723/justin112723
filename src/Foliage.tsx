import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore, getRandomConePosition, getRandomSpherePosition } from './store';

// 自定义着色器材质
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uLerp: { value: 1 }, // 控制混乱到成型的进度
    uColorHigh: { value: new THREE.Color('#d4af37') }, // 高光金色
    uColorBase: { value: new THREE.Color('#004225') }, // 深祖母绿
  },
  vertexShader: `
    uniform float uLerp;
    uniform float uTime;
    attribute vec3 aTargetPos;
    attribute vec3 aChaosPos;
    attribute float aSize;
    varying vec3 vPosition;

    void main() {
      vPosition = aTargetPos;
      // 核心逻辑：在两个位置之间插值
      vec3 finalPos = mix(aChaosPos, aTargetPos, uLerp);
      
      // 添加一点基于噪波的微妙摆动，增加生动感
      finalPos.x += sin(uTime * 2.0 + finalPos.y) * 0.05 * uLerp;

      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      // 根据距离调整粒子大小，增加深度感
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorHigh;
    varying vec3 vPosition;

    void main() {
      // 简单的圆形粒子切割
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d > 0.5) discard;

      // 根据高度混合颜色，树梢更金，底部更绿
      float heightMix = smoothstep(-5.0, 5.0, vPosition.y);
      vec3 finalColor = mix(uColorBase, uColorHigh, heightMix * 0.3);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const COUNT = 50000; // 粒子数量

export const Foliage = () => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lerpFactor = useAppStore((state) => state.lerpFactor);

  // 初始化数据：计算双重坐标
  const [chaosPositions, targetPositions, sizes] = useMemo(() => {
    const cPos = new Float32Array(COUNT * 3);
    const tPos = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const chaos = getRandomSpherePosition(25); // 较大的混沌半径
      cPos.set(chaos, i * 3);

      // 树的参数：高度12，底部半径4
      const target = getRandomConePosition(12, 4);
      tPos.set(target, i * 3);

      s[i] = Math.random() * 0.5 + 0.2; // 随机大小
    }
    return [cPos, tPos, s];
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uLerp.value = lerpFactor;
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        {/* 这里的 position 属性实际上不用于渲染位置，只用于占位 */}
        <bufferAttribute attach="attributes-position" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-aChaosPos" args={[chaosPositions, 3]} />
        <bufferAttribute attach="attributes-aTargetPos" args={[targetPositions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={materialRef} args={[FoliageMaterial]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};