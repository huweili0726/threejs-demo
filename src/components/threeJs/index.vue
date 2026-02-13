<template>
  <div class="threeJs-container" ref="threeJsContainer">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import * as THREE from 'three'
import { useThreeScene } from '@/composables/threeJs/useThreeScene'
import { useModelLoader } from '@/composables/threeJs/useModelLoader'
import { useEnvironmentLoader } from '@/composables/threeJs/useEnvironmentLoader'

const threeJsContainer = ref<HTMLDivElement>()

// 使用three自定义 Hooks
const { scene, initScene, render, onWindowResize, camera, controls, flyTo } = useThreeScene(threeJsContainer)
const { isLoading, loadingText, loadModel, loadModels, updateAnimations } = useModelLoader(scene, render)
const { loadEnvironment } = useEnvironmentLoader(scene)

const props = withDefaults(
  defineProps<{
    skyBoxUrl?: string  // 天空盒路径
  }>(),
  {
    skyBoxUrl: undefined,
  }
)

// 渲染循环
let animationId: number | null = null
const clock = new THREE.Clock()

function renderLoop() {
  // 获取两帧之间的时间增量（秒），这是动画持续播放的核心
  const deltaTime = clock.getDelta()
  
  // 调用动画更新方法，传入时间增量
  updateAnimations(deltaTime)
  // updateTweens()
  
  // 渲染场景
  render()
  
  // 持续请求下一帧
  animationId = requestAnimationFrame(renderLoop)
}

onMounted(() => {
  if (!props.skyBoxUrl) {
    return
  }
  
  initScene({ coordinateAxis: true }) // 初始化场景
  loadEnvironment(props.skyBoxUrl, render) // 加载天空盒

  renderLoop()
})

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize()
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

/**
 * 加载模型并启动渲染循环
 * @param options 模型加载选项
 */
const loadModelAndStartRender = async (options: {
  modelUrl: string
  scale: number
  modelInitPosition?: { x: number; y: number; z: number }
  onLookAt?: { x: number; y: number; z: number }
  enableAnimation?: boolean
}) => {
  try {
    await loadModel(options)
    // 模型加载完毕后启动渲染循环
    renderLoop()
  } catch (error) {
    console.error('模型加载失败:', error)
  }
}

/**
 * 加载多个模型并启动渲染循环
 * @param options 模型加载选项
 */
const loadModelsAndStartRender = async (options: {
  modelUrls: string[]
  scale: number
  modelInitPosition?: { x: number; y: number; z: number }
  onLookAt?: { x: number; y: number; z: number }
  enableAnimation?: boolean
}) => {
  try {
    await loadModels(options)
    // 所有模型加载完毕后启动渲染循环
    renderLoop()
  } catch (error) {
    console.error('模型加载失败:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  loadModel,
  loadModels,
  flyToModel,
  loadModelAndStartRender,
  loadModelsAndStartRender
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
