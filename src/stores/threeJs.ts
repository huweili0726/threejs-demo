/**
 * threeJs管理 Store
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-24
 * @description 管理threeJs相关状态和方法
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as THREE from 'three'
import { useBasisStore } from '@/stores/basis'

export const useThreeJsStore = defineStore('threeJs', () => {
  const basisStore = useBasisStore()

  // 回调函数引用
  const switchToFloorCallback = ref<((targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void) | null>(null)
  const toAddCharacterBoundingBoxCallback = ref<(() => void) | null>(null)
  const showPipelinesCallback = ref<(() => void) | null>(null)
  const hideBuildNamesCallback = ref<(() => void) | null>(null)
  const showBuildNamesCallback = ref<(() => void) | null>(null)
  const recoveryPipelinesCallback = ref<(() => void) | null>(null)
  const flyToCallback = ref<((targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number) => void) | null>(null)
  const updateModelVisibilityByFloorCallback = ref<((floor: string) => void) | null>(null)
  const removeModelCallback = ref<((model: string) => void) | null>(null)
  const loadCharacterModelAndStartRoamCallback = ref<(() => void) | null>(null)
  const startAutoRoamCallback = ref<(() => void) | null>(null)
  const pauseAutoRoamCallback = ref<(() => void) | null>(null)
  const resumeAutoRoamCallback = ref<(() => void) | null>(null)
  const stopAutoRoamCallback = ref<(() => void) | null>(null)
  const toRoomCallback = ref<((targetRoom: string) => void) | null>(null)
  
  // 注册回调函数
  const registerCallbacks = (
    switchToFloor: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void,
    toAddCharacterBoundingBox: () => void,
    showPipelines: () => void,
    hideBuildNames: () => void,
    showBuildNames: () => void,
    recoveryPipelines: () => void,
    flyTo: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number) => void,
    updateModelVisibilityByFloor: (floor: string) => void,
    removeModel: (model: string) => void,
    loadCharacterModelAndStartRoam: () => void,
    startAutoRoam: () => void,
    pauseAutoRoam: () => void,
    resumeAutoRoam: () => void,
    stopAutoRoam: () => void,
    toRoom: (targetRoom: string) => void
  ) => {
    switchToFloorCallback.value = switchToFloor
    toAddCharacterBoundingBoxCallback.value = toAddCharacterBoundingBox
    showPipelinesCallback.value = showPipelines
    hideBuildNamesCallback.value = hideBuildNames
    showBuildNamesCallback.value = showBuildNames
    recoveryPipelinesCallback.value = recoveryPipelines
    flyToCallback.value = flyTo
    updateModelVisibilityByFloorCallback.value = updateModelVisibilityByFloor,
    removeModelCallback.value = removeModel,
    loadCharacterModelAndStartRoamCallback.value = loadCharacterModelAndStartRoam,
    startAutoRoamCallback.value = startAutoRoam,
    pauseAutoRoamCallback.value = pauseAutoRoam,
    resumeAutoRoamCallback.value = resumeAutoRoam,
    stopAutoRoamCallback.value = stopAutoRoam,
    toRoomCallback.value = toRoom
  }

  // 执行楼层切换细节
  const toTargetFloor = (options: {
    targetPosition: THREE.Vector3,
    targetTarget: THREE.Vector3,
    duration: number,
    modelInitPosition?: { x: number, y: number, z: number },
    onLookAt?: { x: number, y: number, z: number }
  }) => {
    const { targetPosition, targetTarget, duration = 2000, modelInitPosition, onLookAt } = options
    
    // 8、9、-1楼精灵模型title隐藏
    if (hideBuildNamesCallback.value) hideBuildNamesCallback.value()
    // 飞往指定楼层 （剔除已经存在的人物模型 + 视角飞行 + 重新加载人物模型并设定初始位置和看向位置）
    if (switchToFloorCallback.value) {
      switchToFloorCallback.value(
        targetPosition,
        targetTarget,
        duration,
        modelInitPosition ? new THREE.Vector3(modelInitPosition.x, modelInitPosition.y, modelInitPosition.z) : new THREE.Vector3(),
        onLookAt ? new THREE.Vector3(onLookAt.x, onLookAt.y, onLookAt.z) : new THREE.Vector3()
      )
    }
    // 添加包围盒
    if (toAddCharacterBoundingBoxCallback.value) toAddCharacterBoundingBoxCallback.value()
  }

  /**
   * 切换楼层 + 更新模型可见性
   * @param floor 目标楼层
   */
  const toFloor = (floor: string) => {
    // 存储当前楼层到Pinia
    basisStore.setCurrentFloor(floor)

    let targetPosition = new THREE.Vector3()
    let targetTarget = new THREE.Vector3()
    let duration = 0
    let modelInitPosition = undefined
    let onLookAt = undefined

    // 切换模型
    if (floor === '0') {
      const floor1Config = basisStore.floor1Config
      const perspective = floor1Config?.perspective || { x: 0, y: 0, z: 0 }
      const directionToLook = floor1Config?.directionToLook || { x: 0, y: 0, z: 0 }
      const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
      const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
      const duration = floor1Config?.durationTime || 2000 // 飞行时间
      if (showBuildNamesCallback.value) showBuildNamesCallback.value()
      // 移除上一个楼层的人物模型
      if (removeModelCallback.value) removeModelCallback.value(basisStore.characterModelUrlsConfig?.man || '')
      if (flyToCallback.value) flyToCallback.value(targetPosition, targetTarget, duration)
    } else {
      if (floor === '-1') {
        const floorNeg1Config = basisStore.neg1FloorConfig
        const perspective = floorNeg1Config?.perspective || { x: 0, y: 0, z: 0 }
        const directionToLook = floorNeg1Config?.directionToLook || { x: 0, y: 0, z: 0 }
        targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
        targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
        duration = floorNeg1Config?.durationTime || 2000 // 飞行时间
        modelInitPosition = floorNeg1Config?.characterModelSetPosition // 人物模型初始位置
        onLookAt = floorNeg1Config?.characterModelToLook // 人物模型看向-1楼入口处
      } else if (floor === '-1_2') {
        const neg12LayersFloorConfig = basisStore.neg12LayersFloorConfig
        const perspective = neg12LayersFloorConfig?.perspective || { x: 0, y: 0, z: 0 }
        const directionToLook = neg12LayersFloorConfig?.directionToLook || { x: 0, y: 0, z: 0 }
        targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
        targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
        duration = neg12LayersFloorConfig?.durationTime || 2000 // 飞行时间
        modelInitPosition = neg12LayersFloorConfig?.characterModelSetPosition // 人物模型初始位置
        onLookAt = neg12LayersFloorConfig?.characterModelToLook // 人物模型看向-1楼2层入口处
      } else if (floor === '-1_1') {
        const beforeNeg12LayersFloorConfig = basisStore.beforeNeg12LayersFloorConfig
        const perspective = beforeNeg12LayersFloorConfig?.perspective || { x: 0, y: 0, z: 0 }
        const directionToLook = beforeNeg12LayersFloorConfig?.directionToLook || { x: 0, y: 0, z: 0 }
        targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
        targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
        duration = beforeNeg12LayersFloorConfig?.durationTime || 2000 // 飞行时间
        modelInitPosition = beforeNeg12LayersFloorConfig?.characterModelSetPosition // 人物模型初始位置
        onLookAt = beforeNeg12LayersFloorConfig?.characterModelToLook // 人物模型看向-1楼1层入口处
      } else if (floor === '9') {
        const floor9Config = basisStore.floor9thConfig
        const perspective = floor9Config?.perspective || { x: 0, y: 0, z: 0 }
        const directionToLook = floor9Config?.directionToLook || { x: 0, y: 0, z: 0 }
        targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
        targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
        duration = floor9Config?.durationTime || 2000 // 飞行时间
        modelInitPosition = floor9Config?.characterModelSetPosition // 人物模型初始位置
        onLookAt = floor9Config?.characterModelToLook // 人物模型看向-1楼1层入口处
      } else if (floor === '8') {
        const floor8Config = basisStore.floor8thConfig
        const perspective = floor8Config?.perspective || { x: 0, y: 0, z: 0 }
        const directionToLook = floor8Config?.directionToLook || { x: 0, y: 0, z: 0 }
        targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
        targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
        duration = floor8Config?.durationTime || 2000 // 飞行时间
        modelInitPosition = floor8Config?.characterModelSetPosition // 人物模型初始位置
        onLookAt = floor8Config?.characterModelToLook // 人物模型看向-1楼1层入口处  
      }

      // 切换楼层
      toTargetFloor({
        targetPosition: targetPosition, 
        targetTarget: targetTarget, 
        duration: duration, 
        modelInitPosition: modelInitPosition, 
        onLookAt: onLookAt
      })
    }

    // 更新模型可见性
    if (updateModelVisibilityByFloorCallback.value) updateModelVisibilityByFloorCallback.value(floor)
  }

  /**
   * 突出显示管路
   */
  const handleShowPipelines = () => {
    // 更新模型可见性
    if (updateModelVisibilityByFloorCallback.value) updateModelVisibilityByFloorCallback.value('-1')

    if (showPipelinesCallback.value) showPipelinesCallback.value()
    if (hideBuildNamesCallback.value) hideBuildNamesCallback.value() // 隐藏建筑名称

    // 飞行到管路位置
    const LineConfigFromBasis = basisStore.lineConfigFromBasis
    const perspective = LineConfigFromBasis?.perspective || { x: 0, y: 0, z: 0 }
    const directionToLook = LineConfigFromBasis?.directionToLook || { x: 0, y: 0, z: 0 }
    const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
    const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
    const durationTime = LineConfigFromBasis?.durationTime || 2000
    if (flyToCallback.value) flyToCallback.value(targetPosition, targetTarget, durationTime)
  }

  /**
   * 恢复突出显示管路
   */
  const handleRecoveryPipelines = () => {
    // 更新模型可见性
    if (updateModelVisibilityByFloorCallback.value) updateModelVisibilityByFloorCallback.value('0')

    if (recoveryPipelinesCallback.value) recoveryPipelinesCallback.value()
    if (showBuildNamesCallback.value) showBuildNamesCallback.value() // 显示建筑名称

    // 飞行到大楼初始位置
    const floor1Config = basisStore.floor1Config
    const perspective = floor1Config?.perspective || { x: 0, y: 0, z: 0 }
    const directionToLook = floor1Config?.directionToLook || { x: 0, y: 0, z: 0 }
    const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
    const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
    const durationTime = floor1Config?.durationTime || 2000
    if (flyToCallback.value) flyToCallback.value(targetPosition, targetTarget, durationTime)
  }

  /**
   * 开始漫游
   */
  const handleStartAutoRoam = () => {
    if (loadCharacterModelAndStartRoamCallback.value) loadCharacterModelAndStartRoamCallback.value()
    if (startAutoRoamCallback.value) startAutoRoamCallback.value()
  }

  /**
   * 暂停漫游
   */
  const handlePauseAutoRoam = () => {
    if (pauseAutoRoamCallback.value) pauseAutoRoamCallback.value()
  }

  /**
   * 继续漫游
   */
  const handleResumeAutoRoam = () => {
    if (resumeAutoRoamCallback.value) resumeAutoRoamCallback.value()
  }

  /**
   * 停止漫游
   */
  const handleStopAutoRoam = () => {
    if (stopAutoRoamCallback.value) stopAutoRoamCallback.value()
  }

  /**
   * 快速导航到指定房间
   * @param targetRoom 目标房间的UUID
   */
  const toTargetRoom = (targetRoom: string) => {
    if (toRoomCallback.value) toRoomCallback.value(targetRoom)
  }

  return {
    registerCallbacks,
    toTargetFloor,
    handleShowPipelines,
    handleRecoveryPipelines,
    toFloor,
    handleStartAutoRoam,
    handlePauseAutoRoam,
    handleResumeAutoRoam,
    handleStopAutoRoam,
    toTargetRoom  
  }
})
