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

   // 注册回调函数
  const registerCallbacks = (
    switchToFloor: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void,
    toAddCharacterBoundingBox: () => void,
    showPipelines: () => void,
    hideBuildNames: () => void,
    showBuildNames: () => void,
    recoveryPipelines: () => void,
    flyTo: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number) => void,
    updateModelVisibilityByFloor: (floor: string) => void
  ) => {
    switchToFloorCallback.value = switchToFloor
    toAddCharacterBoundingBoxCallback.value = toAddCharacterBoundingBox
    showPipelinesCallback.value = showPipelines
    hideBuildNamesCallback.value = hideBuildNames
    showBuildNamesCallback.value = showBuildNames
    recoveryPipelinesCallback.value = recoveryPipelines
    flyToCallback.value = flyTo
    updateModelVisibilityByFloorCallback.value = updateModelVisibilityByFloor
  }

  // 执行楼层切换
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

  // 突出显示管路
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

  // 恢复突出显示管路
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

  return {
    registerCallbacks,
    toTargetFloor,
    handleShowPipelines,
    handleRecoveryPipelines
  }
})
