/**
 * 3D物体选中模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 * @description 鼠标双击选中3D物体，支持高亮显示和选中回调
 */
import { ref } from 'vue'
import * as THREE from 'three'

export function useObjectSelection() {
  // 当前选中的物体
  const selectedObject = ref<THREE.Object3D | null>(null)
  // 存储选中物体原始的材质，用于恢复
  const originalMaterial = ref<THREE.Material | THREE.Material[] | null>(null)
  // 选中高亮颜色（蓝色）
  const highlightColor: any = new THREE.Color(0x00a0c6)

  // 复用对象，避免每次双击创建新对象提升性能
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const worldPos = new THREE.Vector3()

  /**
   * 初始化双击事件监听
   * @param options.camera 相机对象
   * @param options.scene 场景对象
   * @param options.onSelect 选中后的回调函数，返回选中的物体
   * @param options.highlightEnabled 是否开启高亮效果，默认true
   * @returns 清理函数
   */
  const initDoubleClickSelection = (
    options: {
      camera: THREE.PerspectiveCamera,
      scene: THREE.Scene,
      onSelect?: (object: THREE.Object3D | null) => void
      highlightEnabled?: boolean
    }
  ) => {
    const { camera, scene, onSelect, highlightEnabled = true } = options

    const handleDoubleClick = (event: MouseEvent) => {
      // 校验依赖项：确保scene、camera已初始化
      if (!camera || !scene) return

      // 关键：更新相机和场景的世界矩阵（漫游后必加）
      camera.updateMatrixWorld(true)
      scene.updateMatrixWorld(true)

      // 计算鼠标在画布内的相对位置（排除容器偏移）
      const renderer = scene.children.find(child => child.type === 'WebGLRenderer') as any
      const canvas = renderer ? renderer.domElement : document.querySelector('canvas')
      const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 更新射线投射器
      raycaster.setFromCamera(mouse, camera)

      // 检测射线与场景中模型的交点，递归检测子物体
      const intersects = raycaster.intersectObjects(scene.children, true)

      if (intersects && intersects.length > 0) {
        // 打印所有交点信息，帮助调试
        console.log('🔍 射线检测到的所有物体：', intersects.map(intersect => ({
          name: intersect.object.name,
          type: intersect.object.type,
          depth: intersect.distance,
          uuid: intersect.object.uuid,
          parentName: intersect.object.parent ? intersect.object.parent.name : 'root'
        })))

        // 获取第一个交点的物体（最接近相机的最细分子物体）
        let intersectedObject = intersects[0].object
        let targetObject: THREE.Object3D | null = intersectedObject
        console.log('🎯 选中子物体：', intersectedObject.name, '类型：', intersectedObject.type)

        if (targetObject && targetObject instanceof THREE.Mesh) {
          // 判断：如果点击的是已经高亮的模型，则取消高亮
          if (selectedObject.value === targetObject) {
            // 恢复原始材质
            if (originalMaterial.value) {
              (targetObject as THREE.Mesh).material = originalMaterial.value
            }
            // 重置高亮状态
            selectedObject.value = null
            originalMaterial.value = null
            if (onSelect) {
              onSelect(null)
            }
          } else {
            // 如果有其他高亮模型，先恢复其原始材质
            if (selectedObject.value && originalMaterial.value && (selectedObject.value as THREE.Mesh).isMesh) {
              (selectedObject.value as THREE.Mesh).material = originalMaterial.value
            }

            // 只有开启高亮时才修改材质
            if (highlightEnabled) {
              // 记录当前模型的原始材质，并设置高亮材质
              originalMaterial.value = targetObject.material.clone()
              
              // 设置高亮材质
              if (targetObject.material instanceof THREE.MeshStandardMaterial) {
                targetObject.material = new THREE.MeshStandardMaterial({
                  ...targetObject.material,
                  emissive: highlightColor,
                  emissiveIntensity: 0.6,
                  metalness: Math.max(targetObject.material.metalness || 0, 0.6),
                  roughness: Math.min(targetObject.material.roughness || 1, 0.4)
                })
              } else {
                // 对于其他材质类型，只修改自发光
                targetObject.material = targetObject.material.clone()
                if ('emissive' in targetObject.material) {
                  (targetObject.material as any).emissive = highlightColor
                  (targetObject.material as any).emissiveIntensity = 0.6
                }
              }
            }

            // 获取世界坐标
            targetObject.getWorldPosition(worldPos)

            // 存储新选中的物体
            selectedObject.value = targetObject

            // 触发选中回调
            if (onSelect) {
              onSelect(targetObject)
            }

            // 打印物体信息
            console.log('✅ 双击选中模型信息：', targetObject)
            console.log(`模型坐标：X=${worldPos.x}, Y=${worldPos.y}, Z=${worldPos.z}`)
            console.log('模型详细信息：', {
              name: targetObject.name,
              uuid: targetObject.uuid,
              position: worldPos,
              rotation: targetObject.rotation,
              scale: targetObject.scale,
              userData: targetObject.userData,
              material: targetObject.material.type
            })
          }

          return
        }
      }

      // 点击空白处取消选中
      if (selectedObject.value && originalMaterial.value && (selectedObject.value as THREE.Mesh).isMesh) {
        (selectedObject.value as THREE.Mesh).material = originalMaterial.value
        selectedObject.value = null
        originalMaterial.value = null
        if (onSelect) {
          onSelect(null)
        }
      }
    }

    // 监听双击事件
    window.addEventListener('dblclick', handleDoubleClick)

    // 返回清理函数
    return () => {
      window.removeEventListener('dblclick', handleDoubleClick)
      clearSelection()
    }
  }

  // 清理选中状态
  const clearSelection = () => {
    if (selectedObject.value && originalMaterial.value) {
      if ((selectedObject.value as THREE.Mesh).isMesh) {
        (selectedObject.value as THREE.Mesh).material = originalMaterial.value
      }
      selectedObject.value = null
      originalMaterial.value = null
    }
  }

  return {
    selectedObject,
    initDoubleClickSelection,
    clearSelection
  }
}
