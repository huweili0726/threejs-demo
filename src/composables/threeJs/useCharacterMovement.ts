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
  updateProximityPopups?: (options: { model: THREE.Group; wallBoundingBoxes: any[]; onlyShowUpDownStairsPopup?: boolean }) => void // 更新接近弹窗函数
) {
  // 获取 store 实例
  const basisStore = useBasisStore()

  // 控制变量
  const keysPressed = ref<Set<string>>(new Set())
  // 按键按下时间记录
  const keyDownTime = ref<Record<string, number>>({})
  // 鼠标左键是否按下
  const isLeftMouseDown = ref(false)
  // 上一帧鼠标X坐标
  const lastMouseX = ref(0)
  // 鼠标旋转灵敏度
  const MOUSE_ROTATION_SENSITIVITY = 0.005
  // 鼠标移动累计值（用于旋转人物）
  const mouseDeltaX = ref(0)
  // 帧计数器，用于优化性能
  let frameCount = 0

  // 最大速度倍数
  const MAX_SPEED_MULTIPLIER = basisStore.characterModelMoveConfig?.MAX_SPEED_MULTIPLIER || 6
  // 加速时间阈值（毫秒）
  const ACCELERATION_THRESHOLD = basisStore.characterModelMoveConfig?.ACCELERATION_THRESHOLD || 500
  // 加速度因子
  const ACCELERATION_FACTOR = basisStore.characterModelMoveConfig?.ACCELERATION_FACTOR || 0.01
  
  // 每次碰撞检测的最大步长（防止高速穿墙，应小于墙体厚度）
  const MAX_STEP_SIZE = 0.002 // 小于墙体厚度 0.005，更精细检测
  // 每帧最大移动距离（核心修复：限制最高速度的绝对移动距离，需要足够大以允许加速效果）
  const MAX_FRAME_MOVE_DISTANCE = 0.15
  // 碰撞检测安全距离（提前检测距离）
  const COLLISION_SAFE_DISTANCE = 0.02

  // 初始化键盘和鼠标事件监听
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
    
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        isLeftMouseDown.value = true
        lastMouseX.value = event.clientX
      }
    }
    
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isLeftMouseDown.value = false
      }
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isLeftMouseDown.value) {
        const deltaX = event.clientX - lastMouseX.value
        lastMouseX.value = event.clientX
        mouseDeltaX.value += deltaX
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }
  
  /**
   * 检测人物是否卡在碰撞体内，如果是则推出到安全位置
   * 只在水平方向（XZ平面）推出，不影响Y轴高度
   */
  const checkAndPushOut = (model: THREE.Group): boolean => {
    model.updateMatrixWorld(true)
    const currentBox = new THREE.Box3().setFromObject(model)
    
    const walls = wallBoundingBoxes?.value || wallBoundingBoxes
    if (!walls || walls.length === 0) return false
    
    let stuckInWall = false
    let pushDirection = new THREE.Vector3()
    let minPenetration = Infinity
    
    for (const wallBox of walls) {
      if (wallBox.box && currentBox.intersectsBox(wallBox.box)) {
        stuckInWall = true
        
        const wallCenter = new THREE.Vector3()
        const characterCenter = new THREE.Vector3()
        wallBox.box.getCenter(wallCenter)
        currentBox.getCenter(characterCenter)
        
        const direction = characterCenter.clone().sub(wallCenter)
        
        const intersection = currentBox.clone().intersect(wallBox.box)
        const intersectionSize = new THREE.Vector3()
        intersection.getSize(intersectionSize)
        
        const penetration = Math.min(intersectionSize.x, intersectionSize.z)
        
        if (penetration < minPenetration) {
          minPenetration = penetration
          pushDirection.copy(direction).normalize()
        }
      }
    }
    
    if (stuckInWall) {
      console.log('⚠️ 检测到人物卡在碰撞体内，正在推出...')
      
      // 保存原始Y坐标，防止被推到地面以下
      const originalY = model.position.y
      
      // 只在XZ平面推出，Y轴设为0
      pushDirection.y = 0
      pushDirection.normalize()
      
      const pushStep = 0.002
      const maxPushSteps = 100
      
      for (let i = 0; i < maxPushSteps; i++) {
        model.position.add(pushDirection.clone().multiplyScalar(pushStep))
        // 保持Y坐标不变
        model.position.y = originalY
        model.updateMatrixWorld(true)
        
        const newBox = new THREE.Box3().setFromObject(model)
        let stillColliding = false
        
        for (const wallBox of walls) {
          if (wallBox.box && newBox.intersectsBox(wallBox.box)) {
            stillColliding = true
            break
          }
        }
        
        if (!stillColliding) {
          console.log(`✅ 已将人物推出碰撞体，推出距离: ${((i + 1) * pushStep).toFixed(3)}`)
          return true
        }
      }
      
      return false
    }
    
    return false
  }
  
  /**
   * 使用射线检测移动方向上是否有障碍物
   * 只检测移动方向，不检测其他方向
   */
  const checkDirectionCollision = (
    model: THREE.Group,
    direction: THREE.Vector3,
    distance: number
  ): boolean => {
    const walls = wallBoundingBoxes?.value || wallBoundingBoxes
    if (!walls || walls.length === 0) return false
    
    const modelBox = new THREE.Box3().setFromObject(model)
    const modelCenter = new THREE.Vector3()
    modelBox.getCenter(modelCenter)
    
    const raycaster = new THREE.Raycaster()
    raycaster.set(modelCenter, direction.clone().normalize())
    
    // 检测距离 = 移动距离 + 安全距离
    const checkDistance = distance + COLLISION_SAFE_DISTANCE
    
    for (const wallBox of walls) {
      if (wallBox.box) {
        const intersection = raycaster.ray.intersectBox(wallBox.box, new THREE.Vector3())
        if (intersection) {
          const dist = modelCenter.distanceTo(intersection)
          if (dist < checkDistance) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  /**
   * 分步移动并检测碰撞
   */
  const moveWithStepCollision = (
    model: THREE.Group,
    direction: THREE.Vector3,
    totalSpeed: number
  ): boolean => {
    // 首先检查是否卡在碰撞体内，如果是则推出
    checkAndPushOut(model)
    
    // 使用射线检测移动方向上是否有障碍物
    if (checkDirectionCollision(model, direction, totalSpeed)) {
      // 有障碍物，使用分步移动检测
      const stepCount = Math.ceil(totalSpeed / MAX_STEP_SIZE)
      const stepSize = totalSpeed / stepCount
      
      for (let i = 0; i < stepCount; i++) {
        const originalPosition = model.position.clone()
        
        model.position.add(direction.clone().multiplyScalar(stepSize))
        model.updateMatrixWorld(true)
        
        const currentBox = new THREE.Box3().setFromObject(model)
        const hasCollision = checkCollision(currentBox)
        
        if (hasCollision) {
          model.position.copy(originalPosition)
          model.updateMatrixWorld(true)
          console.log(`碰撞检测：在第 ${i + 1} 步检测到碰撞，已阻止移动`)
          return false
        }
      }
    }
    
    return true
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
          speedMultiplier = Math.min(1 + (pressDuration - ACCELERATION_THRESHOLD) * ACCELERATION_FACTOR, MAX_SPEED_MULTIPLIER)
        }
      }
    } else if (keysPressed.value.has('s') || keysPressed.value.has('arrowdown')) {
      const key = keysPressed.value.has('s') ? 's' : 'arrowdown'
      if (keyDownTime.value[key]) {
        const pressDuration = currentTime - keyDownTime.value[key]
        if (pressDuration > ACCELERATION_THRESHOLD) {
          speedMultiplier = Math.min(1 + (pressDuration - ACCELERATION_THRESHOLD) * ACCELERATION_FACTOR, MAX_SPEED_MULTIPLIER)
        }
      }
    }
    
    // 应用速度倍数
    let speed = baseSpeed * speedMultiplier
    
    // 限制每帧最大移动距离
    speed = Math.min(speed, MAX_FRAME_MOVE_DISTANCE)
    
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
    
    // 鼠标左键拖拽旋转人物
    if (mouseDeltaX.value !== 0) {
      model.rotation.y -= mouseDeltaX.value * MOUSE_ROTATION_SENSITIVITY
      mouseDeltaX.value = 0
    }
    
    // 归一化方向向量，确保斜向移动速度一致
    if (moveDirection.length() > 0) {
      moveDirection.normalize()
      
      // 保存原始位置
      const originalPosition = model.position.clone()
      
      // 使用分步碰撞检测进行移动
      const canMove = moveWithStepCollision(model, moveDirection, speed)
      
      if (canMove) {
        // 移动成功，调用 moveModel 更新其他状态
        moveModel({
          modelUrl,
          direction: moveDirection,
          speed
        })
        // console.log(`📍 人物当前位置: x: ${model.position.x.toFixed(2)}, y: ${model.position.y.toFixed(2)}, z: ${model.position.z.toFixed(2)}，速度倍数: ${speedMultiplier.toFixed(2)}`)
      } else {
        // 碰撞时重置加速状态
        if (keysPressed.value.has('w') || keysPressed.value.has('arrowup')) {
          delete keyDownTime.value['w']
          delete keyDownTime.value['arrowup']
        }
        if (keysPressed.value.has('s') || keysPressed.value.has('arrowdown')) {
          delete keyDownTime.value['s']
          delete keyDownTime.value['arrowdown']
        }
      }
    }
    
    // 每两帧更新一次包围盒和接近弹窗，减少计算量
    if (frameCount % 2 === 0) {
      // 更新所有包围盒的位置
      updateBoundingBoxes()
      
      // 更新接近弹窗
      if (model && wallBoundingBoxes) {
        updateProximityPopups?.({ model: model, wallBoundingBoxes: wallBoundingBoxes?.value || wallBoundingBoxes, onlyShowUpDownStairsPopup: true })
      }
    }
    frameCount++
  }
  
  return {
    keysPressed,
    initKeyboardEvents,
    updateCharacterMovement
  }
}
