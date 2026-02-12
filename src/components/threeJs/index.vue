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
import { useThreeScene } from '@/composables/useThreeScene'
import { useModelLoader } from '@/composables/useModelLoader'
import { useEnvironmentLoader } from '@/composables/useEnvironmentLoader'

const threeJsContainer = ref<HTMLDivElement>()

const props = withDefaults(
  defineProps<{
    skyBoxUrl?: string  // 天空盒路径
    modelUrl?: string  // 模型路径
  }>(),
  {
    skyBoxUrl: undefined,
    modelUrl: undefined
  }
)

// 使用自定义 Hooks
const { scene, initScene, render, onWindowResize } = useThreeScene(threeJsContainer)
const { isLoading, loadingText, loadModels } = useModelLoader(scene, render)
const { loadEnvironment } = useEnvironmentLoader(scene)

onMounted(() => {
  if (!props.skyBoxUrl) {
    return
  }
  
  initScene()
  loadEnvironment(props.skyBoxUrl, render)
})

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize()
})

// 暴露方法给父组件
defineExpose({
  loadModels
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