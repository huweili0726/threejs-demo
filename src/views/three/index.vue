<template>
  <div class="home-container">
    <ThreeController @changeModel="handleChangeModel" />

    <ThreeJs 
      :skyBoxUrl="skyBoxUrl"
      :modelUrl="modelUrl"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ThreeJs from '@/components/threeJs/index.vue'
import ThreeController from '@/views/three/threeController.vue'

const modelUrl = ref('')
const skyBoxUrl = ref('/hdr/sky.hdr')

// 处理模型切换
const handleChangeModel = (_modelUrl: string) => {
  modelUrl.value = _modelUrl
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