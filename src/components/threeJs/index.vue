<template>
  <div class="threeJs-container" ref="threeJsContainer">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { onMounted, onBeforeUnmount, ref, watchEffect, watch } from 'vue'
import { useThreeScene } from '@/composables/threeJs/useThreeScene' // 场景相关Hooks
import { useModelLoader } from '@/composables/threeJs/useModelLoader' // 模型加载相关Hooks
import { useEnvironmentLoader } from '@/composables/threeJs/useEnvironmentLoader' // 环境贴图加载相关Hooks
import { useCharacterMovement } from '@/composables/threeJs/useCharacterMovement' // 人物移动控制相关Hooks
import { useObjectSelection } from '@/composables/threeJs/useObjectSelection' // 物体选择相关Hooks

const threeJsContainer = ref<HTMLDivElement>()

const { scene, camera, initScene, render, flyTo, setAnimationUpdateCallback, startAnimationLoop, updateAnimations, stopAnimationLoop, onWindowResize } = useThreeScene(threeJsContainer)
const { isLoading, loadingText, loadedModelMaps, modelMixers, loadModel, loadModels, moveModel, cameraFollowModel } = useModelLoader(scene as any, render)
const { loadEnvironment } = useEnvironmentLoader(scene as any)
const { initKeyboardEvents, updateCharacterMovement, addBoundingBoxesToObjects } = useCharacterMovement()
const { initDoubleClickSelection } = useObjectSelection(camera as any, scene as any)

// 控制变量
const currentModelUrl = ref<string>('glb/man.glb') // 当前加载的模型URL
const cameraOffset = new THREE.Vector3(0, 0.1, -0.12) // 相机偏移量（在模型后方，稍微上方）
let cleanupKeyboardEvents: (() => void) | null = null // 清理键盘事件的函数
let cleanupSelection: (() => void) | null = null // 清理双击选中事件的函数

const props = withDefaults(
  defineProps<{
    skyBoxUrl?: string  // 天空盒路径
    loadModel?: any | null // 加载单个模型指令
    loadModels?: {modelUrls: string[], scale: number} | null // 批量加载模型指令
    flyTo?: {position: THREE.Vector3, target: THREE.Vector3, duration?: number} | null // 相机飞行指令
  }>(),
  {
    skyBoxUrl: undefined,
    loadModels: null,
    loadModel: null,
    flyTo: null
  }
)

// 监听加载单个模型指令
watch(() => props.loadModel, async (config) => {
  if (config && scene.value) { // 确保场景初始化完成
    await loadModel(config).catch(console.error)
  }
})

// 监听批量加载模型指令
watch(() => props.loadModels, async (config) => {
  if (config && scene.value) { // 确保场景初始化完成
    await loadModels(config).catch(console.error)
    // 加载完成后为指定物体添加红色包围盒
    if (scene.value && loadedModelMaps.value) {
      addBoundingBoxesToObjects({
        scene: scene.value,
        objectNames: ['Cube109_1', 'Cube072'], // 指定要添加包围盒的物体名称
        loadedModelMaps: loadedModelMaps.value
      })
    }
  }
}, { immediate: true })

// 监听相机飞行指令
watch(() => props.flyTo, async (config) => {
  if (config && scene.value && camera.value) { // 确保场景和相机初始化完成
    await flyTo(config.position, config.target, config.duration).catch(console.error)
  }
})

onMounted(() => {
  if (!props.skyBoxUrl) {
    return
  }
  
  // 1、初始化场景
  initScene({ coordinateAxis: true, cameraPosition: new THREE.Vector3(-9, 5, -15) }) 
  // 2、加载天空盒
  loadEnvironment( props.skyBoxUrl, render ) 
  // 3、初始化键盘事件监听
  cleanupKeyboardEvents = initKeyboardEvents()
  // 4、初始化双击选中功能
  cleanupSelection = initDoubleClickSelection(
    {
      onSelect: (object) => {
        if (object) {
          console.log('🎉 双击选中了物体：', object.name)
          // 这里可以加你自己的逻辑：比如触发开门动画、弹出详情面板、跳转场景等
        } else {
          console.log('🗑️  取消选中')
        }
      },
      highlightEnabled: true // 开启蓝色高亮效果
    }
  )
  // 5、设置动画更新回调
  setAnimationUpdateCallback((deltaTime: number) => {
    updateAnimations(deltaTime, modelMixers.value)
    updateCharacterMovement({
      deltaTime, // ✅ 把外层的时间增量传入
      modelUrl: currentModelUrl.value, // ✅ 把外层的模型URL传入
      moveModel, // ✅ 把外层的移动模型的函数传入
      loadedModelMaps: loadedModelMaps.value // ✅ 把外层的模型Map传入
    })
    // 相机跟随人物
    if (currentModelUrl.value && camera.value) {
      cameraFollowModel( currentModelUrl.value, camera.value, cameraOffset )
    }
  })

  // 6、启动动画循环
  startAnimationLoop()
})

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize()
})

// 组件卸载时清理
onBeforeUnmount(() => {
  stopAnimationLoop()
  if (cleanupKeyboardEvents) {
    cleanupKeyboardEvents()
  }
  if (cleanupSelection) {
    cleanupSelection()
  }
})

// 暴露方法给父组件
defineExpose({
  loadModel,
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
