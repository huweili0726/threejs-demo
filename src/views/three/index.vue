<template>
  <div class="home-container">
    <!-- 控制模型 -->
    <ThreeController 
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
import { ref } from 'vue'
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'

const threeJsRef = ref<typeof ThreeJs>()

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