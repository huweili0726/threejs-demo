/**
 * 3D物体选中模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 * @description 鼠标双击选中3D物体，支持高亮显示和选中回调
 */
import * as THREE from 'three'
import { ref, ShallowRef } from 'vue'
import { useRaycastUtils } from '@/composables/threeJs/useRaycastUtils'
import { useBasisStore } from '@/stores/basis'

// 初始化工具函数
const { performRaycast, filterIntersects } = useRaycastUtils()

export function useObjectSelection(
  camera: ShallowRef<THREE.PerspectiveCamera>, 
  scene: ShallowRef<THREE.Scene>, 
  container: ShallowRef<HTMLElement | undefined>, 
  switchToFloor: (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number, modelInitPosition: THREE.Vector3, onLookAt: THREE.Vector3) => void
) {
  // 初始化基础状态
  const basisStore = useBasisStore()

  // 当前选中的物体
  const selectedObject = ref<THREE.Object3D | null>(null)
  // 存储选中物体原始的材质，用于恢复
  const originalMaterial = ref<THREE.Material | THREE.Material[] | null>(null)
  // 选中高亮颜色（蓝色）
  const highlightColor: any = new THREE.Color(0x00a0c6)

  // 存储所有创建的楼名标签
  interface BuildNameLabel {
    sprite: THREE.Sprite
    position: THREE.Vector3
  }
  const buildNameLabels = ref<BuildNameLabel[]>([])

  // 复用对象，避免每次双击创建新对象提升性能
  const worldPos = new THREE.Vector3()

  /**
   * 初始化双击事件监听
   * @param options 配置项
   * @param options.onSelect 选中后的回调函数，返回选中的物体
   * @param options.highlightEnabled 是否开启高亮效果，默认true
   * @returns 清理函数
   */
  const initDoubleClickSelection = (
    options: {
      onSelect?: (object: THREE.Object3D | null) => void
      highlightEnabled?: boolean
    }
  ) => {
    const { onSelect, highlightEnabled = true } = options

    // 双击事件处理函数
    const handleDoubleClick = (event: MouseEvent) => {
      // 校验依赖项：确保scene、camera已初始化
      if (!camera.value || !scene.value) return

      // 使用工具函数进行射线检测
      const intersects = performRaycast(camera, scene, container, event)

      if (intersects && intersects.length > 0) {
        // 使用工具函数过滤射线检测结果（默认过滤 BoxHelper、Box3Helper 和 CSS2DObject）
        const filteredIntersects = filterIntersects(intersects)

        if (filteredIntersects.length > 0) {
          // 获取第一个交点的物体（最接近相机的最细分子物体）
          let intersectedObject = filteredIntersects[0].object
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

  /**
   * 创建楼顶的楼名备注
   * @param x X坐标
   * @param y Y坐标
   * @param z Z坐标
   * @param name 楼名
   * @param scene 场景对象
   * @param id 楼ID
   * @param type 类型（可选）
   */
  const createBuildName = (x: number, y: number, z: number, name: string, scene: THREE.Scene, id: number, type?: string) => {
    // 创建画布来生成精灵纹理
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return
    
    // 考虑设备像素比，提高画布分辨率
    const dpr = window.devicePixelRatio || 1
    const canvasWidth = 200 * dpr
    const canvasHeight = 50 * dpr
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    // 缩放上下文以适应高DPI屏幕
    context.scale(dpr, dpr)
    
    // 绘制背景
    const gradient = context.createLinearGradient(0, 0, 200, 50)
    gradient.addColorStop(0, '#002fffff')   
    gradient.addColorStop(1, '#002fffff')
    context.fillStyle = gradient
    context.roundRect(0, 0, 200, 50, 8)
    context.fill()
    
    // 绘制边框
    context.strokeStyle = '#64ffda'
    context.lineWidth = 2
    context.roundRect(2, 2, 196, 46, 6)
    context.stroke()
    
    // 绘制文字
    context.fillStyle = '#64ffda'
    context.font = 'bold 18px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(name, 100, 25)
    
    // 创建纹理并设置过滤方式以提高清晰度
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    
    // 创建精灵材质
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.1
    })
    
    // 创建精灵
    const sprite = new THREE.Sprite(material)
    sprite.position.set(x, y, z)
    sprite.scale.set(1.5, 0.4, 1) // 调整精灵大小
    
    // 添加到场景
    scene.add(sprite)
    
    // 为精灵添加点击事件
    sprite.userData = { id }

    // 存储标签信息
    buildNameLabels.value.push({
      sprite,
      position: new THREE.Vector3(x, y, z)
    })
  }

  /**
   * 显示所有楼名标签
   */
  const showBuildNames = () => {
    buildNameLabels.value.forEach(label => {
      if (label) {
        label.sprite.visible = true
      }
    })
  }

  /**
   * 隐藏所有楼名标签
   */
  const hideBuildNames = () => {
    buildNameLabels.value.forEach(label => {
      if (label) {
        label.sprite.visible = false
      }
    })
  }

  /**
   * 初始化鼠标悬停事件，实现鼠标移动到精灵上时变成小手
   */
  const initHoverEvent = (
    options: {
      onMouseEnter?: (object: THREE.Object3D | null) => void,
      onMouseLeave?: (object: THREE.Object3D | null) => void
    }
  ) => {
    const { onMouseEnter, onMouseLeave } = options

    // 鼠标移动事件处理函数
    const handleMouseMove = (event: MouseEvent) => {
      // 校验依赖项：确保scene、camera已初始化
      if (!camera.value || !scene.value) return

      // 使用工具函数进行射线检测
      const intersects = performRaycast(camera, scene, container, event)

      if (intersects && intersects.length > 0) {
        // 使用工具函数过滤射线检测结果（默认过滤 BoxHelper、Box3Helper 和 CSS2DObject）
        const filteredIntersects = filterIntersects(intersects)
        if (filteredIntersects.length > 0) {
          // 获取第一个交点的物体（最接近相机的最细分子物体）
          let intersectedObject = filteredIntersects[0].object
          let targetObject: THREE.Object3D | null = intersectedObject

          // 处理精灵模型鼠标悬浮事件
          if (targetObject instanceof THREE.Sprite) {
            if (onMouseEnter) {
              onMouseEnter(targetObject)
            }
          }else{
            if (onMouseLeave) {
              onMouseLeave(targetObject)
            }
          }
        }
      }
    }

    // 监听鼠标移动
    window.addEventListener('mousemove', handleMouseMove)

    // 返回清理函数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }

  return {
    selectedObject,
    initDoubleClickSelection,
    clearSelection,
    createBuildName,
    showBuildNames,
    hideBuildNames,
    initHoverEvent
  }
}
