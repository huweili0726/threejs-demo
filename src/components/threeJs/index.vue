<template>
  <div class="threeJs-container" ref="threeJsContainer" />
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'
import { OrbitControls } from 'three-stdlib'
import { GLTFLoader } from 'three-stdlib'
import { DRACOLoader } from 'three-stdlib'

const threeJsContainer = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls

onMounted(() => {
  initThree()
})

onBeforeUnmount(() => {
  if (renderer) {
    renderer.dispose()
  }
})

function initThree() {
  const width = window.innerWidth
  const height = window.innerHeight

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 5, 10)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  threeJsContainer.value?.appendChild(renderer.domElement)

  const rgbeLoader = new RGBELoader()
  rgbeLoader.load(`${import.meta.env.BASE_URL}/hdr/sky.hdr`, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    scene.environment = texture
    render()
  })

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = false
  controls.minDistance = 1
  controls.maxDistance = 100
  controls.maxPolarAngle = Math.PI / 2
  controls.addEventListener('change', render)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 10, 7)
  scene.add(directionalLight)

  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}/draco/`)
  gltfLoader.setDRACOLoader(dracoLoader)
  gltfLoader.load(`${import.meta.env.BASE_URL}/glb/groundFloorOfficeBuilding.glb`, (gltf) => {
    const model = gltf.scene
    scene.add(model)
    render()
  })

  window.addEventListener('resize', onWindowResize)
  render()
}

function render() {
  renderer.render(scene, camera)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}
</script>

<style scoped lang="less">
.threeJs-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}
</style>