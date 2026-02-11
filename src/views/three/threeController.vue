<template>
  <!-- 三维控制按钮 -->
  <div class="map-controls">
    <div class="button-group">
      <!-- 图片点位控制按钮组 -->
      <div class="button-group img-point-controls">
        <div class="group-title" @click="toggleControls('imgPoint')">
          模型切换控制
          <span class="toggle-icon">{{ isImgPointControlsOpen ? '▼' : '▶' }}</span>
        </div>
        <div v-if="isImgPointControlsOpen" class="controls-content">
          <button @click="toChangeModel" class="control-btn">切换模型</button>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

// 按钮组展开/折叠状态
const isImgPointControlsOpen = ref(false)
const isModelControlsOpen = ref(false)
const isHemisphereControlsOpen = ref(false)
const isDroneControlsOpen = ref(false)
const isReplayControlsOpen = ref(false)
const isDiffusionControlsOpen = ref(false)
const isFenceControlsOpen = ref(false)
const isPyramidControlsOpen = ref(false)

// 切换按钮组展开/折叠状态
const toggleControls = (controlType: string) => {
  switch (controlType) {
    case 'imgPoint':
      isImgPointControlsOpen.value = !isImgPointControlsOpen.value
      break
    case 'model':
      isModelControlsOpen.value = !isModelControlsOpen.value
      break
    case 'hemisphere':
      isHemisphereControlsOpen.value = !isHemisphereControlsOpen.value
      break
    case 'drone':
      isDroneControlsOpen.value = !isDroneControlsOpen.value
      break
    case 'replay':
      isReplayControlsOpen.value = !isReplayControlsOpen.value
      break
    case 'diffusion':
      isDiffusionControlsOpen.value = !isDiffusionControlsOpen.value
      break
    case 'fence':
      isFenceControlsOpen.value = !isFenceControlsOpen.value
      break
    case 'pyramid':
      isPyramidControlsOpen.value = !isPyramidControlsOpen.value
      break
  }
}

// 切换模型
const toChangeModel = () => {

}




</script>

<style scoped lang="less">
.map-status-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #0a192f 0%, #172a45 100%);
  color: #64ffda;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  border: 1px solid rgba(100, 255, 218, 0.3);
  backdrop-filter: blur(5px);
}

.map-controls {
  position: absolute !important;
  top: 10px !important;
  left: 10px !important;
  z-index: 1000 !important;

  .button-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    background: rgba(0, 0, 0, 0.8);
    padding: 6px;
    border-radius: 6px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex-direction: column;

    &.replay-controls {
      margin-top: 6px;
      background: rgba(20, 40, 60, 0.9);
      border-color: rgba(100, 255, 218, 0.3);
    }

    &.drone-controls {
      margin-top: 6px;
      background: rgba(40, 20, 60, 0.9);
      border-color: rgba(255, 100, 218, 0.3);
    }

    &.img-point-controls {
      margin-top: 6px;
      background: rgba(20, 60, 40, 0.9);
      border-color: rgba(100, 255, 150, 0.3);
    }

    &.pyramid-controls {
      margin-top: 6px;
      background: rgba(60, 80, 100, 0.95);
      border-color: rgba(150, 255, 255, 0.5);
    }

    &.model-controls {
      margin-top: 6px;
      background: rgba(60, 40, 20, 0.9);
      border-color: rgba(255, 200, 100, 0.3);
    }

    &.hemisphere-controls {
      margin-top: 6px;
      background: rgba(40, 40, 60, 0.9);
      border-color: rgba(150, 100, 255, 0.3);
    }

    &.diffusion-controls {
      margin-top: 6px;
      background: rgba(60, 20, 40, 0.9);
      border-color: rgba(255, 100, 150, 0.3);
    }

    &.fence-controls {
      margin-top: 6px;
      background: rgba(60, 40, 20, 0.9);
      border-color: rgba(255, 200, 100, 0.3);
    }

    .group-title {
      color: #64ffda;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 4px;
      text-align: center;
      border-bottom: 1px solid rgba(100, 255, 218, 0.2);
      padding-bottom: 3px;
      width: 100%;
      cursor: pointer;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
      box-sizing: border-box;

      &:hover {
        background-color: rgba(100, 255, 218, 0.1);
      }
    }

    .toggle-icon {
      font-size: 9px;
      margin-left: 4px;
      color: #64ffda;
    }

    .controls-content {
      display: flex;
      gap: 6px;
      padding-top: 4px;
      flex-direction: column;
      width: 100%;
    }
  }
}

.delete-controls {
  position: absolute !important;
  top: 120px !important;
  left: 10px !important;
  z-index: 1000 !important;
}

.control-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #000000;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);

  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.control-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.control-input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  width: 100px;

  &:focus {
    border-color: rgba(24, 144, 255, 0.9);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}

.circle-controls {
  position: absolute !important;
  top: 14px !important;
  right: 10px !important;
  z-index: 1000 !important;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);

  h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    color: #1890ff;
    text-align: center;
  }

  h4 {
    margin-top: 12px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #555;
    border-bottom: 1px solid #e8e8e8;
    padding-bottom: 4px;
  }

  .circle-buttons {
    margin-bottom: 15px;
  }

  .btn-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;

    button {
      flex: 1;
      min-width: 100px;
    }
  }
}
</style>
