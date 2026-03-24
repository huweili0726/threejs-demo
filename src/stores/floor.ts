/**
 * 楼层管理 Store
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-24
 * @description 管理楼层切换相关的状态和方法
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as THREE from 'three'

export const useFloorStore = defineStore('floor', () => {
  // 回调函数引用
  const hideBuildNamesCallback = ref<(() => void) | null>(null)
  const switchToFloorCallback = ref<((targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void) | null>(null)
  const toAddCharacterBoundingBoxCallback = ref<(() => void) | null>(null)

  // 注册回调函数
  const registerCallbacks = (
    hideBuildNames: () => void,
    switchToFloor: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void,
    toAddCharacterBoundingBox: () => void
  ) => {
    hideBuildNamesCallback.value = hideBuildNames
    switchToFloorCallback.value = switchToFloor
    toAddCharacterBoundingBoxCallback.value = toAddCharacterBoundingBox
  }

  // 执行楼层切换
  const toTargetFloor = (
    targetPosition: THREE.Vector3,
    targetTarget: THREE.Vector3,
    duration: number = 2000,
    modelInitPosition?: { x: number, y: number, z: number },
    onLookAt?: { x: number, y: number, z: number }
  ) => {
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

  return {
    registerCallbacks,
    toTargetFloor
  }
})
