<template>
  <div class="home-container">
    <!-- 控制模型 -->
    <ThreeController 
      @toBottomfloorAndLoadcharacterModel="handleToBottomfloorAndLoadcharacterModel" 
      @toTheSurface="handleToTheSurface" />

    <!-- 渲染场景 -->
    <ThreeJs
      :skyBoxUrl="skyBoxUrl" 
      :loadModel="pendingLoadSingleModel"
      :loadModels="pendingLoadModels"
      :flyTo="pendingFlyTo"/>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { ref, onMounted } from 'vue'
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'

const skyBoxUrl = ref('/hdr/sky.hdr')

// 定义需要加载的模型配置
const pendingLoadModels = ref<{modelUrls: string[], scale: number} | null>(null)
const pendingLoadSingleModel = ref<any>(null)
const pendingFlyTo = ref<{position: THREE.Vector3, target: THREE.Vector3, duration?: number} | null>(null)

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
  // 发布加载指令
  pendingLoadModels.value = {
    modelUrls: modelsToLoad,
    scale: 1,
  }
})

const handleToTheSurface = (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3) => {
  // 发布飞行指令
  pendingFlyTo.value = {
    position: targetPosition,
    target: targetTarget,
    duration: 2000
  }
}

// 飞行到-1楼入口处 同时加载人物模型
const handleToBottomfloorAndLoadcharacterModel = (
  targetPosition: THREE.Vector3, // 视角飞到哪里
  targetTarget: THREE.Vector3, // 视角飞到指定地点后看向哪里
  duration?: number, // 飞行时间

  modelInitPosition?: {x: number, y: number, z: number}, // 人物模型初始位置
  onLookAt?: {x: number, y: number, z: number} // 人物模型看向位置
) => {
  // 发布飞行指令
  pendingFlyTo.value = {
    position: targetPosition,
    target: targetTarget,
    duration
  }
  // 发布加载人物模型指令
  pendingLoadSingleModel.value = {
    modelUrl: 'glb/man.glb',
    scale: 0.0005,
    modelInitPosition: modelInitPosition || { x: 0, y: 0, z: 0 },
    onLookAt: onLookAt || { x: 0, y: 0, z: 0 },
    frontAxis: new THREE.Vector3(0, 0, 1),
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