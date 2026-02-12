<template>
  <div class="threeJs-container" ref="threeJsContainer">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount, watchEffect } from 'vue'
import * as THREE from 'three'
import { jsonUtils } from '@/utils/json'
import { useWindowSize } from '@vueuse/core'
import { RGBELoader, GLTFLoader, DRACOLoader, OrbitControls } from 'three-stdlib'

const { width, height } = useWindowSize() // 获取窗口宽度和高度
const threeJsContainer = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let isLoading = ref(false)
let loadingText = ref('正在加载场景...')
// 新增：用于记录加载开始时间（改用performance API）
let modelLoadStartTime: number = 0

const props = withDefaults(
  defineProps<{
    modelConfig?: string  // 模型配置文件路径
  }>(),
  {
    modelConfig: undefined
  }
)

onMounted(async () => {
  if (props.modelConfig) {
    isLoading.value = true
    loadingText.value = '正在加载配置文件...'
    let mapOptions: any = await getJsonFile(props.modelConfig)
    let modelUrl: string = mapOptions.models.find((item: any) => item.homeShow === true)?.url
    let skyBoxUrl: string = mapOptions.skybox?.url
    initThree({ modelUrl: modelUrl, skyBoxUrl: skyBoxUrl })
  }
})

onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose()
  }
})

/**
 * 初始化Three.js场景
 * @param options 初始化选项
 * @param options.modelUrl 模型路径
 * @param options.skyBoxUrl 天空盒路径
 */
const initThree = (options: { modelUrl: string, skyBoxUrl: string }) => {
  const { modelUrl, skyBoxUrl } = options
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(75, width.value / height.value, 0.1, 1000)
  camera.position.set(0, 5, 10)

  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(width.value, height.value)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = false
  renderer.outputColorSpace = THREE.SRGBColorSpace
  threeJsContainer.value?.appendChild(renderer.domElement)

  loadingText.value = '正在加载环境贴图...'
  const rgbeLoader = new RGBELoader()
  rgbeLoader.load(`${import.meta.env.BASE_URL}/${skyBoxUrl}`, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
    scene.background = texture
    scene.environment = texture
    render()
  }, (xhr) => {
    const progress = Math.round((xhr.loaded / xhr.total) * 100)
    loadingText.value = `正在加载环境贴图... ${progress}%`
  })

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = false // 移除阻尼效果
  controls.dampingFactor = 0.05
  controls.autoRotate = false
  controls.autoRotateSpeed = 2
  controls.enablePan = true
  controls.minDistance = 1
  controls.maxDistance = 100
  controls.maxPolarAngle = Math.PI / 2
  controls.update()
  controls.addEventListener('change', render)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  loadingText.value = '正在加载3D模型...'
  // 关键修改：使用performance.now()记录高精度开始时间
  modelLoadStartTime = performance.now()
  
  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}/draco/`)
  gltfLoader.setDRACOLoader(dracoLoader)
  gltfLoader.load(`${import.meta.env.BASE_URL}/${modelUrl}`, (gltf) => {
    const model = gltf.scene
    // 强制 Three.js 模型的所有网格始终渲染且仅渲染正面，
    // 修复外部模型导入后因视锥体剔除、法线 / 材质设置异常导致的渲染消失或面显示异常问题
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = false
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.Material) {
                mat.side = THREE.FrontSide
                mat.needsUpdate = true
              }
            })
          } else if (child.material instanceof THREE.Material) {
            child.material.side = THREE.FrontSide
            child.material.needsUpdate = true
          }
        }
      }
    })
    scene.add(model)
    render()
    
    // 关键修改：使用performance.now()计算高精度耗时
    const modelLoadEndTime = performance.now()
    const totalLoadTime = modelLoadEndTime - modelLoadStartTime
    // 输出高精度耗时（保留3位小数，体现微秒级精度）
    console.log(`模型加载并渲染完成总耗时：${totalLoadTime.toFixed(3)} 毫秒 (${(totalLoadTime / 1000).toFixed(3)} 秒)`)
    
    isLoading.value = false
  }, (xhr) => {
    const progress = Math.round((xhr.loaded / xhr.total) * 100)
    loadingText.value = `正在加载3D模型... ${progress}%`
  }, (error) => {
    console.error('模型加载失败:', error)
    loadingText.value = '模型加载失败'
    setTimeout(() => {
      isLoading.value = false
    }, 2000)
  })

  // 响应式更新
  watchEffect(() => {
    onWindowResize();
  })

  // 渲染场景
  render()
}

const render = () => {
  renderer.render(scene, camera)
}

const onWindowResize = () => {
  camera.aspect = width.value / height.value
  camera.updateProjectionMatrix()
  renderer.setSize(width.value, height.value)
  render()
}

const { getJsonFile } = jsonUtils()
</script>

<style scoped lang="less">
.threeJs-container {
  width: 100vw;
  height: 100vh;
  position: relative;

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 5px solid rgba(100, 255, 218, 0.3);
      border-top: 5px solid #64ffda;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    .loading-text {
      color: #64ffda;
      font-size: 16px;
      font-weight: 500;
      text-align: center;
      max-width: 80%;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>