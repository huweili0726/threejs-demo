<template>
  <div class="home-container">
    <!-- 控制模型 -->
    <ThreeController />

    <!-- 渲染场景 -->
    <ThreeJs ref="threeJsRef" />
  </div>
</template>

<script setup lang="ts">
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'

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