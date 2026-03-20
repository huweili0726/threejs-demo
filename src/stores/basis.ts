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
import * as THREE from 'three'

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

// 三维设备配置接口
interface ThreeDev {
  id: string
  meshName: string
  type: string
  popInfo?: {
    title: string
    content: Array<{ name: string; value: string }>
  }
}

// 基础配置接口
interface BasisConfig {
  // 天空盒
  skybox?: string
  // 需要加载的模型集合
  modelUrls?: string[]
  characterModelUrls: Record<string, string>
  // 人物模型移动配置
  characterModelMove?: {
    MAX_SPEED_MULTIPLIER: number
    ACCELERATION_THRESHOLD: number
    ACCELERATION_FACTOR: number
  }
  floor_1th: FloorConfig
  floor_neg1: FloorConfig
  before_floor_neg1_2layers: FloorConfig
  floor_neg1_2layers: FloorConfig
  floor_8th: FloorConfig
  floor_9th: FloorConfig
}

// 三维设备配置接口
interface ThreeDevConfig {
  threeDevs: ThreeDev[]
}

// 墙体配置接口
interface WallConfig {
  walls: Array<{
    name: string
    thickness?: number
    isStairs?: boolean
  }>
}

export const useBasisStore = defineStore('basis', () => {
  // State
  const basisConfig = ref<BasisConfig | null>(null)
  const threeDevConfig = ref<ThreeDevConfig | null>(null)
  const wallConfig = ref<WallConfig | null>(null)
  const roamConfig = ref<any | null>(null)
  const quickNavigationConfig = ref<any | null>(null)
  const lineConfig = ref<any | null>(null)
  const boundingBoxes = ref<Array<{ child: THREE.Mesh; name: string; }>>([])
  const currentFloor = ref<string>('0') // 当前楼层
  
  const isLoaded = ref(false)
  const isThreeDevLoaded = ref(false)
  const isWallLoaded = ref(false)
  const isRoamLoaded = ref(false)
  const isQuickNavigationLoaded = ref(false)

  // Getters
  const characterModelUrlsConfig = computed(() => basisConfig.value?.characterModelUrls)
  const modelUrlsConfig = computed(() => basisConfig.value?.modelUrls)
  const skyboxUrlConfig = computed(() => basisConfig.value?.skybox)
  const characterModelMoveConfig = computed(() => basisConfig.value?.characterModelMove)
  const floor1Config = computed(() => basisConfig.value?.floor_1th)
  const neg1FloorConfig = computed(() => basisConfig.value?.floor_neg1)
  const beforeNeg12LayersFloorConfig = computed(() => basisConfig.value?.before_floor_neg1_2layers)
  const neg12LayersFloorConfig = computed(() => basisConfig.value?.floor_neg1_2layers)
  const floor8thConfig = computed(() => basisConfig.value?.floor_8th)
  const floor9thConfig = computed(() => basisConfig.value?.floor_9th)
  const threeDevs = computed(() => threeDevConfig.value?.threeDevs || [])
  const wallsConfig = computed(() => wallConfig.value?.walls || [])
  const roamPathConfig = computed(() => roamConfig.value || null)
  const quickNavigation = computed(() => quickNavigationConfig.value || {})
  const pipelineConfig = computed(() => lineConfig.value || null)
  const collisionBoundingBoxes = computed(() => boundingBoxes.value)
  const currentFloorConfig = computed(() => currentFloor.value)

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
   * 设置三维设备配置
   * @param config 三维设备配置对象
   */
  function setThreeDevConfig(config: ThreeDevConfig) {
    threeDevConfig.value = config
    isThreeDevLoaded.value = true
  }

  /**
   * 设置墙体配置
   * @param config 墙体配置对象
   */
  function setWallConfig(config: WallConfig) {
    wallConfig.value = config
    isWallLoaded.value = true
  }

  /**
   * 设置漫游路径配置
   * @param config 漫游路径配置对象
   */
  function setRoamConfig(config: any) {
    roamConfig.value = config
    isRoamLoaded.value = true
  }

  /**
   * 设置快速导航配置
   * @param config 快速导航配置对象
   */
  function setQuickNavigationConfig(config: any) {
    quickNavigationConfig.value = config
    isQuickNavigationLoaded.value = true
  }

  /**
   * 设置碰撞检测包围盒
   * @param boxes 包围盒数组
   */
  function setBoundingBoxes(boxes: Array<{ child: THREE.Mesh; name: string; }>) {
    boundingBoxes.value = boxes
  }

  /**
   * 设置管路配置
   * @param config 管路配置对象
   */
  function setLineConfig(config: any) {
    lineConfig.value = config
  }

  /**
   * 清除配置
   */
  function clearConfig() {
    basisConfig.value = null
    threeDevConfig.value = null
    wallConfig.value = null
    roamConfig.value = null
    quickNavigationConfig.value = null
    lineConfig.value = null
    boundingBoxes.value = []
    currentFloor.value = '0'
    isLoaded.value = false
    isThreeDevLoaded.value = false
    isWallLoaded.value = false
    isRoamLoaded.value = false
    isQuickNavigationLoaded.value = false
  }

  /**
   * 设置当前楼层
   * @param floor 楼层字符串
   */
  function setCurrentFloor(floor: string) {
    currentFloor.value = floor
  }

  return {
    // State
    basisConfig,
    threeDevConfig,
    wallConfig,
    roamConfig,
    quickNavigationConfig,
    lineConfig,
    boundingBoxes,
    currentFloor,
    isLoaded,
    isThreeDevLoaded,
    isWallLoaded,
    isRoamLoaded,
    isQuickNavigationLoaded,
    // Getters
    characterModelUrlsConfig,
    modelUrlsConfig,
    skyboxUrlConfig,
    characterModelMoveConfig,
    floor1Config,
    neg1FloorConfig,
    beforeNeg12LayersFloorConfig,
    neg12LayersFloorConfig,
    floor8thConfig,
    floor9thConfig,
    threeDevs,
    wallsConfig,
    roamPathConfig,
    quickNavigation,
    pipelineConfig,
    collisionBoundingBoxes,
    currentFloorConfig,
    // Actions
    setBasisConfig,
    setThreeDevConfig,
    setWallConfig,
    setRoamConfig,
    setQuickNavigationConfig,
    setBoundingBoxes,
    setLineConfig,
    setCurrentFloor,
    clearConfig
  }
})
