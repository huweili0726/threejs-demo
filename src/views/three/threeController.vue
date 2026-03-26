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
        <div class="controls-content" v-show="isImgPointControlsOpen">
          <button @click="ToFloor('9')" class="control-btn">9楼</button>
          <button @click="ToFloor('8')" class="control-btn">8楼</button>
          <button @click="ToFloor('0')" class="control-btn">地面</button>
          <button @click="ToFloor('-1')" class="control-btn">-1楼</button>
          <button @click="ToFloor('-1_2')" class="control-btn">-1楼2层</button>
          <button @click="ToFloor('-1_1')" class="control-btn">下楼</button>
        </div>
      </div>

      <!-- 漫游控制按钮组 -->
      <div class="button-group pyramid-controls">
        <div class="group-title" @click="toggleControls('pyramid')">
          漫游控制
          <span class="toggle-icon">{{ isPyramidControlsOpen ? '▼' : '▶' }}</span>
        </div>
        <div class="controls-content" v-show="isPyramidControlsOpen">
          <button @click="toStart()" class="control-btn">开始</button>
          <button @click="toPause()" class="control-btn">暂停</button>
          <button @click="toContinue()" class="control-btn">继续</button>
          <button @click="toStop()" class="control-btn">停止</button>
        </div>
      </div>

      <!-- 查看管路控制按钮组 -->
      <div class="button-group pipeline-controls">
        <div class="group-title" @click="toggleControls('pipeline')">
          查看管路
          <span class="toggle-icon">{{ isPipelineControlsOpen ? '▼' : '▶' }}</span>
        </div>
        <div class="controls-content" v-show="isPipelineControlsOpen">
          <button @click="showPipelines()" class="control-btn">突出显示管路</button>
          <button @click="recoveryPipelines()" class="control-btn">恢复原状</button>
        </div>
      </div>

      <!-- 快速导航控制按钮组 -->
      <div class="button-group model-controls">
        <div class="group-title" @click="toggleControls('model')">
          快速导航
          <span class="toggle-icon">{{ isModelControlsOpen ? '▼' : '▶' }}</span>
        </div>
        <div class="controls-content" v-show="isModelControlsOpen">
          <button @click="toTargetRoom('generatorRoom')" class="control-btn">发电机房</button>
          <button @click="toTargetRoom('airConditioningRoom')" class="control-btn">空调机房</button>
          <button @click="toTargetRoom('pumpRoom')" class="control-btn">水泵房</button>
          <button @click="toTargetRoom('communicationPowerRoom')" class="control-btn">通信电源配电室</button>
          <button @click="toTargetRoom('operationCommandRoom')" class="control-btn">作战指挥大厅</button>
          <button @click="toTargetRoom('finiteCommunicationRoom')" class="control-btn">有线通信室</button>
          <button @click="toTargetRoom('chemicalPreventionDutyRoom')" class="control-btn">防化值班室</button>
          <button @click="toTargetRoom('microwaveSatelliteCommunicationRoom')" class="control-btn">微波卫星通信室</button>  
          <button @click="toTargetRoom('managementAreaRoom')" class="control-btn">综合管理区</button>  
          <button @click="toTargetRoom('communicationMaintenanceRoom')" class="control-btn">通信维修室</button>  
          <button @click="toTargetRoom('emergencyBackupPlatform')" class="control-btn">应急备份平台</button>  
          <button @click="toTargetRoom('dataMaintenanceRoom')" class="control-btn">数据维护室</button>  
          <button @click="toTargetRoom('communicationDutyRoom')" class="control-btn">通信值班室</button>  
          <button @click="toTargetRoom('chemicalPreventionEquipmentRoom')" class="control-btn">防化器材室</button>  
          <button @click="toTargetRoom('protectionEquipmentRoom')" class="control-btn">防护元件室</button>  
          <button @click="toTargetRoom('emptyStatusIconRoom')" class="control-btn">空情图标室</button>  
          <button @click="toTargetRoom('emptyStatusAlertRoom')" class="control-btn">空情警报控制室</button>  
          <button @click="toTargetRoom('warehouseComputingArea')" class="control-btn">储存计算区</button>  
          <button @click="toTargetRoom('politicalWorkRoom')" class="control-btn">政治工作部</button>  

        </div>
      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThreeJsStore } from '@/stores/threeJs' // 3D场景 Store

const threeJsStore = useThreeJsStore()

// 控制按钮组展开/折叠状态
const isImgPointControlsOpen = ref(false)
const isPyramidControlsOpen = ref(false)
const isModelControlsOpen = ref(false)
const isPipelineControlsOpen = ref(false)
const isAirConditioningControlsOpen = ref(false)

// 切换按钮组展开/折叠状态
const toggleControls = (controlType: string) => {
  switch (controlType) {
    case 'imgPoint':
      isImgPointControlsOpen.value = !isImgPointControlsOpen.value
      break
    case 'pyramid':
      isPyramidControlsOpen.value = !isPyramidControlsOpen.value
      break
    case 'model':
      isModelControlsOpen.value = !isModelControlsOpen.value
      break
    case 'pipeline':
      isPipelineControlsOpen.value = !isPipelineControlsOpen.value
      break
    case 'airConditioning':
      isAirConditioningControlsOpen.value = !isAirConditioningControlsOpen.value
      break
  }
}

// 切换楼层
const ToFloor = (floor: string) => {
  threeJsStore.toFloor(floor)
}

// 快速导航到指定房间
const toTargetRoom = (targetRoom: string) => {
  threeJsStore.toTargetRoom(targetRoom)
}

// 开始自动漫游
const toStart = () => {
  threeJsStore.handleStartAutoRoam()
}

// 暂停自动漫游
const toPause = () => {
  threeJsStore.handlePauseAutoRoam()
}

// 继续自动漫游
const toContinue = () => {
  threeJsStore.handleResumeAutoRoam()
}

// 停止自动漫游
const toStop = () => {
  threeJsStore.handleStopAutoRoam()
}

// 显示管路模型
const showPipelines = () => {
  threeJsStore.handleShowPipelines()
}

// 恢复最初状态
const recoveryPipelines = () => {
  threeJsStore.handleRecoveryPipelines()
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

    &.pipeline-controls {
      margin-top: 6px;
      background: rgba(20, 60, 60, 0.9);
      border-color: rgba(100, 255, 255, 0.3);
    }

    &.air-conditioning-controls {
      margin-top: 6px;
      background: rgba(60, 20, 60, 0.9);
      border-color: rgba(255, 100, 255, 0.3);
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
