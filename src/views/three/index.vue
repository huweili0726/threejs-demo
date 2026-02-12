<template>
  <div class="home-container">
    <ThreeController />

    <ThreeJs 
      :modelConfig="currentModelUrl"
    />
  </div>
</template>

<script setup lang="ts">
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'

// 模型配置文件
const currentModelUrl = `${process.env.BASE_URL}/config/glbLoad.jsonc?time=${new Date().getTime()}`

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