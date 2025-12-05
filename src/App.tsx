import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from './store';
import { Foliage } from './Foliage';
import { InstancedOrnaments } from './Ornaments';
import HandGestureDetector from './HandGestureDetector';
import { PhotoGallery } from './PhotoGallery';

// 材质准备
const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#d4af37", roughness: 0.1, metalness: 0.9, envMapIntensity: 1.5  
});
const redGiftMaterial = new THREE.MeshStandardMaterial({ color: "#8a0000", roughness: 0.3 });

// 几何体准备
const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

// 场景内容
const SceneContent = () => {
  const updateLerp = useAppStore(state => state.updateLerp);
  const handPosition = useAppStore(state => state.handPosition);
  const sceneRef = useRef<THREE.Group>(null);
  
  // 驱动状态机动画和旋转
  useFrame((_, delta) => {
      updateLerp(delta);
      
      // 根据手的位置控制旋转
      if (sceneRef.current) {
        // 将手的x坐标（0.1-0.9）映射到旋转角度（-PI到PI）
        const targetRotationY = (handPosition.x - 0.5) * Math.PI * 2;
        // 使用阻尼平滑过渡，调整速度使旋转更流畅
        sceneRef.current.rotation.y += (targetRotationY - sceneRef.current.rotation.y) * delta * 3;
      }
  });

  return (
    <group ref={sceneRef}>
      <Foliage />
      
      {/* 金色球体 (轻) */}
      <InstancedOrnaments count={200} type="light" geometry={sphereGeo} material={goldMaterial} />
      {/* 红色礼物盒 (重) */}
      <InstancedOrnaments count={50} type="heavy" geometry={boxGeo} material={redGiftMaterial} />
      
      {/* 3D照片墙 */}
      <PhotoGallery />

      {/* 核心环境光 */}
      <ambientLight intensity={0.2} color="#d4af37" />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} castShadow color="#ffecb3" />
      <Environment preset="lobby" background={false} />
    </group>
  );
};

// 模拟手势控制的 UI (替代真实的摄像头集成)
const MockUI = () => {
    const { setMode, mode } = useAppStore();
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex gap-6">
            <button  
                className={`px-8 py-4 rounded-full font-bold uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${mode === 'CHAOS' ? 'bg-red-600 text-white shadow-red-500/50' : 'bg-white text-black hover:bg-gray-100'}`}
                onClick={() => setMode('CHAOS')}
            >
                Unleash (张开手)
            </button>
            <button  
                 className={`px-8 py-4 rounded-full font-bold uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${mode === 'FORMED' ? 'bg-green-700 text-white shadow-green-500/50' : 'bg-white text-black hover:bg-gray-100'}`}
                onClick={() => setMode('FORMED')}
            >
                Restore (闭上手)
            </button>
        </div>
    );
};


export default function App() {
  return (
    <div className="w-full h-screen bg-black relative">
      {/* 手势检测器，在最底层 */}
      <HandGestureDetector />
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={50} />
        <color attach="background" args={['#050f0a']} />  {/* 深色背景衬托辉光 */}
        <fog attach="fog" args={['#050f0a', 20, 50]} />

        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        <EffectComposer enableNormalPass={false}>
            {/* 核心辉光效果：阈值高，强度大，营造金色光晕 */}
          <Bloom  
            luminanceThreshold={0.8}  
            intensity={1.2}  
            levels={8}  
            mipmapBlur  
          />
          {/* 移除Vignette组件，使用CSS实现类似效果 */}
        </EffectComposer>

        <OrbitControls  
            enablePan={false}  
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={10}
            maxDistance={30}
            autoRotate
            autoRotateSpeed={0.5}
        />
      </Canvas>
      
      <MockUI />
      <div className="absolute top-5 left-5 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400 font-serif text-2xl font-bold z-10 shadow-lg drop-shadow-[0_2px_4px_rgba(212,175,55,0.5)]">
          GRAND LUXURY INTERACTIVE TREE
      </div>
    </div>
  );
}
