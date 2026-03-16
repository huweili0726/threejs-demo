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
import { onBeforeUnmount, ref, watchEffect, onMounted } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useThreeScene } from '@/composables/threeJs/useThreeScene' // 场景相关Hooks
import { useModelLoader } from '@/composables/threeJs/useModelLoader' // 模型加载相关Hooks
import { useEnvironmentLoader } from '@/composables/threeJs/useEnvironmentLoader' // 环境贴图加载相关Hooks
import { useCharacterMovement } from '@/composables/threeJs/useCharacterMovement' // 人物移动控制相关Hooks
import { useCollisionDetection } from '@/composables/threeJs/useCollisionDetection' // 碰撞检测相关Hooks
import { useObjectSelection } from '@/composables/threeJs/useObjectSelection' // 物体选择相关Hooks
import { useObjectPopup } from '@/composables/threeJs/useObjectPopup' // 物体弹窗相关Hooks
import { useAutoRoam } from '@/composables/threeJs/useAutoRoam' // 自动漫游相关Hooks
import { useProximityPopup } from '@/composables/threeJs/useProximityPopup' // 接近弹窗相关Hooks
import { useBasisStore } from '@/stores/basis' // 基础配置 Store
import { useFloorSwitch } from '@/composables/threeJs/useFloorSwitch' // 楼层切换相关Hooks
import '@/assets/css/object-popup.css' // 弹窗样式

const threeJsContainer = ref<HTMLDivElement>()
// 获取窗口尺寸
const { width, height } = useWindowSize()

// 使用基础配置 Store
const basisStore = useBasisStore()

const { scene, camera, initScene, render, flyTo, setAnimationUpdateCallback, startAnimationLoop, updateAnimations, stopAnimationLoop, onWindowResize } = useThreeScene() // 场景相关Hooks
const { isLoading, loadingText, loadedModelMaps, modelMixers, loadModel, loadModels, moveModel, cameraFollowModel, removeModel } = useModelLoader(scene as any, render) // 模型加载相关Hooks
const { loadEnvironment } = useEnvironmentLoader(scene as any) // 环境贴图加载相关Hooks
const { initDoubleClickSelection } = useObjectSelection(camera as any, scene as any, threeJsContainer) // 物体选择相关Hooks
const { initDoubleClickPopup, showPopup, closePopup, updateCSS2DRenderer, handleResize } = useObjectPopup(camera as any, scene as any, threeJsContainer) // 物体弹窗相关Hooks

const { switchToFloor, toControlCommandRoom } = useFloorSwitch(flyTo, loadModel as any, removeModel) // 楼层切换相关Hooks 
const { wallBoundingBoxes, checkCollision, updateBoundingBoxes, setBoundingBoxesFromLoadResult, addCharacterBoundingBox } = useCollisionDetection() // 碰撞检测相关Hooks
const { updateProximityPopups } = useProximityPopup(showPopup, closePopup, toControlCommandRoom) // 使用接近弹窗模块（统一管理弹窗逻辑）
const { initKeyboardEvents, updateCharacterMovement } = useCharacterMovement( checkCollision, updateBoundingBoxes, wallBoundingBoxes, updateProximityPopups) // 人物移动控制相关Hooks
const { initAutoRoam, startAutoRoam, pauseAutoRoam, resumeAutoRoam, stopAutoRoam, updateAutoRoam } = useAutoRoam(wallBoundingBoxes, updateProximityPopups) // 自动漫游相关Hooks

// 控制变量
const cameraOffset = new THREE.Vector3(0, 0.1, -0.12) // 相机偏移量（在模型后方，稍微上方）
let cleanupKeyboardEvents: (() => void) | null = null // 清理键盘事件的函数
let cleanupSelection: (() => void) | null = null // 清理双击选中事件的函数
let cleanupPopup: (() => void) | null = null // 清理双击弹窗事件的函数

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize() // 窗口大小改变时更新相机和渲染器
  handleResize(width.value, height.value) // 更新 CSS2DRenderer
})

// ==================== 初始化函数 ====================

/**
 * 初始化场景
 */
const initSceneAndEnvironment = () => {
  const floor1Config = basisStore.floor1Config
  const perspective = floor1Config?.perspective || { x: -9, y: 5, z: -15 }
  const cameraPosition = new THREE.Vector3(perspective?.x || -9, perspective?.y || 5, perspective?.z || -15)
  initScene({ container: threeJsContainer, coordinateAxis: true, cameraPosition: cameraPosition })
  
  // 加载环境贴图
  loadEnvironment(basisStore.skyboxUrlConfig, render)
}

/**
 * 初始化交互功能
 */
