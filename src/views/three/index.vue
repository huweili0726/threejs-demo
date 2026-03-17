<template>
  <div class="home-container">
    <!-- 控制模型 -->
    <ThreeController 
      @toBottomfloorAndLoadcharacterModel="handleToBottomfloorAndLoadcharacterModel" 
      @toTheSurface="handleToTheSurface" 
      @pauseAutoRoam="handlePauseAutoRoam" 
      @continueAutoRoam="handleContinueAutoRoam"
      @startAutoRoam="handleStartAutoRoam" 
      @stopAutoRoam="handleStopAutoRoam"
      @goToTargetRoom="handleToTargetRoom" 
      @showPipelines="handleShowPipelines" />

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

const threeJsRef = ref<typeof ThreeJs>()
const basisStore = useBasisStore()

const handleToTheSurface = async (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3) => {
  await threeJsRef.value?.removeModel(basisStore.characterModelUrlsConfig?.man || '')?.catch(console.error)
  await threeJsRef.value?.flyTo?.(targetPosition, targetTarget, 2000)?.catch(console.error)
}

// 飞行到-1楼入口处 同时加载人物模型
const handleToBottomfloorAndLoadcharacterModel = async (
  targetPosition: THREE.Vector3, // 视角飞到哪里
  targetTarget: THREE.Vector3, // 视角飞到指定地点后看向哪里
  duration?: number, // 飞行时间
  modelInitPosition?: {x: number, y: number, z: number}, // 人物模型初始位置
  onLookAt?: {x: number, y: number, z: number} // 人物模型看向位置
) => {
  await threeJsRef.value?.switchToFloor(targetPosition, targetTarget, duration, modelInitPosition, onLookAt)
  // 为人物模型添加碰撞检测包围盒
  threeJsRef.value?.toAddCharacterBoundingBox()
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

// 查看管路
const handleShowPipelines = () => {
  threeJsRef.value?.showPipelines()
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