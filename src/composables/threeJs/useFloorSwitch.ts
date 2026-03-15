/**
 * 楼层切换模块
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-14
 * @description 处理楼层切换逻辑，包括模型加载和视角切换
 */
import * as THREE from 'three'
import { useBasisStore } from '@/stores/basis'

export function useFloorSwitch(
  flyTo: (position: THREE.Vector3, target: THREE.Vector3, duration: number) => Promise<void>,
  loadModel: (options: any) => Promise<THREE.Object3D | undefined>,
  removeModel: (modelUrl: string) => void
) {
  const basisStore = useBasisStore()
  /**
   * 切换到指定楼层
   * @param targetPosition 目标相机位置
   * @param targetTarget 目标相机看向点
   * @param duration 飞行时间
   * @param modelInitPosition 人物模型初始位置
   * @param onLookAt 人物模型看向点
   */
  const switchToFloor = async (
    targetPosition: THREE.Vector3,
    targetTarget: THREE.Vector3,
    duration: number = 2000,
    modelInitPosition?: { x: number; y: number; z: number },
    onLookAt?: { x: number; y: number; z: number }
  ) => {
    const characterModelUrl = basisStore.characterModelUrlsConfig?.man || ''
    
    // 1、先移除人物模型
    removeModel(characterModelUrl)

    // 2、并行执行视角飞转和模型加载
    await Promise.all([
      // 视角飞转到目标位置
      flyTo(targetPosition, targetTarget, duration),
      // 重新加载人物模型
      loadModel({
        modelUrl: characterModelUrl,
        scale: 0.0005,
        modelInitPosition: modelInitPosition || { x: 0, y: 0, z: 0 },
        onLookAt: onLookAt || { x: 0, y: 0, z: 0 },
        frontAxis: new THREE.Vector3(0, 0, 1),
      })?.catch(console.error)
    ])
  }

  /**
   * 楼梯确认回调函数 - 切换到-1楼2层视角
   * 当用户确认上楼时，切换到二楼视角
   */
  const toControlCommandRoom = async () => {
    const neg12LayersFloorConfig = basisStore.neg12LayersFloorConfig
    const perspective = neg12LayersFloorConfig?.perspective || { x: 0, y: 0, z: 0 }
    const directionToLook = neg12LayersFloorConfig?.directionToLook || { x: 0, y: 0, z: 0 }
    const targetPosition = new THREE.Vector3(perspective?.x || 0, perspective?.y || 0, perspective?.z || 0)
    const targetTarget = new THREE.Vector3(directionToLook?.x || 0, directionToLook?.y || 0, directionToLook?.z || 0)
    const duration = neg12LayersFloorConfig?.durationTime || 2000 // 飞行时间
    const modelInitPosition = neg12LayersFloorConfig?.characterModelSetPosition // 人物模型初始位置
    const onLookAt = neg12LayersFloorConfig?.characterModelToLook // 人物模型看向-1楼2层入口处

    await switchToFloor(
      targetPosition,
      targetTarget,
      duration,
      modelInitPosition,
      onLookAt
    )
  }

  return {
    switchToFloor,
    toControlCommandRoom
  }
}