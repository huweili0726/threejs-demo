/**
 * 模型显示控制模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-17
 * @description 控制模型的显示和隐藏，特别是空调送风005模型和管路
 */
import * as THREE from 'three'
import { ref } from 'vue'
import { useBasisStore } from '@/stores/basis' // 基础配置 Store

export function useModelVisibility() {
  // 原始显示状态映射
  const originalVisibilityMap = ref<Map<string, boolean>>(new Map())
  // 当前是否显示空调送风005
  const isVisible = ref(false)
  // 当前是否显示管路
  const isPipelinesVisible = ref(false)
  const basisStore = useBasisStore()


  /**
   * 检查模型名称是否包含空调送风005
   * @param model 模型对象
   * @returns 是否匹配
   */
  const isNeedHideModel = (model: THREE.Object3D): boolean => {
    const name = model.name || ''
    console.log('name', name)
    return name === '空调回风003'
  }

  /**
   * 突出显示管路图，隐藏其他所有模型
   * @param scene 场景对象
   */
  const showPipelines = () => {
    const models = basisStore.collisionBoundingBoxes.map(item => item?.child)

    // 保存原始显示状态
    models.forEach(model => {
      if (!originalVisibilityMap.value.has(model.uuid)) {
        originalVisibilityMap.value.set(model.uuid, model.visible)
      }
    })
    
    // 显示管路图，隐藏其他
    models.forEach(model => {
      if (isNeedHideModel(model)) {
        model.visible = true
      } else {
        model.visible = false
      }
    })
    
    isVisible.value = true
  }

  /**
   * 恢复模型初始状态（即全部展示）
   * @param scene 场景对象
   */
  const recoveryPipelines = () => {
    const models = basisStore.collisionBoundingBoxes.map(item => item?.child)
    
    // 恢复原始显示状态
    models.forEach(model => {
      const originalVisible = originalVisibilityMap.value.get(model.uuid)
      if (originalVisible !== undefined) {
        model.visible = originalVisible
      }
    })
    
    // 清空原始状态映射
    originalVisibilityMap.value.clear()
    isVisible.value = false
  }

  return {
    isVisible,
    isPipelinesVisible,
    showPipelines,
    recoveryPipelines
  }
}
