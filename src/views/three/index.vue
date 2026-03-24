<template>
  <div class="home-container">
    <!-- 控制模型 -->
    <ThreeController 
      @toTheSurface="handleToTheSurface" 
      @toUpdateModelVisibilityByFloor="handleToUpdateModelVisibilityByFloor"
      @pauseAutoRoam="handlePauseAutoRoam" 
      @continueAutoRoam="handleContinueAutoRoam"
      @startAutoRoam="handleStartAutoRoam" 
      @stopAutoRoam="handleStopAutoRoam"
      @goToTargetRoom="handleToTargetRoom" />

    <!-- 渲染场景 -->
    <ThreeJs 
      ref="threeJsRef" />
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { ref } from 'vue'
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'
import { useBasisStore } from '@/stores/basis'
import { useThreeJsStore } from '@/stores/threeJs'

const threeJsRef = ref<typeof ThreeJs>()
const basisStore = useBasisStore()
// 使用楼层threeJs管理 Store
const threeJsStore = useThreeJsStore()

// 飞行到地面大楼初始视角位置
const handleToTheSurface = async (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3) => {
  threeJsRef.value?.showBuildNames()

  await threeJsRef.value?.removeModel(basisStore.characterModelUrlsConfig?.man || '')?.catch(console.error)
  await threeJsRef.value?.flyTo?.(targetPosition, targetTarget, 2000)?.catch(console.error)
}

// 更新模型可见性
const handleToUpdateModelVisibilityByFloor = (floor: string) => {
  threeJsRef.value?.updateModelVisibilityByFloor(floor)
}

// 开始自动漫游
const handleStartAutoRoam = async () => {
  // 启动自动漫游
  await threeJsRef.value?.loadCharacterModelAndStartRoam()
  threeJsRef.value?.startAutoRoam()
}

// 暂停自动漫游
const handlePauseAutoRoam = () => {
  threeJsRef.value?.pauseAutoRoam()
}

// 继续自动漫游
const handleContinueAutoRoam = () => {
  threeJsRef.value?.resumeAutoRoam()
}

// 停止自动漫游
const handleStopAutoRoam = () => {
  threeJsRef.value?.stopAutoRoam()
}

// 快速导航到指定房间
const handleToTargetRoom = async (targetRoom: string) => {
  await threeJsRef.value?.toRoom?.(targetRoom)
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