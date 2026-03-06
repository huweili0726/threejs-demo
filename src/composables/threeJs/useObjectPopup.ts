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

export function useObjectPopup(
  camera: ShallowRef<THREE.PerspectiveCamera>,
  scene: ShallowRef<THREE.Scene>,
  container: ShallowRef<HTMLElement | undefined>
) {
  // CSS2D 渲染器
  let labelRenderer: CSS2DRenderer | null = null
  // 当前显示的弹窗
  const currentPopup = ref<CSS2DObject | null>(null)
  // 当前弹窗附加的物体
  const currentObject = ref<THREE.Object3D | null>(null)

  // 复用对象，避免每次双击创建新对象提升性能
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

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
        <div class="dev-title">${data.title}<button class="devPop-close-btn" data-type="close-btn" onclick="closePopBtn('${data.id}')"></button></div>
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

    // 先关闭之前的弹窗
    closePopup()

    // 创建弹窗元素
    const popupElement = createPopupElement(data)

    // 创建 CSS2DObject
    const label = new CSS2DObject(popupElement)
    
    // 计算物体的包围盒
    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    box.getSize(size)
    
    // 设置弹窗位置：在物体中心上方
    const popupOffset = size.y * 0.5 // 弹窗高度基于物体大小
    label.position.set(0, size.y * 0.5 + popupOffset, 0)
    
    // 将弹窗作为物体的子对象添加
    // 这样弹窗会继承物体的变换（位置、旋转、缩放）
    object.add(label)
    
    // 存储当前弹窗和物体
    currentPopup.value = label
    currentObject.value = object
    
    console.log('📌 显示弹窗:', data.title, '附加到:', object.name)
  }

  /**
   * 关闭弹窗
   */
  const closePopup = () => {
    if (currentPopup.value) {
      // 从父对象中移除弹窗
      if (currentPopup.value.parent) {
        currentPopup.value.parent.remove(currentPopup.value)
      }
      currentPopup.value = null
      currentObject.value = null
      console.log('❌ 关闭弹窗')
    }
  }

  /**
   * 全局关闭弹窗函数（供 HTML onclick 调用）
   * @param id 弹窗 ID
   */
  const closePopBtn = (id: string) => {
    if (currentPopup.value && currentPopup.value.userData.popId === id) {
      closePopup()
    }
  }

  // 将关闭函数挂载到 window 对象，供 HTML onclick 调用
  if (typeof window !== 'undefined') {
    (window as any).closePopBtn = closePopBtn
  }

  /**
   * 初始化双击弹窗事件
   * @param options 配置项
   * @param options.getPopupData 根据选中物体获取弹窗数据的回调函数
   * @param options.filterObject 过滤物体的回调函数，返回 true 表示可以弹出弹窗
   * @returns 清理函数
   */
  const initDoubleClickPopup = (options: {
    getPopupData?: (object: THREE.Object3D) => PopupData | null
    filterObject?: (object: THREE.Object3D) => boolean
  }) => {
    const { getPopupData, filterObject } = options

    // 初始化 CSS2DRenderer
    initCSS2DRenderer()

    // 双击事件处理函数
    const handleDoubleClick = (event: MouseEvent) => {
      // 校验依赖项：确保 scene、camera 已初始化
      if (!camera.value || !scene.value) return

      // 更新相机和场景的世界矩阵
      camera.value.updateMatrixWorld(true)
      scene.value.updateMatrixWorld(true)

      // 计算鼠标在画布内的相对位置
      const canvas = container.value?.querySelector('canvas')
      const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // 更新射线投射器
      raycaster.setFromCamera(mouse, camera.value)

      // 检测射线与场景中模型的交点
      const intersects = raycaster.intersectObjects(scene.value.children, true)

      if (intersects && intersects.length > 0) {
        // 过滤掉包围盒辅助对象和 CSS2DObject
        const filteredIntersects = intersects.filter(
          (intersect) =>
            intersect.object.type !== 'BoxHelper' &&
            intersect.object.type !== 'CSS2DObject'
        )

        if (filteredIntersects.length > 0) {
          // 获取第一个交点的物体
          const intersectedObject = filteredIntersects[0].object

          // 如果有过滤函数，先进行过滤
          if (filterObject && !filterObject(intersectedObject)) {
            return
          }

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
    currentPopup,
    currentObject,
    initDoubleClickPopup,
    showPopup,
    closePopup,
    updateCSS2DRenderer,
    handleResize
  }
}
