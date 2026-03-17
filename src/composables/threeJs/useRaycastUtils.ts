/**
 * 射线检测工具函数模块 
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-07
 * @description 提供 Three.js 相关的射线检测工具函数
 */
import * as THREE from 'three'
import { ShallowRef } from 'vue'

/**
 * 射线检测工具函数 Hook
 * @returns 工具函数集合
 */
export function useRaycastUtils() {
  /**
   * 射线检测工具函数
   * @param camera 相机
   * @param scene 场景
   * @param container 容器元素
   * @param event 鼠标事件
   * @returns 射线检测结果
   */
  const performRaycast = (
    camera: ShallowRef<THREE.PerspectiveCamera>,
    scene: ShallowRef<THREE.Scene>,
    container: ShallowRef<HTMLElement | undefined>,
    event: MouseEvent
  ): THREE.Intersection[] => {
    // 校验依赖项
    if (!camera.value || !scene.value) {
      return []
    }

    // 复用对象，避免每次创建新对象
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // 关键：更新相机和场景的世界矩阵（漫游后必加）
    camera.value.updateMatrixWorld(true)
    scene.value.updateMatrixWorld(true)

    // 计算鼠标在画布内的相对位置（排除容器偏移）
    const canvas = container.value?.querySelector('canvas') || document.querySelector('canvas')
    const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 更新射线投射器
    raycaster.setFromCamera(mouse, camera.value)

    // 检测射线与场景中模型的交点，递归检测子物体
    const intersects = raycaster.intersectObjects(scene.value.children, true)

    return intersects
  }

  /**
   * 过滤射线检测结果
   * @param intersects 射线检测结果
   * @param filterTypes 要过滤的物体类型数组
   * @returns 过滤后的射线检测结果
   */
  const filterIntersects = (
    intersects: THREE.Intersection[],
    // filterTypes: string[] = ['BoxHelper', 'Box3Helper', 'CSS2DObject']
    filterTypes: string[] = ['BoxHelper', 'Box3Helper', 'CSS2DObject', 'AxesHelper']
  ): THREE.Intersection[] => {
    return intersects.filter(
      (intersect) => !filterTypes.includes(intersect.object.type)
    )
  }

  return {
    performRaycast,
    filterIntersects
  }
}
