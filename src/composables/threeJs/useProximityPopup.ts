/**
 * 接近弹窗模块
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-15
 * @description 处理基于距离的弹窗逻辑，当人物接近物体时自动显示弹窗
 */
import * as THREE from 'three'
import { ref } from 'vue'
import { useBasisStore } from '@/stores/basis'

// 碰撞体接口
interface WallBoundingBox {
  box: THREE.Box3
  selectMode: {
    name: string
    uuid: string
  }
  isStairs?: boolean
}

// 弹窗数据接口
interface PopupData {
  id: string
  title: string
  content: Array<{ name: string; value: string }>
  type?: 'confirm' | 'info'
  onConfirm?: () => void
}

// 碰撞检测结果接口
interface CollisionResult {
  flag: boolean
  boxes: Array<{ box: WallBoundingBox; distance: number }>
  farBoxes: Array<{ box: WallBoundingBox; distance: number }>
  distance: number
  isApproaching: boolean
  isLeaving: boolean
  isFullyLeft: boolean
}

export function useProximityPopup(
  showPopup: (data: PopupData, object: THREE.Object3D) => void,
  closePopup: (id?: string) => void,
  onConfirm?: () => void
) {
  const basisStore = useBasisStore()

  // 记录与碰撞体的上一帧距离
  const lastWallDistances = new Map<string, number>()
  // 记录当前显示弹窗的物体
  const visiblePopupObjects = ref<Set<string>>(new Set())

  /**
   * 碰撞检测（到达某个模型附近，自动弹窗）
   * @param options.characterBox 人物的包围盒
   * @param options.wallBoundingBoxes 墙体的包围盒数组
   * @returns 碰撞检测结果
   */
  const isCloseToCollision = (options: { 
    characterBox: THREE.Box3; 
    wallBoundingBoxes: WallBoundingBox[] 
  }): CollisionResult => {
    const threshold = 0.3
    const farThreshold = 0.35
    const result: CollisionResult = {
      flag: false,
      boxes: [],
      farBoxes: [],
      distance: Infinity,
      isApproaching: false,
      isLeaving: false,
      isFullyLeft: false
    }
    const { characterBox, wallBoundingBoxes } = options

    if (!wallBoundingBoxes || wallBoundingBoxes.length === 0) {
      console.log('⚠️  wallBoundingBoxes 为空，无法进行碰撞检测')
      return result
    }

    for (const wallBox of wallBoundingBoxes) {
      const wallCenter = new THREE.Vector3()
      wallBox.box.getCenter(wallCenter)
      const characterCenter = new THREE.Vector3()
      characterBox.getCenter(characterCenter)
      const currentDistance = characterCenter.distanceTo(wallCenter)

      const wallKey = `${wallBox.selectMode.name}_${wallBox.selectMode.uuid}`

      if (currentDistance < threshold) {
        result.flag = true
        result.boxes.push({ box: wallBox, distance: currentDistance })
      } else if (currentDistance > farThreshold) {
        result.farBoxes.push({ box: wallBox, distance: currentDistance })
      }

      lastWallDistances.set(wallKey, currentDistance)
    }

    return result
  }

  /**
   * 更新接近弹窗
   * @param options.model 人物模型
   * @param options.wallBoundingBoxes 墙体包围盒数组
   * @param options.onlyShowUpDownStairsPopup 仅显示上楼梯/下楼梯弹窗的标志
   */
  const updateProximityPopups = (options: { 
      model: THREE.Group; 
      wallBoundingBoxes: WallBoundingBox[],
      onlyShowUpDownStairsPopup?: boolean, 
    }) => {
    const { model, wallBoundingBoxes, onlyShowUpDownStairsPopup } = options

    if (!model || !wallBoundingBoxes || !showPopup || !closePopup) {
      return
    }

    const characterBox = new THREE.Box3().setFromObject(model)
    const collisionResult = isCloseToCollision({ characterBox: characterBox, wallBoundingBoxes: wallBoundingBoxes })

    const currentCloseObjects = new Set<string>()
    const currentFarObjects = new Set<string>()

    if (collisionResult.flag && model.parent) {
      for (const item of collisionResult.boxes) {
        const wallBox = item.box
        const objectUuid = wallBox.selectMode.uuid

        currentCloseObjects.add(objectUuid)

        const targetObject = model.parent.getObjectByProperty('uuid', objectUuid)
        if (targetObject) {
          let popupData: PopupData

          if (onlyShowUpDownStairsPopup) {
            // onlyShowUpDownStairsPopup = true 时，只显示楼梯弹窗
            if (wallBox.isStairs) {
              popupData = {
                id: `popup-${objectUuid}`,
                title: '系统提示',
                content: [
                  { name: '提示', value: '是否上二楼？' }
                ],
                type: 'confirm',
                onConfirm: onConfirm
              }
              showPopup(popupData, targetObject)
            }
          } else {
            // onlyShowUpDownStairsPopup = false 时，只显示普通物体弹窗
            if (!wallBox.isStairs) {
              // 查找匹配的三维设备配置
              const threeDev = basisStore.threeDevs.find(dev => dev.meshName === wallBox.selectMode.name)
              
              // 只有当找到匹配的配置且有 popInfo 时才显示弹窗
              if (threeDev && threeDev.popInfo) {
                popupData = {
                  id: `popup-${objectUuid}`,
                  title: threeDev.popInfo.title,
                  content: threeDev.popInfo.content
                }
                showPopup(popupData, targetObject)
              }
            }
          }
        }
      }
    }

    if (collisionResult.farBoxes.length > 0) {
      for (const item of collisionResult.farBoxes) {
        const objectUuid = item.box.selectMode.uuid
        currentFarObjects.add(objectUuid)
      }
    }

    if (closePopup) {
      currentFarObjects.forEach(uuid => {
        closePopup(`popup-${uuid}`)
      })
    }

    visiblePopupObjects.value = currentCloseObjects
  }

  return {
    visiblePopupObjects,
    updateProximityPopups
  }
}