/**
 * Three.js 工具函数
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-22
 * @description Three.js 相关的工具函数，用于减少代码冗余，提高代码复用性
 */
import * as THREE from 'three'
import { useBasisStore } from '@/stores/basis'

/**
 * 计算两个点之间的距离
 * @param point1 第一个点
 * @param point2 第二个点
 * @returns 两点之间的距离
 */
export const calculateDistance = (point1: THREE.Vector3, point2: THREE.Vector3): number => {
  return point1.distanceTo(point2)
}

/**
 * 从对象创建包围盒
 * @param object 3D对象
 * @returns 包围盒
 */
export const createBoxFromObject = (object: THREE.Object3D): THREE.Box3 => {
  return new THREE.Box3().setFromObject(object)
}

/**
 * 获取模型的中心点
 * @param model 模型对象
 * @returns 模型的中心点
 */
export const getModelCenter = (model: THREE.Object3D): THREE.Vector3 => {
  const box = createBoxFromObject(model)
  const center = new THREE.Vector3()
  box.getCenter(center)
  return center
}

/**
 * 获取包围盒的中心点
 * @param box 包围盒对象
 * @returns 包围盒的中心点
 */
export const getBoxCenter = (box: THREE.Box3): THREE.Vector3 => {
  const center = new THREE.Vector3()
  box.getCenter(center)
  return center
}

/**
 * 控制相机切换到指定楼层
 * @param id 楼层ID
 * @param switchToFloor 切换楼层的函数
 */
export const toControlStartInspection = (id: string, switchToFloor: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void) => {
  const basisStore = useBasisStore()
  
  // 9楼
  if (id === '9') {
    const floor9Config = basisStore.floor9thConfig
    const perspective = floor9Config?.perspective || { x: 0, y: 0, z: 0 }
    const directionToLook = floor9Config?.directionToLook || { x: 0, y: 0, z: 0 }
    const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
    const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
    const duration = floor9Config?.durationTime || 2000 // 飞行时间
    const modelInitPosition = floor9Config?.characterModelSetPosition // 人物模型初始位置
    const onLookAt = floor9Config?.characterModelToLook // 人物模型看向-1楼1层入口处

    switchToFloor(targetPosition, targetTarget, duration, modelInitPosition as THREE.Vector3, onLookAt as THREE.Vector3)
  }
  // 8楼
  else if (id === '8') {
    const floor8Config = basisStore.floor8thConfig
    const perspective = floor8Config?.perspective || { x: 0, y: 0, z: 0 }
    const directionToLook = floor8Config?.directionToLook || { x: 0, y: 0, z: 0 }
    const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
    const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
    const duration = floor8Config?.durationTime || 2000 // 飞行时间
    const modelInitPosition = floor8Config?.characterModelSetPosition // 人物模型初始位置
    const onLookAt = floor8Config?.characterModelToLook // 人物模型看向-1楼1层入口处

    switchToFloor(targetPosition, targetTarget, duration, modelInitPosition as THREE.Vector3, onLookAt as THREE.Vector3)
  }
  // -1楼
  else if (id === '-1') {
    const neg1FloorConfig = basisStore.neg1FloorConfig
    const perspective = neg1FloorConfig?.perspective || { x: 0, y: 0, z: 0 }
    const directionToLook = neg1FloorConfig?.directionToLook || { x: 0, y: 0, z: 0 }
    const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
    const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
    const duration = neg1FloorConfig?.durationTime || 2000 // 飞行时间
    const modelInitPosition = neg1FloorConfig?.characterModelSetPosition // 人物模型初始位置
    const onLookAt = neg1FloorConfig?.characterModelToLook // 人物模型看向-1楼入口处

    switchToFloor(targetPosition, targetTarget, duration, modelInitPosition as THREE.Vector3, onLookAt as THREE.Vector3)
  }
}
