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

const threeJsRef = ref<InstanceType<typeof ThreeJs> | null>(null)
const skyBoxUrl = ref('/hdr/sky.hdr')

onMounted(() => {
  const modelsToLoad = [
    'glb/groundFloorOfficeBuilding.glb',
    'glb/underGround.glb',
    'glb/8th_floor.glb',
    'glb/9th_floor.glb',
    'glb/空调送、回风、排烟.glb',
    'glb/配电干线.glb',
    'glb/消防给水.glb',
  ]
  if (threeJsRef.value) {
    threeJsRef.value.loadModels(modelsToLoad).catch(console.error)  // 加载模型
  }
})

const handleFocusModel = (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3, duration?: number) => {
  debugger
  if (threeJsRef.value) {
    threeJsRef.value.flyToModel(targetPosition, targetTarget, duration)
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