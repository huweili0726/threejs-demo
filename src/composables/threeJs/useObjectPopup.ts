/**
 * 3D物体弹窗模块
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-06
 * @description 使用 CSS2DRenderer 在双击物体时弹出 HTML 弹窗，弹窗会随物体移动和缩放
 */
import * as THREE from 'three'
import { ref, ShallowRef } from 'vue'
import { CSS2DRenderer, CSS2DObject } from 'three-stdlib'
import { useRaycastUtils } from '@/composables/threeJs/useRaycastUtils'

// 初始化工具函数
const { performRaycast, filterIntersects } = useRaycastUtils()

// 弹窗内容项接口
interface PopupContentItem {
  name: string
  value: string
}

// 弹窗数据接口
interface PopupData {
  id: string
  title: string
  content: PopupContentItem[]
}

// 单个弹窗实例接口
interface PopupInstance {
  label: CSS2DObject
  object: THREE.Object3D
}

export function useObjectPopup(
  camera: ShallowRef<THREE.PerspectiveCamera>,
  scene: ShallowRef<THREE.Scene>,
  container: ShallowRef<HTMLElement | undefined>
) {
  // CSS2D 渲染器
  let labelRenderer: CSS2DRenderer | null = null
  // 所有显示的弹窗列表
  const popups = ref<PopupInstance[]>([])

  /**
   * 初始化 CSS2DRenderer
   * @description 创建 CSS2DRenderer 用于渲染 HTML 弹窗
   */
  const initCSS2DRenderer = () => {
    if (!container.value) return

    // 创建 CSS2DRenderer
    labelRenderer = new CSS2DRenderer()
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0px'
    labelRenderer.domElement.style.pointerEvents = 'none'

    // 添加到容器
    container.value.appendChild(labelRenderer.domElement)

    console.log('✅ CSS2DRenderer 初始化完成')
  }

  /**
   * 创建弹窗 HTML 元素
   * @param data 弹窗数据
   * @returns HTMLDivElement
   */
  const createPopupElement = (data: PopupData): HTMLDivElement => {
    const div = document.createElement('div')
    div.id = data.id
    div.className = 'three-pop'

    // 构建弹窗 HTML 内容
    let htmlContent = `
      <div class="dev-info-div">
        <div class="dev-title">${data.title}<button class="devPop-close-btn" data-type="close-btn" onclick="closePopup('${data.id}')"></button></div>
        <div class="dev-content">
    `

    // 添加内容项
    data.content.forEach((item) => {
      htmlContent += `<div class="dev-params"><span>${item.name}:</span><span title="${item.value}">${item.value}</span></div>`
    })

    htmlContent += `</div><div class="dev-bottom"></div></div>`

    div.innerHTML = htmlContent

    return div
  }

  /**
   * 显示弹窗
   * @param data 弹窗数据
   * @param object 要附加的物体
   */
  const showPopup = (data: PopupData, object: THREE.Object3D) => {
    if (!scene.value) return

    // 检查是否已在该物体上显示过弹窗（使用uuid确保唯一性）
    const existingPopup = popups.value.find(p => p.object.uuid === object.uuid)
    if (existingPopup) {
      console.log('⚠️ 该物体已显示弹窗:', data.title)
      return
    }

    // 创建弹窗元素
    const popupElement = createPopupElement(data)

    // 创建 CSS2DObject
    const label = new CSS2DObject(popupElement)
    
    // 设置弹窗ID到userData，用于关闭时识别
    label.userData.popId = data.id
    label.name = data.id
    
    // 计算物体的中心点
    const box = new THREE.Box3().setFromObject(object)
    const center = new THREE.Vector3()
    box.getCenter(center)
    
    // 转换中心点到物体的局部坐标系
    object.worldToLocal(center)
    
    // 设置弹窗位置：在物体中心上方固定距离
    label.position.set(center.x, center.y, center.z)
    
    // 将弹窗作为物体的子对象添加
    // 这样弹窗会继承物体的变换（位置、旋转、缩放）
    object.add(label)
    
    // 添加到弹窗列表
    popups.value.push({
      label,
      object
    })
    
    console.log('📌 显示弹窗:', data.title, '附加到:', object.name, '当前弹窗数:', popups.value.length)
  }

  /**
   * 关闭指定ID的弹窗
   * @param id 弹窗 ID
   */
  const closePopup = (id?: string) => {
    if (!id) {
      // 关闭所有弹窗
      popups.value.forEach(popup => {
        if (popup.label.parent) {
          popup.label.parent.remove(popup.label)
        }
      })
      popups.value = []
      console.log('❌ 关闭所有弹窗')
      return
    }

    // 关闭指定ID的弹窗
    const index = popups.value.findIndex(p => p.label.userData.popId === id)
    if (index !== -1) {
      const popup = popups.value[index]
      if (popup.label.parent) {
        popup.label.parent.remove(popup.label)
      }
      popups.value.splice(index, 1)
      console.log('❌ 关闭弹窗:', id, '剩余弹窗数:', popups.value.length)
    }
  }

  // 将关闭函数挂载到 window 对象，供 HTML onclick 调用
  if (typeof window !== 'undefined') {
    (window as any).closePopup = closePopup
  }

  /**
   * 初始化双击弹窗事件
   * @param options 配置项
   * @param options.getPopupData 根据选中物体获取弹窗数据的回调函数
   * @returns 清理函数
   */
  const initDoubleClickPopup = (options: {
    getPopupData?: (object: THREE.Object3D) => PopupData | null
  }) => {
    const { getPopupData } = options

    // 初始化 CSS2DRenderer
    initCSS2DRenderer()

    // 双击事件处理函数
    const handleDoubleClick = (event: MouseEvent) => {
      // 校验依赖项：确保 scene、camera 已初始化
      if (!camera.value || !scene.value) return

      // 使用工具函数进行射线检测
      const intersects = performRaycast(camera, scene, container, event)

      if (intersects && intersects.length > 0) {
        // 使用工具函数过滤射线检测结果
        const filteredIntersects = filterIntersects(intersects)

        if (filteredIntersects.length > 0) {
          // 获取第一个交点的物体
          const intersectedObject = filteredIntersects[0].object

          console.log('🎯 双击选中物体:', intersectedObject.name, '类型:', intersectedObject.type)

          // 获取弹窗数据
          if (getPopupData) {
            const popupData = getPopupData(intersectedObject)
            if (popupData) {
              showPopup(popupData, intersectedObject)
            }
          } else {
            // 默认弹窗数据
            const defaultData: PopupData = {
              id: `popup-${Date.now()}`,
              title: intersectedObject.name || '未命名物体',
              content: [
                { name: '类型', value: intersectedObject.type },
                { name: 'UUID', value: intersectedObject.uuid.slice(0, 8) + '...' }
              ]
            }
            showPopup(defaultData, intersectedObject)
          }
        }
      }
    }

    // 添加双击事件监听
    const canvas = container.value?.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('dblclick', handleDoubleClick)
      console.log('✅ 双击弹窗事件监听已添加')
    }

    // 返回清理函数
    return () => {
      if (canvas) {
        canvas.removeEventListener('dblclick', handleDoubleClick)
      }
      closePopup()
      if (labelRenderer && container.value) {
        container.value.removeChild(labelRenderer.domElement)
        labelRenderer = null
      }
    }
  }

  /**
   * 更新 CSS2DRenderer（需要在动画循环中调用）
   */
  const updateCSS2DRenderer = () => {
    if (labelRenderer && camera.value && scene.value) {
      labelRenderer.render(scene.value, camera.value)
    }
  }

  /**
   * 窗口大小改变时更新 CSS2DRenderer
   */
  const handleResize = (width: number, height: number) => {
    if (labelRenderer) {
      labelRenderer.setSize(width, height)
    }
  }

  return {
    popups,
    initDoubleClickPopup,
    showPopup,
    closePopup,
    updateCSS2DRenderer,
    handleResize
  }
}
