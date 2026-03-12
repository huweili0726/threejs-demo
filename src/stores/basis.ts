/**
 * 楼层视角配置 Store
 *
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-07
 * @description 存储 basis.jsonc 中的各楼层初始视角配置，供各组件共享
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 视角配置接口
interface PerspectiveConfig {
  x: number
  y: number
  z: number
}

// 楼层配置接口
interface FloorConfig {
  perspective?: PerspectiveConfig
  directionToLook?: PerspectiveConfig
  durationTime?: number
  characterModelSetPosition?: PerspectiveConfig
  characterModelToLook?: PerspectiveConfig
}

// 基础配置接口
interface BasisConfig {
  floor_1th: FloorConfig
  floor_neg1: FloorConfig
  floor_8th: FloorConfig
  floor_9th: FloorConfig
}

export const useBasisStore = defineStore('basis', () => {
  // State
  const basisConfig = ref<BasisConfig | null>(null)
  const isLoaded = ref(false)

  // Getters
  const floor1Config = computed(() => basisConfig.value?.floor_1th)
  const neg1FloorConfig = computed(() => basisConfig.value?.floor_neg1)
  const floor8thConfig = computed(() => basisConfig.value?.floor_8th)
  const floor9thConfig = computed(() => basisConfig.value?.floor_9th)

  // Actions
  /**
   * 设置基础配置
   * @param config 基础配置对象
   */
  function setBasisConfig(config: BasisConfig) {
    basisConfig.value = config
    isLoaded.value = true
  }

  /**
   * 获取指定楼层的视角配置
   * @param floorKey 楼层键名，如 'floor_1th', 'floor_neg1' 等
   * @returns 楼层配置
   */
  function getFloorConfig(floorKey: keyof BasisConfig): FloorConfig | undefined {
    return basisConfig.value?.[floorKey]
  }

  /**
   * 获取指定楼层的视角位置
   * @param floorKey 楼层键名
   * @returns 视角配置
   */
  function getFloorPerspective(floorKey: keyof BasisConfig): PerspectiveConfig | undefined {
    return basisConfig.value?.[floorKey]?.perspective
  }

  /**
   * 获取指定楼层的看向方向
   * @param floorKey 楼层键名
   * @returns 看向方向配置
   */
  function getFloorDirectionToLook(floorKey: keyof BasisConfig): PerspectiveConfig | undefined {
    return basisConfig.value?.[floorKey]?.directionToLook
  }

  /**
   * 清除配置
   */
  function clearConfig() {
    basisConfig.value = null
    isLoaded.value = false
  }

  return {
    // State
    basisConfig,
    isLoaded,
    // Getters
    floor1Config,
    neg1FloorConfig,
    floor8thConfig,
    floor9thConfig,
    // Actions
    setBasisConfig,
    getFloorConfig,
    getFloorPerspective,
    getFloorDirectionToLook,
    clearConfig
  }
})
