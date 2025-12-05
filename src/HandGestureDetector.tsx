import { useEffect } from 'react';
import { useAppStore } from './store';

const HandGestureDetector: React.FC = () => {
  const { setMode, mode, setHandPosition } = useAppStore();

  // 初始化手势检测
  useEffect(() => {
    console.log('初始化手势检测');
    
    // 创建一个简单的HTML元素来显示调试信息
    const debugElement = document.createElement('div');
    debugElement.id = 'gesture-debug';
    debugElement.style.position = 'absolute';
    debugElement.style.top = '10px';
    debugElement.style.right = '10px';
    debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugElement.style.color = 'white';
    debugElement.style.padding = '10px';
    debugElement.style.borderRadius = '5px';
    debugElement.style.fontFamily = 'monospace';
    debugElement.style.zIndex = '1000';
    document.body.appendChild(debugElement);
    
    // 初始状态：确保圣诞树是成型的
    setMode('FORMED');
    debugElement.innerHTML = '初始状态：成型圣诞树<br/>等待手势...';
    
    // 添加手势检测的UI元素
    const webcamElement = document.createElement('video');
    webcamElement.id = 'gesture-webcam';
    webcamElement.style.position = 'absolute';
    webcamElement.style.bottom = '10px';
    webcamElement.style.right = '10px';
    webcamElement.style.width = '200px';
    webcamElement.style.height = '150px';
    webcamElement.style.border = '2px solid white';
    webcamElement.style.borderRadius = '5px';
    webcamElement.style.zIndex = '999';
    document.body.appendChild(webcamElement);
    
    // 手势检测状态
    let previousGesture = 'CLOSED';
    let gestureChangeTime = 0;
    let isHandMoving = false;
    let handPositionHistory: number[] = []; // 保存最近的手位置历史
    const historyLength = 5; // 保存5个历史位置
    
    // 获取摄像头权限
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then(stream => {
        webcamElement.srcObject = stream;
        
        // 等待视频元素加载完成
        webcamElement.onloadedmetadata = () => {
          webcamElement.play();
          debugElement.innerHTML = '初始状态：成型圣诞树<br/>摄像头访问成功<br/>等待手势...';
          
          // 使用基于颜色和亮度的手势检测
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // 设置canvas尺寸
          canvas.width = 640;
          canvas.height = 480;
          
          // 创建另一个canvas用于显示处理后的图像（可选）
          const processedCanvas = document.createElement('canvas');
          processedCanvas.width = 200;
          processedCanvas.height = 150;
          const processedCtx = processedCanvas.getContext('2d');
          if (!processedCtx) return;
          processedCanvas.id = 'processed-webcam';
          processedCanvas.style.position = 'absolute';
          processedCanvas.style.bottom = '170px';
          processedCanvas.style.right = '10px';
          processedCanvas.style.border = '2px solid white';
          processedCanvas.style.borderRadius = '5px';
          processedCanvas.style.zIndex = '999';
          document.body.appendChild(processedCanvas);
          
          // 手势检测函数
          const detectGesture = () => {
            try {
              // 检查视频元素是否准备好
              if (webcamElement.readyState !== 4) {
                requestAnimationFrame(detectGesture);
                return;
              }
              
              // 绘制当前视频帧到canvas
              ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);
              
              // 获取中心区域的图像数据
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const regionSize = 150; // 缩小检测区域，提高准确性
              const imageData = ctx.getImageData(
                centerX - regionSize / 2,
                centerY - regionSize / 2,
                regionSize,
                regionSize
              );
              const data = imageData.data;
              
              // 计算亮度和颜色信息
              let totalBrightness = 0;
              let brightPixelCount = 0;
              let pixelCount = 0;
              
              // 计算亮像素数量
              const brightnessThreshold = 80; // 亮像素阈值
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;
                
                totalBrightness += brightness;
                if (brightness > brightnessThreshold) {
                  brightPixelCount++;
                }
                pixelCount++;
              }
              
              const avgBrightness = totalBrightness / pixelCount;
              const brightPixelRatio = brightPixelCount / pixelCount;
              
              // 绘制处理后的图像（可选）
              if (processedCtx) {
                processedCtx.fillStyle = avgBrightness > 100 ? 'lightgray' : 'darkgray';
                processedCtx.fillRect(0, 0, processedCanvas.width, processedCanvas.height);
                processedCtx.fillStyle = 'white';
                processedCtx.font = '12px monospace';
                processedCtx.fillText(`Brightness: ${avgBrightness.toFixed(0)}`, 10, 20);
                processedCtx.fillText(`Bright Pixels: ${(brightPixelRatio * 100).toFixed(0)}%`, 10, 40);
              }
              
              // 检测手部位置：使用更简单直接的方法
              // 在整个视频宽度上检测最亮的区域，作为手的水平位置
              let maxBrightness = 0;
              let brightestX = centerX;
              
              // 增大检测区域，确保能检测到左右移动
              const handDetectionHeight = 200;
              const handDetectionY = centerY - handDetectionHeight / 2;
              
              // 只检查中间区域的水平位置
              for (let y = 0; y < handDetectionHeight; y++) {
                for (let x = 0; x < canvas.width; x++) {
                  const pixelX = x;
                  const pixelY = handDetectionY + y;
                  const index = ((pixelY * canvas.width + pixelX) * 4);
                  
                  if (pixelY >= 0 && pixelY < canvas.height && index < data.length) {
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const brightness = (r + g + b) / 3;
                    
                    // 找到最亮的水平位置
                    if (brightness > maxBrightness) {
                      maxBrightness = brightness;
                      brightestX = pixelX;
                    }
                  }
                }
              }
              
              // 将最亮位置转换为归一化的手位置 (0-1)
              let handX = brightestX / canvas.width;
              // 限制手位置范围，使旋转更明显
              handX = Math.max(0.1, Math.min(0.9, handX));
              
              // 简化的手部位置描述
              let handPositionText = '中间';
              if (handX < 0.3) {
                handPositionText = '左侧';
              } else if (handX > 0.7) {
                handPositionText = '右侧';
              }
              
              // 更新手部位置
              const handPosition = { x: handX, y: 0.5 };
              setHandPosition(handPosition);
              
              // 添加到位置历史
              handPositionHistory.push(handX);
              if (handPositionHistory.length > historyLength) {
                handPositionHistory.shift();
              }
              
              // 检测手部移动：计算位置历史的变化
              let positionChange = 0;
              if (handPositionHistory.length > 1) {
                for (let i = 1; i < handPositionHistory.length; i++) {
                  positionChange += Math.abs(handPositionHistory[i] - handPositionHistory[i - 1]);
                }
              }
              
              // 降低移动检测阈值，使其更容易检测到移动
              const movementThreshold = 0.02; // 降低阈值
              isHandMoving = positionChange > movementThreshold;
              
              // 手势检测：使用亮度和亮像素比例
              // 只有手静止时才检测手势变化
              let isOpenHand = false;
              let gesture = 'CLOSED';
              
              if (!isHandMoving) {
                // 提高阈值，确保只有明确的张开手才会被检测到
                if (avgBrightness > 160 && brightPixelRatio > 0.5) {
                  isOpenHand = true;
                  gesture = 'OPEN';
                } else {
                  isOpenHand = false;
                  gesture = 'CLOSED';
                }
              } else {
                // 手在移动时，保持之前的手势
                gesture = previousGesture;
              }
              
              // 添加手势变化防抖
              const now = Date.now();
              if (gesture !== previousGesture) {
                if (now - gestureChangeTime > 1000) { // 延长防抖时间，确保明确识别
                  previousGesture = gesture;
                  gestureChangeTime = now;
                  
                  // 更新全局状态
                  console.log('手势变化:', gesture);
                  if (isOpenHand) {
                    console.log('切换到CHAOS模式');
                    setMode('CHAOS');
                  } else {
                    console.log('切换到FORMED模式');
                    setMode('FORMED');
                  }
                }
              }
              
              // 更新调试信息
              debugElement.innerHTML = `
                初始状态：成型圣诞树<br/>
                摄像头访问成功<br/>
                当前模式: ${mode}<br/>
                手势状态: ${gesture}<br/>
                手是否移动: ${isHandMoving ? '是' : '否'}<br/>
                平均亮度: ${avgBrightness.toFixed(0)}<br/>
                亮像素比例: ${(brightPixelRatio * 100).toFixed(0)}%<br/>
                手部位置: ${handPositionText}<br/>
                位置变化: ${positionChange.toFixed(3)}<br/>
                位置历史长度: ${handPositionHistory.length}<br/>
                上次手势变化: ${Math.floor((now - gestureChangeTime) / 1000)}s ago
              `;
              
            } catch (error) {
              console.error('图像分析失败:', error);
              debugElement.innerHTML = `图像分析失败: ${error instanceof Error ? error.message : '未知错误'}`;
            }
            
            requestAnimationFrame(detectGesture);
          };
          
          detectGesture();
        };
      })
      .catch(error => {
        console.error('摄像头访问失败:', error);
        debugElement.innerHTML = `摄像头访问失败: ${error.message}`;
      });
    
    return () => {
      document.body.removeChild(debugElement);
      const webcamElement = document.getElementById('gesture-webcam');
      if (webcamElement instanceof HTMLVideoElement && webcamElement.srcObject) {
        const stream = webcamElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      const processedCanvas = document.getElementById('processed-webcam');
      if (processedCanvas) {
        document.body.removeChild(processedCanvas);
      }
    };
  }, []);

  return null;
};

export default HandGestureDetector;