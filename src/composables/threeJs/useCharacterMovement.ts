/**
 * 人物移动模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 */
import * as THREE from 'three'
import { ref } from 'vue'

export function useCharacterMovement( 
  checkCollision: (characterBox: THREE.Box3) => boolean, 
  updateBoundingBoxes: () => void 
) {
  // 控制变量
  const keysPressed = ref<Set<string>>(new Set())

  // 初始化键盘事件监听
  const initKeyboardEvents = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.value.add(event.key.toLowerCase())
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.value.delete(event.key.toLowerCase())
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
    
    const speed = .1 * deltaTime // 移动速度（基于时间增量，确保不同帧率下速度一致）
    const rotationSpeed = .8 * deltaTime // 旋转速度（基于时间增量）
    const moveDirection = new THREE.Vector3()
    
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
      } else {
        console.log('碰撞检测：阻止移动')
      }
    }
    
    // 更新所有包围盒的位置
    updateBoundingBoxes()
  }
  
  return {
    keysPressed,
    initKeyboardEvents,
    updateCharacterMovement
  }
}
