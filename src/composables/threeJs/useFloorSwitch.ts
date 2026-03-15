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

    // 2、视角飞转到目标位置
    await flyTo(targetPosition, targetTarget, duration)

    // 3、重新加载人物模型
    await loadModel({
      modelUrl: characterModelUrl,
      scale: 0.0005,
      modelInitPosition: modelInitPosition || { x: 0, y: 0, z: 0 },
      onLookAt: onLookAt || { x: 0, y: 0, z: 0 },
      frontAxis: new THREE.Vector3(0, 0, 1),
    })?.catch(console.error)
  }

  return {
    switchToFloor
  }
}