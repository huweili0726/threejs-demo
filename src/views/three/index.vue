<template>
  <div class="home-container">
    <!-- 控制模型 -->
    <ThreeController 
      @toBottomfloorAndLoadcharacterModel="handleToBottomfloorAndLoadcharacterModel" 
      @toTheSurface="handleToTheSurface" />

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

const threeJsRef = ref<typeof ThreeJs>()

const handleToTheSurface = async (targetPosition: THREE.Vector3, targetTarget: THREE.Vector3) => {
  await threeJsRef.value?.removeModel('glb/man.glb')?.catch(console.error)
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
  await threeJsRef.value?.flyTo?.(targetPosition, targetTarget, duration)?.catch(console.error)
  await threeJsRef.value?.loadModel({
    modelUrl: 'glb/man.glb',
    scale: 0.0005,
    modelInitPosition: modelInitPosition || { x: 0, y: 0, z: 0 },
    onLookAt: onLookAt || { x: 0, y: 0, z: 0 },
    frontAxis: new THREE.Vector3(0, 0, 1),
  })?.catch(console.error)

  await threeJsRef.value?.loadCharacterModelAndStartRoam()
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