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
 * 获取模型的中心点
 * @param model 模型对象
 * @returns 模型的中心点
 */
export const getModelCenter = (model: THREE.Object3D): THREE.Vector3 => {
  const box = new THREE.Box3().setFromObject(model)
  const center = new THREE.Vector3()
  box.getCenter(center)
  return center
}
