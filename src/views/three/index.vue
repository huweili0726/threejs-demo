<template>
  <div class="home-container">
    <ThreeJs />
  </div>
</template>

<script setup lang="ts">
import ThreeJs from '@/components/threeJs/index.vue'

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