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

  /**
   * 初始化场景
   * @returns 场景实例
   */
  const initScene = () => {
    if (!container.value) return

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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7)
    scene.value.add(directionalLight)
  }

  /**
   * 渲染场景
   */
  const render = () => {
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  /**
   * 处理窗口大小变化
   */
  const onWindowResize = () => {
    if (camera.value && renderer.value) {
      camera.value.aspect = width.value / height.value
      camera.value.updateProjectionMatrix()
      renderer.value.setSize(width.value, height.value)
      render()
    }
  }

  onBeforeUnmount(() => {
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
    onWindowResize
  }
}
