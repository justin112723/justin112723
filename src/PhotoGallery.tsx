import { useRef, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 照片文件列表
const photoFiles = [
  '微信图片_20251204135048_392_383.jpg',
  '微信图片_20251204135049_393_383.jpg',
  '微信图片_20251204135050_394_383.jpg',
  '微信图片_20251204135052_395_383.jpg',
  '微信图片_20251204135054_396_383.jpg',
  '微信图片_20251204135057_397_383.jpg',
  '微信图片_20251204135100_398_383.jpg',
  '微信图片_20251204135103_399_383.jpg',
  '微信图片_20251204135107_400_383.jpg',
  '微信图片_20251204135110_401_383.jpg'
];

// 照片组件
interface PhotoProps {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  index: number;
}

const Photo: React.FC<PhotoProps> = ({ url, position, rotation, scale, index }) => {
  const [isEnlarged, setIsEnlarged] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // 加载纹理
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  // 使用useLayoutEffect确保纹理在组件挂载时加载
  useLayoutEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      url,
      (loadedTexture) => {
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.error('Error loading texture:', error);
      }
    );
    
    // 清理函数
    return () => {
      // 纹理加载完成后再销毁
      if (texture) {
        texture.dispose();
      }
    };
  }, [url]);
  
  // 基础位置和缩放
  const baseScale = scale[0]; // 使用x轴缩放值作为基础缩放
  const basePosition = [...position] as [number, number, number];
  
  // 动画效果
  useFrame((_, delta) => {
    if (meshRef.current) {
      // 平滑过渡到目标状态
      const targetScale = isEnlarged ? baseScale * 3 : baseScale;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, 0.01), delta * 5);
      
      // 为照片添加轻微的浮动效果
      if (!isEnlarged) {
        meshRef.current.position.y = basePosition[1] + Math.sin(Date.now() * 0.001 + index) * 0.1;
      }
    }
  });
  
  return (
    <>
      {/* 照片平面 */}
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        scale={[baseScale, baseScale, 0.01]}
        onClick={() => setIsEnlarged(!isEnlarged)}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[1, 1]} />
        {texture && (
          <meshBasicMaterial
            ref={materialRef}
            map={texture}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        )}
        {/* 照片边框 */}
        <mesh position={[0, 0, -0.01]} scale={[1.05, 1.05, 0.01]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </mesh>
      
      {/* 放大查看时的背景 */}
      {isEnlarged && (
        <mesh position={[0, 0, -5]} scale={[20, 20, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="rgba(0, 0, 0, 0.8)" transparent opacity={0.8} />
        </mesh>
      )}
    </>
  );
};

// 照片画廊组件
export const PhotoGallery: React.FC = () => {
  return (
    <group>
      {/* 螺旋分布照片，围绕圣诞树向上 */}
      {photoFiles.map((fileName, index) => {
        // 螺旋分布参数
        const totalPhotos = photoFiles.length;
        const radius = 10 + (index / totalPhotos) * 2; // 半径从10到12递增
        const height = -3 + (index / totalPhotos) * 10; // 高度从-3到7递增
        const angle = (index / totalPhotos) * Math.PI * 4; // 旋转4圈
        
        // 计算3D位置
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // 确保照片面向观众
        // 计算照片需要旋转的角度，使其始终面向相机
        const rotationY = Math.atan2(x, z);
        
        return (
          <Photo
            key={index}
            url={`/photos/${fileName}`}
            position={[x, height, z]}
            rotation={[0, rotationY, 0]}
            scale={[1.5, 1.5, 0.01]}
            index={index}
          />
        );
      })}
    </group>
  );
};