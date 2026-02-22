import { ref } from 'vue'
import * as THREE from 'three'

export function useCharacterMovement() {
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
   * @param deltaTime 时间增量
   * @param modelUrl 模型URL
   * @param moveModel 移动模型的函数
   * @param loadedModels 已加载的模型Map
   */
  const updateCharacterMovement = (deltaTime: number, modelUrl: string, moveModel: (modelUrl: string, direction: THREE.Vector3, speed: number) => void, loadedModels: Map<string, THREE.Group>) => {
    if (!modelUrl) return
    
    const speed = .1 * deltaTime // 移动速度（基于时间增量，确保不同帧率下速度一致）
    const rotationSpeed = .8 * deltaTime // 旋转速度（基于时间增量）
    const moveDirection = new THREE.Vector3()
    
    // 获取模型的世界旋转状态
    const model = loadedModels.get(modelUrl)
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
      moveModel(modelUrl, moveDirection, speed)
    }
  }
  
  return {
    keysPressed,
    initKeyboardEvents,
    updateCharacterMovement
  }
}
