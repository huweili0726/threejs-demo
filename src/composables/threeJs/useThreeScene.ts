/**
 * 场景模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 * @description 场景模块，用于创建Three.js场景、相机、渲染器、轨道控制器、坐标轴辅助器、环境光、方向光
 */
import * as THREE from 'three'
import { shallowRef, onBeforeUnmount } from 'vue'
import { OrbitControls } from 'three-stdlib'
import { useWindowSize } from '@vueuse/core'

export function useThreeScene() {
  const { width, height } = useWindowSize()
  const scene = shallowRef<THREE.Scene>()
  const camera = shallowRef<THREE.PerspectiveCamera>()
  const renderer = shallowRef<THREE.WebGLRenderer>()
  const controls = shallowRef<OrbitControls>()
  let animationId: number | null = null
  const clock = new THREE.Clock()
  let animationUpdateCallback: ((deltaTime: number) => void) | null = null

  /**
   * 初始化场景
   * @description 初始化场景，包括场景、相机、渲染器、轨道控制器、坐标轴辅助器、环境光、方向光
   * @param options.coordinateAxis 是否添加坐标轴辅助器 【红色 对应 X 轴，绿色 对应 Y 轴，蓝色 对应 Z 轴】
   * @param options.cameraPosition 相机初始位置 【默认值：new THREE.Vector3(-9, 5, -15)】
   * @returns 场景实例
   */
  const initScene = (options: {
    container: any
    coordinateAxis?: boolean
    cameraPosition: THREE.Vector3
  }) => {
    const { container, coordinateAxis, cameraPosition } = options

    if (!container.value) return

    // 1. 创建Three.js主场景
    scene.value = new THREE.Scene()
    
    // 2. 创建透视相机
    // 参数说明：视野角度、宽高比、近裁剪面、远裁剪面
    camera.value = new THREE.PerspectiveCamera(45, width.value / height.value, 0.1, 90000)
    // 设置相机初始位置
    camera.value.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)

    // 3. 创建WebGL渲染器
    renderer.value = new THREE.WebGLRenderer({ 
      antialias: true,         // 开启抗锯齿
      alpha: true,             // 支持透明背景
      powerPreference: 'high-performance'  // 优先使用高性能GPU
    })
    // 设置渲染画布尺寸
    renderer.value.setSize(width.value, height.value)
    // 设置像素比，避免高分屏模糊，最高限制为2，平衡性能和画质
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // 设置色调映射为ACES电影级色调，提升画面真实感
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    // 曝光度，控制整体亮度
    renderer.value.toneMappingExposure = 1
    // 关闭阴影映射，提升性能（如果需要阴影效果可以开启）
    renderer.value.shadowMap.enabled = false
    // 设置输出颜色空间为sRGB，保证颜色显示正确
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    // 将渲染器的DOM元素添加到容器中
    container.value.appendChild(renderer.value.domElement)

    // 4. 创建轨道控制器，用于鼠标交互控制相机
    controls.value = new OrbitControls(camera.value, renderer.value.domElement)
    // 关闭阻尼效果（开启的话移动会有惯性平滑效果）
    controls.value.enableDamping = false
    // 阻尼系数，值越小平滑度越高
    controls.value.dampingFactor = 0.05
    // 关闭自动旋转
    controls.value.autoRotate = false
    // 自动旋转速度
    controls.value.autoRotateSpeed = 2
    // 开启平移功能
    controls.value.enablePan = true
    // 最小缩放距离（相机到目标点的最小距离）
    controls.value.minDistance = 1
    // 最大缩放距离（相机到目标点的最大距离）
    controls.value.maxDistance = 100
    // 最大极角（限制相机上下旋转角度，这里限制为90度，不能看到场景底部）
    controls.value.maxPolarAngle = Math.PI / 2
    // 更新控制器状态
    controls.value.update()
    // 控制器变化时触发重新渲染
    controls.value.addEventListener('change', render)

    // 5. 添加坐标轴辅助器（红色=X轴，绿色=Y轴，蓝色=Z轴）
    if(coordinateAxis){
      const axesHelper = new THREE.AxesHelper(50) // 50是轴的长度
      scene.value.add(axesHelper)
    }

    // 6. 添加环境光，均匀照亮场景所有物体
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5) // 参数：颜色，强度
    scene.value.add(ambientLight)

    // 7. 添加平行光，模拟太阳光效果，产生阴影
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1) // 参数：颜色，强度
    directionalLight.position.set(5, 10, 7) // 设置光源位置
    scene.value.add(directionalLight)
  }

  /**
   * 渲染场景
   * @description 渲染场景，包括场景、相机、渲染器
   */
  const render = () => {
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  /**
   * 处理窗口大小变化
   * @description 处理窗口大小变化，包括相机.aspect、相机.updateProjectionMatrix、渲染器.setSize、渲染场景
   */
  const onWindowResize = () => {
    if (camera.value && renderer.value) {
      camera.value.aspect = width.value / height.value
      camera.value.updateProjectionMatrix()
      renderer.value.setSize(width.value, height.value)
      render()
    }
  }

  /**
   * 相机平滑移动到指定位置
   * @description 相机平滑移动到指定位置，包括相机.position、控制器.target、渲染场景
   * @param targetPosition 目标位置
   * @param targetTarget 目标观察点
   * @param duration 动画持续时间（毫秒）
   * @returns 动画完成的Promise
   */
  const flyTo = (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration: number = 2000): Promise<void> => {
    return new Promise((resolve) => {
      if (!camera.value || !controls.value) {
        resolve()
        return
      }

      const startPosition = camera.value.position.clone()
      const startTarget = controls.value.target.clone()
      const startTime = performance.now()
      let flyAnimationId: number | null = null

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        // 更新相机位置
        camera.value!.position.lerpVectors(startPosition, targetPosition, easedProgress)
        // 更新控制器目标
        controls.value!.target.lerpVectors(startTarget, targetTarget, easedProgress)

        controls.value!.update()
        render()

        if (progress < 1) {
          flyAnimationId = requestAnimationFrame(animate)
        } else {
          if (flyAnimationId) {
            cancelAnimationFrame(flyAnimationId)
            flyAnimationId = null
          }
          resolve()
        }
      }

      flyAnimationId = requestAnimationFrame(animate)
    })
  }

  /**
   * 设置相机位置
   * @description 直接设置相机位置，适用于模型加载完毕后调整相机视角
   * @param position 相机位置
   * @param target 目标观察点（可选，默认为原点）
   */
  const setCameraPosition = (position: THREE.Vector3, target?: THREE.Vector3) => {
    if (!camera.value || !controls.value) return

    camera.value.position.set(position.x, position.y, position.z)
    
    if (target) {
      controls.value.target.set(target.x, target.y, target.z)
    }
    
    controls.value.update()
    render()
  }

  /**
   * 设置动画更新回调
   * @param callback 动画更新回调函数，接收deltaTime参数
   */
  const setAnimationUpdateCallback = (callback: (deltaTime: number) => void) => {
    animationUpdateCallback = callback
  }

  /**
   * 更新所有模型动画
   * @param deltaTime 时间增量（秒）
   * @param modelMixers 模型动画混合器Map集合
   */
  const updateAnimations = (deltaTime: number, modelMixers: Map<string, any>) => {
    modelMixers.forEach((mixer) => {
      mixer.update(deltaTime)
    })
  }

  /**
   * 启动动画循环
   */
  const startAnimationLoop = () => {
    // 防止重复启动
    if (animationId !== null) {
      return
    }

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const deltaTime = clock.getDelta()
      
      if (animationUpdateCallback) {
        animationUpdateCallback(deltaTime)
      }
      
      // 只有在场景、相机和渲染器都存在时才渲染
      if (scene.value && camera.value && renderer.value) {
        renderer.value.render(scene.value, camera.value)
      }
    }
    
    animate()
  }

  /**
   * 停止动画循环
   */
  const stopAnimationLoop = () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  onBeforeUnmount(() => {
    stopAnimationLoop()
    if (renderer.value) {
      renderer.value.dispose()
    }
  })

  return {
    scene,
    camera,
    renderer,
    controls,
    initScene,
    render,
    onWindowResize,
    flyTo,
    setCameraPosition,
    updateAnimations,
    setAnimationUpdateCallback,
    startAnimationLoop,
    stopAnimationLoop
  }
}

