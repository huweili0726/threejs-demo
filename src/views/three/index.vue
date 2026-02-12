<template>
  <div class="home-container">
    <ThreeController />

    <ThreeJs 
      ref="threeJsRef"
      :skyBoxUrl="skyBoxUrl"
      :modelUrl="modelUrl" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'

const threeJsRef = ref<InstanceType<typeof ThreeJs> | null>(null)
const modelUrl = ref('')
const skyBoxUrl = ref('/hdr/sky.hdr')

onMounted(() => {
  const modelsToLoad = [
    'glb/groundFloorOfficeBuilding.glb',
    'glb/underGround.glb',
    'glb/8th_floor.glb',
    'glb/9th_floor.glb',
  ]
  if (threeJsRef.value) {
    threeJsRef.value.loadModels(modelsToLoad).catch(console.error)
  }
})

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