const initInteractions = () => {
  // 键盘 wasd 控制人物移动
  cleanupKeyboardEvents = initKeyboardEvents()
  // 初始化双击选中功能
  cleanupSelection = initDoubleClickSelection({
    onSelect: (object) => {
      if (object) {
        console.log('🎉 双击选中了物体：', object.name)
      } else {
        console.log('🗑️  取消选中')
      }
    },
    highlightEnabled: true
  })
  // 初始化双击弹窗功能
  cleanupPopup = initDoubleClickPopup({
    getPopupData: (object: THREE.Object3D) => {
      if (object.name) {
        const devItem = basisStore.threeDevConfig?.threeDevs?.find((item: any) => item.meshName === object.name)
        if (devItem && devItem.popInfo) {
          return {
            id: `popup-${Date.now()}`,
            title: devItem.popInfo.title,
            content: devItem.popInfo.content
          }
        }
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
}

/**
 * 加载模型和碰撞包围盒
 */
const loadSceneModels = async () => {
  const _collisionObjects = basisStore.wallsConfig || []
  const boundingBoxes = await loadModels({
    modelUrls: basisStore.modelUrlsConfig || [],
    scale: 1,
    collisionObjects: _collisionObjects
  }).catch(console.error)

  if (boundingBoxes && boundingBoxes.length > 0) {
    setBoundingBoxesFromLoadResult(boundingBoxes, scene.value)
  }
}

/**
 * 设置动画循环回调
 */
const setupAnimationLoop = () => {
  setAnimationUpdateCallback((deltaTime: number) => {
    updateAnimations(deltaTime, modelMixers.value)
    updateCharacterMovement({
      deltaTime,
      modelUrl: basisStore.characterModelUrlsConfig?.man || '',
      moveModel,
      loadedModelMaps: loadedModelMaps.value
    })
    updateAutoRoam(deltaTime)
    if (basisStore.characterModelUrlsConfig?.man && camera.value) {
      cameraFollowModel(basisStore.characterModelUrlsConfig?.man, camera.value, cameraOffset)
    }
    updateCSS2DRenderer()
  })
}

// ==================== 主入口 ====================

onMounted(async () => {
  // 1. 初始化场景和环境
  initSceneAndEnvironment()

  // 2. 初始化交互功能 【键盘 wasd 控制人物移动 + 双击选中功能 + 双击弹窗功能】
  initInteractions()

  // 3. 加载模型和碰撞包围盒
  await loadSceneModels()

  // 4. 设置动画循环
  setupAnimationLoop()

  // 5. 启动动画循环
  startAnimationLoop()
})

// 为人物模型添加碰撞检测包围盒
const toAddCharacterBoundingBox = () => {
  if (scene.value) {
    addCharacterBoundingBox({
      scene: scene.value,
      modelUrl: basisStore.characterModelUrlsConfig?.man || '',
      loadedModelMaps: loadedModelMaps.value
    })
  }
}

// 加载人物模型并启动自动漫游
const loadCharacterModelAndStartRoam = async () => {
  try {
    // 获取加载的模型
    const model = loadedModelMaps.value.get(basisStore.characterModelUrlsConfig?.man || '')
    
    if (model && scene.value) {
      // 初始化自动漫游
      initAutoRoam(model)
      console.log('✅ 人物模型加载完成并启动自动漫游')
    }
  } catch (error) {
    console.error('❌ 加载人物模型或启动自动漫游失败：', error)
  }
}

// 快速导航到指定房间
const toRoom = async (value: any) => {
  const quickNavConfig = basisStore.quickNavigation || {}
  const roomName = value 

  // 检查配置是否已加载
  if (!quickNavConfig || Object.keys(quickNavConfig).length === 0) {
    console.log("快速导航配置未加载，自动漫游未启动")
    return
  }
  
  // 获取漫游路径点
  const roamPoints = quickNavConfig[roomName]?.points || []
  if (roamPoints.length > 0) {
    // 确保人物模型已加载并初始化自动漫游
    const model = loadedModelMaps.value.get(basisStore.characterModelUrlsConfig?.man || '')
    if (model) {
      initAutoRoam(model)
      startAutoRoam(roamPoints)
    } else {
      console.log("人物模型未加载，自动漫游未启动")
    }
  } else {
    console.log("未获取到有效的漫游点，自动漫游未启动")
  }
}

// 组件卸载时清理
onBeforeUnmount(() => {
  stopAnimationLoop()
  // 清理键盘事件监听
  if (cleanupKeyboardEvents) {
    cleanupKeyboardEvents()
  }
  // 清理双击选中功能
  if (cleanupSelection) {
    cleanupSelection()
  }
  // 清理双击弹窗功能
  if (cleanupPopup) {
    cleanupPopup()
  }
})

// 暴露方法给父组件
defineExpose({
  loadModel,
  flyTo,  
  removeModel,
  loadCharacterModelAndStartRoam,
  startAutoRoam,
  stopAutoRoam,
  toAddCharacterBoundingBox,
  pauseAutoRoam,
  resumeAutoRoam,
  switchToFloor,
  toRoom
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
