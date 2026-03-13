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
import { useBasisStore } from '@/stores/basis' // 基础配置 Store
import { jsonUtils } from '@/utils/json' // JSON工具相关
import '@/assets/css/object-popup.css' // 弹窗样式

const threeJsContainer = ref<HTMLDivElement>()
// json工具
const { getJsonFile } = jsonUtils()
// 获取窗口尺寸
const { width, height } = useWindowSize()

// 使用基础配置 Store
const basisStore = useBasisStore()

const { scene, camera, initScene, render, flyTo, setAnimationUpdateCallback, startAnimationLoop, updateAnimations, stopAnimationLoop, onWindowResize } = useThreeScene()
const { isLoading, loadingText, loadedModelMaps, modelMixers, loadModel, loadModels, moveModel, cameraFollowModel, removeModel } = useModelLoader(scene as any, render)
const { loadEnvironment } = useEnvironmentLoader(scene as any)
const { wallBoundingBoxes, checkCollision, updateBoundingBoxes, setBoundingBoxesFromLoadResult, addCharacterBoundingBox } = useCollisionDetection() 
const { initKeyboardEvents, updateCharacterMovement } = useCharacterMovement( checkCollision, updateBoundingBoxes )
const { initDoubleClickSelection } = useObjectSelection(camera as any, scene as any, threeJsContainer)
const { initDoubleClickPopup, showPopup, closePopup, updateCSS2DRenderer, handleResize } = useObjectPopup(camera as any, scene as any, threeJsContainer)
const { loadRoamConfig, initAutoRoam, startAutoRoam, pauseAutoRoam, resumeAutoRoam, stopAutoRoam, updateAutoRoam } = useAutoRoam(wallBoundingBoxes, showPopup, closePopup)

// 控制变量
const cameraOffset = new THREE.Vector3(0, 0.1, -0.12) // 相机偏移量（在模型后方，稍微上方）
let cleanupKeyboardEvents: (() => void) | null = null // 清理键盘事件的函数
let cleanupSelection: (() => void) | null = null // 清理双击选中事件的函数
let cleanupPopup: (() => void) | null = null // 清理双击弹窗事件的函数

// 配置数据
let wallConfig: any = null // 墙配置
let threeDimensionalConfig: any = null // 三维模型弹窗信息配置

// 监听窗口大小变化
watchEffect(() => {
  onWindowResize() // 窗口大小改变时更新相机和渲染器
  handleResize(width.value, height.value) // 更新 CSS2DRenderer
})

onMounted(async () => {
  wallConfig = await getJsonFile(`${import.meta.env.BASE_URL}/config/wall.jsonc`)
  threeDimensionalConfig = await getJsonFile(`${import.meta.env.BASE_URL}/config/threeDimensionalDev.jsonc`)

  // 【1、初始化场景（使用基础配置中的1楼视角）】
  const floor1Config = basisStore.floor1Config
  const perspective = floor1Config?.perspective || { x: -9, y: 5, z: -15 }
  const cameraPosition = new THREE.Vector3(perspective?.x || -9, perspective?.y || 5, perspective?.z || -15) 
  initScene({ container: threeJsContainer, coordinateAxis: true, cameraPosition: cameraPosition }) 

  // 【2、加载天空盒】
  loadEnvironment( basisStore.skyboxUrlConfig, render ) 
  // 【3、初始化键盘事件监听】
  cleanupKeyboardEvents = initKeyboardEvents()
  // 【4、初始化双击选中功能】
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

  // 【5、初始化双击弹窗功能】
  cleanupPopup = initDoubleClickPopup({
    // 弹窗数据获取函数 return的内容就是要显示在弹窗上的数据
    getPopupData: (object: THREE.Object3D) => {
      // 根据物体名称返回弹窗数据（渲染在弹窗里面的内容）
      if (object.name) {
        // 从配置文件中查找对应的弹窗数据
        const devItem = threeDimensionalConfig?.threeDevs?.find((item: any) => item.meshName === object.name)
        // 如果找到对应配置，返回弹窗数据
        if (devItem && devItem.popInfo) {
          return {
            id: `popup-${Date.now()}`,
            title: devItem.popInfo.title,
            content: devItem.popInfo.content
          }
        }
        // 如果没有找到对应配置，返回默认弹窗数据
        else{
          // 默认弹窗数据
          return {
            id: `popup-${Date.now()}`,
            title: object.name,
            content: [
              { name: '类型', value: object.type },
              { name: 'UUID', value: object.uuid.slice(0, 8) + '...' }
            ]
          }
        }
      }
      return null
    }
  })

  // 【6、加载模型和包围盒】
  // 加载配置文件中的需要添加包围盒的物体名称
  let _objectNames = wallConfig?.walls?.map((item: any) => item.name) || []
  // 加载模型并直接处理包围盒，避免重复遍历
  const boundingBoxes = await loadModels({
    ...{
      modelUrls: basisStore.modelUrlsConfig || [],
      scale: 1,
    },
    collisionObjectNames: _objectNames

  }).catch(console.error)
  // 将从 loadModels 返回的包围盒信息设置到碰撞检测模块
  if (boundingBoxes && boundingBoxes.length > 0) {
    setBoundingBoxesFromLoadResult(boundingBoxes)
  }

  // 【7、加载漫游配置并启动自动漫游】
  await loadRoamConfig()
  
  // 【8、设置动画更新回调】
  setAnimationUpdateCallback((deltaTime: number) => {
    updateAnimations(deltaTime, modelMixers.value)
    updateCharacterMovement({
      deltaTime, // ✅ 把外层的时间增量传入
      modelUrl: basisStore.characterModelUrlsConfig?.man || '', // ✅ 把外层的模型URL传入
      moveModel, // ✅ 把外层的移动模型的函数传入
      loadedModelMaps: loadedModelMaps.value // ✅ 把外层的模型Map传入
    })
    // 更新自动漫游
    updateAutoRoam(deltaTime)
    // 相机跟随人物
    if (basisStore.characterModelUrlsConfig?.man && camera.value) {
      cameraFollowModel( basisStore.characterModelUrlsConfig?.man, camera.value, cameraOffset )
    }
    // 更新 CSS2DRenderer
    updateCSS2DRenderer()
  })

  // 【9、启动动画循环】
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
  resumeAutoRoam
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
