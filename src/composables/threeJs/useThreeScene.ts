import { shallowRef, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import { useWindowSize } from '@vueuse/core'

export function useThreeScene(container: any) {
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
   * @returns 场景实例
   */
  const initScene = (options: {
    coordinateAxis?: boolean
  }) => {
    if (!container.value) return
    const { coordinateAxis } = options

    scene.value = new THREE.Scene()
    
    camera.value = new THREE.PerspectiveCamera(45, width.value / height.value, 0.1, 90000)
    camera.value.position.set(-9, 5, -15)

    renderer.value = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.value.setSize(width.value, height.value)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value.toneMapping = THREE.ACESFilmicToneMapping
    renderer.value.toneMappingExposure = 1
    renderer.value.shadowMap.enabled = false
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    container.value.appendChild(renderer.value.domElement)

    controls.value = new OrbitControls(camera.value, renderer.value.domElement)
    controls.value.enableDamping = false
    controls.value.dampingFactor = 0.05
    controls.value.autoRotate = false
    controls.value.autoRotateSpeed = 2
    controls.value.enablePan = true
    controls.value.minDistance = 1
    controls.value.maxDistance = 100
    controls.value.maxPolarAngle = Math.PI / 2
    controls.value.update()
    controls.value.addEventListener('change', render)

    // 添加坐标轴辅助器
    if(coordinateAxis){
      const axesHelper = new THREE.AxesHelper(50)
      scene.value.add(axesHelper)
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7)
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
          animationId = requestAnimationFrame(animate)
        } else {
          // if (animationId) {
          //   cancelAnimationFrame(animationId)
          //   animationId = null
          // }
          resolve()
        }
      }

      animationId = requestAnimationFrame(animate)
    })
  }

  /**
   * 设置动画更新回调
   * @param callback 动画更新回调函数，接收deltaTime参数
   */
  const setAnimationUpdateCallback = (callback: (deltaTime: number) => void) => {
    animationUpdateCallback = callback
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
      console.log(`animate更新`)
      animationId = requestAnimationFrame(animate)
      
      const deltaTime = clock.getDelta()
      
      if (animationUpdateCallback) {
        animationUpdateCallback(deltaTime)
      }
      
      render()
    }
    
    animate()
  }

  /**
   * 停止动画循环
   */
  const stopAnimationLoop = () => {
    // if (animationId !== null) {
    //   cancelAnimationFrame(animationId)
    //   animationId = null
    // }
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
    setAnimationUpdateCallback,
    startAnimationLoop,
    stopAnimationLoop
  }
}
