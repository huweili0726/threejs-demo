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
import { useCollisionDetection } from '@/composables/threeJs/useCollisionDetection' // 碰撞检测相关Hooks
import { useObjectSelection } from '@/composables/threeJs/useObjectSelection' // 物体选择相关Hooks
import { useObjectPopup } from '@/composables/threeJs/useObjectPopup' // 物体弹窗相关Hooks
import { jsonUtils } from '@/utils/json' // JSON工具相关
import '@/assets/css/object-popup.css' // 弹窗样式

const threeJsContainer = ref<HTMLDivElement>()

const { scene, camera, initScene, render, flyTo, setAnimationUpdateCallback, startAnimationLoop, updateAnimations, stopAnimationLoop, onWindowResize } = useThreeScene(threeJsContainer)
const { isLoading, loadingText, loadedModelMaps, modelMixers, loadModel, loadModels, moveModel, cameraFollowModel } = useModelLoader(scene as any, render)
const { loadEnvironment } = useEnvironmentLoader(scene as any)
const { checkCollision, updateBoundingBoxes, setBoundingBoxesFromLoadResult, addCharacterBoundingBox } = useCollisionDetection() 
const { initKeyboardEvents, updateCharacterMovement } = useCharacterMovement( checkCollision, updateBoundingBoxes )
const { initDoubleClickSelection } = useObjectSelection(camera as any, scene as any)
const { initDoubleClickPopup, updateCSS2DRenderer, handleResize } = useObjectPopup(camera as any, scene as any, threeJsContainer)

const { getJsonFile } = jsonUtils()

// 控制变量
const peopleModelUrl = ref<string>('glb/man.glb') // 当前加载的人物模型URL
const cameraOffset = new THREE.Vector3(0, 0.1, -0.12) // 相机偏移量（在模型后方，稍微上方）
let cleanupKeyboardEvents: (() => void) | null = null // 清理键盘事件的函数
let cleanupSelection: (() => void) | null = null // 清理双击选中事件的函数
let cleanupPopup: (() => void) | null = null // 清理双击弹窗事件的函数

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

    // 为人物模型添加红色包围盒
    if (loadedModelMaps.value) {
      addCharacterBoundingBox({
        scene: scene.value,
        modelUrl: peopleModelUrl.value,
        loadedModelMaps: loadedModelMaps.value
      })
    }
  }
})

// 监听批量加载模型指令
watch(() => props.loadModels, async (config) => {
  if (config && scene.value) { // 确保场景初始化完成
    // 加载配置文件中的需要添加包围盒的物体名称
    let configJson = await getJsonFile(`${import.meta.env.BASE_URL}/config/wall.jsonc`)
    let _objectNames = configJson?.walls?.map((item: any) => item.name) || []

    // 加载模型并直接处理包围盒，避免重复遍历
    const boundingBoxes = await loadModels({
      ...config,
      collisionObjectNames: _objectNames
    }).catch(console.error)

    // 将从 loadModels 返回的包围盒信息设置到碰撞检测模块
    if (boundingBoxes && boundingBoxes.length > 0) {
      setBoundingBoxesFromLoadResult(boundingBoxes)
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

  // 5、初始化双击弹窗功能
  cleanupPopup = initDoubleClickPopup({
    getPopupData: (object: THREE.Object3D) => {
      // 根据物体名称返回弹窗数据
      if (object.name) {
        return {
          id: `popup-${Date.now()}`,
          title: object.name,
          content: [
            { name: '类型', value: object.type },
            { name: 'UUID', value: object.uuid.slice(0, 8) + '...' }
          ]
        }
      }
      return null
    }
  })
  
  // 6、设置动画更新回调
  setAnimationUpdateCallback((deltaTime: number) => {
    updateAnimations(deltaTime, modelMixers.value)
    updateCharacterMovement({
      deltaTime, // ✅ 把外层的时间增量传入
      modelUrl: peopleModelUrl.value, // ✅ 把外层的模型URL传入
      moveModel, // ✅ 把外层的移动模型的函数传入
      loadedModelMaps: loadedModelMaps.value // ✅ 把外层的模型Map传入
    })
    // 相机跟随人物
    if (peopleModelUrl.value && camera.value) {
      cameraFollowModel( peopleModelUrl.value, camera.value, cameraOffset )
    }
    // 更新 CSS2DRenderer
    updateCSS2DRenderer()
  })

  // 7、启动动画循环
  startAnimationLoop()
})

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize()
  // 更新 CSS2DRenderer
  if (threeJsContainer.value) {
    const { width, height } = threeJsContainer.value.getBoundingClientRect()
    handleResize(width, height)
  }
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
  if (cleanupPopup) {
    cleanupPopup()
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
