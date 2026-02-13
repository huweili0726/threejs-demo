<template>
  <div class="threeJs-container" ref="threeJsContainer">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watchEffect } from 'vue'
import * as THREE from 'three'
import { useThreeScene } from '@/composables/threeJs/useThreeScene'
import { useModelLoader } from '@/composables/threeJs/useModelLoader'
import { useEnvironmentLoader } from '@/composables/threeJs/useEnvironmentLoader'

const threeJsContainer = ref<HTMLDivElement>()

// 使用three自定义 Hooks
const { scene, initScene, render, onWindowResize, camera, controls, flyTo, setAnimationUpdateCallback, startAnimationLoop, stopAnimationLoop } = useThreeScene(threeJsContainer)
const { isLoading, loadingText, loadModel, loadModels, updateAnimations, moveModel, attachCameraToModel, cameraFollowModel, loadedModels } = useModelLoader(scene, render)
const { loadEnvironment } = useEnvironmentLoader(scene)

// 控制变量
const keysPressed = ref<Set<string>>(new Set())
const currentModelUrl = ref<string>('glb/man.glb')
const cameraOffset = new THREE.Vector3(-.2, .1, 0) // 相机偏移量

const props = withDefaults(
  defineProps<{
    skyBoxUrl?: string  // 天空盒路径
  }>(),
  {
    skyBoxUrl: undefined,
  }
)

onMounted(() => {
  if (!props.skyBoxUrl) {
    return
  }
  
  initScene({ coordinateAxis: true }) // 初始化场景
  loadEnvironment(props.skyBoxUrl, render) // 加载天空盒

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  // 设置动画更新回调
  setAnimationUpdateCallback((deltaTime: number) => {
    updateAnimations(deltaTime)
    updateCharacterMovement(deltaTime)
    // 相机跟随人物
    if (currentModelUrl.value && camera.value) {
      cameraFollowModel(currentModelUrl.value, camera.value, cameraOffset)
    }
  })
  
  // 启动动画循环
  startAnimationLoop()
})

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize()
})

// 键盘按下事件
const handleKeyDown = (event: KeyboardEvent) => {
  console.log(`键盘按下 ${event.key}`)
  keysPressed.value.add(event.key.toLowerCase())
}

// 键盘释放事件
const handleKeyUp = (event: KeyboardEvent) => {
  keysPressed.value.delete(event.key.toLowerCase())
}

// 更新人物移动
const updateCharacterMovement = (deltaTime: number) => {
  if (!currentModelUrl.value) return
  
  const speed = .1 * deltaTime // 移动速度（基于时间增量，确保不同帧率下速度一致）
  const rotationSpeed = 2 * deltaTime // 旋转速度（基于时间增量）
  const direction = new THREE.Vector3()
  
  // 方向键控制
  if (keysPressed.value.has('w') || keysPressed.value.has('arrowup')) {
    direction.x += .1
  }
  if (keysPressed.value.has('s') || keysPressed.value.has('arrowdown')) {
    direction.x -= .1
  }
  
  // 归一化方向向量，确保斜向移动速度一致
  if (direction.length() > 0) {
    direction.normalize()
    moveModel(currentModelUrl.value, direction, speed)
  }
  
  // 左右转向控制
  const model = loadedModels.value.get(currentModelUrl.value)
  if (model) {
    if (keysPressed.value.has('a') || keysPressed.value.has('arrowleft')) {
      model.rotation.y += rotationSpeed
    }
    if (keysPressed.value.has('d') || keysPressed.value.has('arrowright')) {
      model.rotation.y -= rotationSpeed
    }
  }
}

// 组件卸载时清理
onBeforeUnmount(() => {
  stopAnimationLoop()
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

/**
 * 视角平滑飞行到指定模型
 * @param targetPosition 目标位置
 * @param targetTarget 目标朝向
 * @param duration 动画持续时间（毫秒）
 */
const flyToModel = async (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number = 1000) => {
  if (!scene.value || !camera.value || !controls.value) {
    console.error('场景scene、相机camera、控制器controls未初始化')
    return
  }
  await flyTo(targetPosition, targetTarget, duration)
}

// 暴露方法给父组件
defineExpose({
  loadModel,
  loadModels,
  flyToModel
})
</script>

<style scoped lang="less">
.threeJs-container {
  width: 100vw;
  height: 100vh;
  position: relative;

  .loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.4);
    padding: 20px 30px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(100, 255, 218, 0.3);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(100, 255, 218, 0.3);
      border-top: 3px solid #64ffda;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }

    .loading-text {
      color: #64ffda;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      max-width: 300px;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
