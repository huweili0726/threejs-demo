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
  // 天空盒
  skybox?: string
  // 需要加载的模型集合
  modelUrls?: string[]
  // 人物模型移动配置
  characterModelMove?: {
    MAX_SPEED_MULTIPLIER: number
    ACCELERATION_THRESHOLD: number
    ACCELERATION_FACTOR: number
  }
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
  const modelUrlsConfig = computed(() => basisConfig.value?.modelUrls)
  const skyboxUrlConfig = computed(() => basisConfig.value?.skybox)
  const characterModelMoveConfig = computed(() => basisConfig.value?.characterModelMove)
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
    modelUrlsConfig,
    skyboxUrlConfig,
    characterModelMoveConfig,
    floor1Config,
    neg1FloorConfig,
    floor8thConfig,
    floor9thConfig,
    // Actions
    setBasisConfig,
    clearConfig
  }
})
