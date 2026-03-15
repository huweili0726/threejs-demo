/**
 * 人物移动模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 * @description 人物移动模块，处理人物的键盘输入和移动逻辑
 */
import * as THREE from 'three'
import { ref } from 'vue'
import { useBasisStore } from '@/stores/basis'

export function useCharacterMovement( 
  checkCollision: (characterBox: THREE.Box3) => boolean, // 检查碰撞函数
  updateBoundingBoxes: () => void, // 更新碰撞框函数
  wallBoundingBoxes?: any, // 墙体包围盒数组
  updateProximityPopups?: (options: { model: THREE.Group; wallBoundingBoxes: any[] }) => void // 更新接近弹窗函数
) {
  // 获取 store 实例（在函数内部获取，确保 Pinia 已初始化）
  const basisStore = useBasisStore()

  // 控制变量
  const keysPressed = ref<Set<string>>(new Set())
  // 按键按下时间记录
  const keyDownTime = ref<Record<string, number>>({})

  // 最大速度倍数
  const MAX_SPEED_MULTIPLIER = basisStore.characterModelMoveConfig?.MAX_SPEED_MULTIPLIER || 6
  // 加速时间阈值（毫秒）
  const ACCELERATION_THRESHOLD = basisStore.characterModelMoveConfig?.ACCELERATION_THRESHOLD || 500
  // 加速度因子
  const ACCELERATION_FACTOR = basisStore.characterModelMoveConfig?.ACCELERATION_FACTOR || 0.01

  // 初始化键盘事件监听
  const initKeyboardEvents = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      keysPressed.value.add(key)
      if (!keyDownTime.value[key]) {
        keyDownTime.value[key] = performance.now()
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      keysPressed.value.delete(key)
      delete keyDownTime.value[key]
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }
  
  /**
   * 更新人物移动
   * @param options.deltaTime 时间增量
   * @param options.modelUrl 模型URL
   * @param options.moveModel 移动模型的函数
   * @param options.loadedModelMaps 已加载的模型Map
   */
  const updateCharacterMovement = (options: {
    deltaTime: number
    modelUrl: string
    moveModel: (options: {
      modelUrl: string
      direction: THREE.Vector3
      speed: number
    }) => void
    loadedModelMaps: Map<string, THREE.Group>
  }) => {
    const { deltaTime, modelUrl, moveModel, loadedModelMaps } = options
    if (!modelUrl) return
    
    // 基础移动速度
    let baseSpeed = .1 * deltaTime
    // 旋转速度（基于时间增量）
    const rotationSpeed = .8 * deltaTime
    const moveDirection = new THREE.Vector3()
    
    // 计算加速度
    let speedMultiplier = 1
    const currentTime = performance.now()
    
    // 检查前进或后退键是否被长按
    if (keysPressed.value.has('w') || keysPressed.value.has('arrowup')) {
      const key = keysPressed.value.has('w') ? 'w' : 'arrowup'
      if (keyDownTime.value[key]) {
        const pressDuration = currentTime - keyDownTime.value[key]
        if (pressDuration > ACCELERATION_THRESHOLD) {
          // 计算加速度，最大不超过 MAX_SPEED_MULTIPLIER
          speedMultiplier = Math.min(1 + (pressDuration - ACCELERATION_THRESHOLD) * ACCELERATION_FACTOR, MAX_SPEED_MULTIPLIER)
        }
      }
    } else if (keysPressed.value.has('s') || keysPressed.value.has('arrowdown')) {
      const key = keysPressed.value.has('s') ? 's' : 'arrowdown'
      if (keyDownTime.value[key]) {
        const pressDuration = currentTime - keyDownTime.value[key]
        if (pressDuration > ACCELERATION_THRESHOLD) {
          // 计算加速度，最大不超过 MAX_SPEED_MULTIPLIER
          speedMultiplier = Math.min(1 + (pressDuration - ACCELERATION_THRESHOLD) * ACCELERATION_FACTOR, MAX_SPEED_MULTIPLIER)
        }
      }
    }
    
    // 应用速度倍数
    const speed = baseSpeed * speedMultiplier
    
    // 获取模型的世界旋转状态
    const model = loadedModelMaps.get(modelUrl)
    if (!model) return
    
    // 获取模型自定义的前方向量（默认0,0,1）
    const front = model.userData.frontAxis ? model.userData.frontAxis.clone() : new THREE.Vector3(0, 0, 1)
    front.applyQuaternion(model.quaternion)
    
    // 计算右侧向量（前方向量叉乘上方向量得到右侧）
    const right = new THREE.Vector3()
    right.crossVectors(front, new THREE.Vector3(0, 1, 0))
    right.normalize()
    
    // 根据按键更新移动方向
    if (keysPressed.value.has('w') || keysPressed.value.has('arrowup')) {
      moveDirection.add(front)
    }
    if (keysPressed.value.has('s') || keysPressed.value.has('arrowdown')) {
      moveDirection.sub(front)
    }
    if (keysPressed.value.has('a') || keysPressed.value.has('arrowleft')) {
      model.rotation.y += rotationSpeed
    }
    if (keysPressed.value.has('d') || keysPressed.value.has('arrowright')) {
      model.rotation.y -= rotationSpeed
    }
    
    // 归一化方向向量，确保斜向移动速度一致
    if (moveDirection.length() > 0) {
      moveDirection.normalize()
      
      // 保存当前位置
      const originalPosition = model.position.clone()
      
      // 临时移动模型到预测位置
      model.position.add(moveDirection.clone().multiplyScalar(speed))
      model.updateMatrixWorld(true)
      
      // 创建预测位置的包围盒
      const predictedBox = new THREE.Box3().setFromObject(model)
      
      // 检测是否发生碰撞
      const hasCollision = checkCollision(predictedBox)
      console.log('碰撞检测结果：', hasCollision)
      
      // 将模型移回原位置
      model.position.copy(originalPosition)
      model.updateMatrixWorld(true)
      
      if (!hasCollision) {
        // 如果没有碰撞，执行移动
        moveModel({
          modelUrl,
          direction: moveDirection,
          speed
        })
        // 输出人物当前位置
        console.log('📍 人物当前位置:', `x: ${model.position.x.toFixed(2)}, y: ${model.position.y.toFixed(2)}, z: ${model.position.z.toFixed(2)}`)
      } else {
        console.log('碰撞检测：阻止移动')
      }
    }
    
    // 更新所有包围盒的位置
    updateBoundingBoxes()
    
    // 更新接近弹窗
    if (model && wallBoundingBoxes) {
      updateProximityPopups?.({ model: model, wallBoundingBoxes: wallBoundingBoxes?.value || wallBoundingBoxes })
    }
  }
  
  return {
    keysPressed,
    initKeyboardEvents,
    updateCharacterMovement
  }
}
