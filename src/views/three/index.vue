<template>
  <div class="home-container">
    <ThreeController @focusModel="handleFocusModel" />

    <ThreeJs 
      ref="threeJsRef"
      :skyBoxUrl="skyBoxUrl" />
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { ref, onMounted } from 'vue'
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'
import { useThreeScene } from '@/composables/threeJs/useThreeScene'
import { useModelLoader } from '@/composables/threeJs/useModelLoader'

const { scene, render, flyTo } = useThreeScene()
// const { loadModel, loadModels } = useModelLoader(scene, render)

const threeJsRef = ref<InstanceType<typeof ThreeJs> | null>(null)
const skyBoxUrl = ref('/hdr/sky.hdr')

onMounted(() => {
  const modelsToLoad = [
    'glb/groundFloorOfficeBuilding.glb',
    'glb/underGround.glb',
    'glb/shu.glb',
    'glb/8th_floor.glb',
    'glb/9th_floor.glb',
    'glb/空调送、回风、排烟.glb',
    'glb/配电干线.glb',
    'glb/消防给水.glb',
  ]
  if (threeJsRef.value) {
    // ✅ 调用子组件暴露的loadModels方法，使用子组件里已经初始化好的scene
    threeJsRef.value.loadModels({
      modelUrls: modelsToLoad,
      scale: 1
    }).catch(console.error)  // 加载模型
  }
})

const handleFocusModel = (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration?: number, modelInitPosition?: {x: number, y: number, z: number}, onLookAt?: {x: number, y: number, z: number}) => {
  if (threeJsRef.value) {
    // ✅ 调用useThreeScene暴露的flyTo方法
    flyTo(targetPosition, targetTarget, duration)

    if (threeJsRef.value) {
      // ✅ 调用子组件暴露的loadModel方法
      threeJsRef.value.loadModel({
        modelUrl: 'glb/man.glb',
        scale: 0.0005,
        modelInitPosition: modelInitPosition || { x: 0, y: 0, z: 0 },
        onLookAt: onLookAt || { x: 0, y: 0, z: 0 },
        frontAxis: new THREE.Vector3(0, 0, 1),
      }).catch(console.error)  // 加载模型
    }

  }
}
</script>

<style scoped lang="less">
.home-container {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>