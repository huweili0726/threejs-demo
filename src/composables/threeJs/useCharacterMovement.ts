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
import { jsonUtils } from '@/utils/json'

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

export function useCharacterMovement( 
  checkCollision: (characterBox: THREE.Box3) => boolean, // 检查碰撞函数
  updateBoundingBoxes: () => void, // 更新碰撞框函数
  wallBoundingBoxes?: any, // 墙体包围盒数组
  showPopup?: any, // 显示弹窗函数
  closePopup?: any // 关闭弹窗函数
) {
  // 获取 store 实例（在函数内部获取，确保 Pinia 已初始化）
  const basisStore = useBasisStore()

  // 控制变量
  const keysPressed = ref<Set<string>>(new Set())
  // 按键按下时间记录
  const keyDownTime = ref<Record<string, number>>({})
  // 记录与碰撞体的上一帧距离
  const lastWallDistances = new Map<string, number>()
  // 记录当前显示弹窗的物体
  const visiblePopupObjects = ref<Set<string>>(new Set())

  // 最大速度倍数
  const MAX_SPEED_MULTIPLIER = basisStore.characterModelMoveConfig?.MAX_SPEED_MULTIPLIER || 6
  // 加速时间阈值（毫秒）
  const ACCELERATION_THRESHOLD = basisStore.characterModelMoveConfig?.ACCELERATION_THRESHOLD || 500
  // 加速度因子
  const ACCELERATION_FACTOR = basisStore.characterModelMoveConfig?.ACCELERATION_FACTOR || 0.01

  /**
   * 碰撞检测（到达某个模型附近，自动弹窗）
   * @param characterBox 人物的包围盒
   * @param wallBoundingBoxes 墙体的包围盒数组
   * @returns 碰撞检测结果
   */
  const isCloseToCollision = (characterBox: THREE.Box3, wallBoundingBoxes: Array<{ box: THREE.Box3; selectMode: { name: string; uuid: string }; isStairs?: boolean }>) => {
    const threshold = 0.3; // 接近阈值（调整为与实际距离单位匹配）
    const farThreshold = 0.35; // 离开阈值（需大于接近阈值，避免抖动）
    const result = {
      flag: false, // 是否在接近阈值内
      boxes: [] as Array<{ box: any; distance: number }>, // 所有在阈值内的碰撞体
      farBoxes: [] as Array<{ box: any; distance: number }>, // 所有在离开阈值外的碰撞体
      distance: Infinity, // 当前距离
      isApproaching: false, // 是否正在靠近（当前距离 < 上一帧距离）
      isLeaving: false, // 是否正在离开（当前距离 > 上一帧距离）
      isFullyLeft: false // 是否已完全离开（距离 > 离开阈值）
    };

    // 检查 wallBoundingBoxes 是否为空
    if (!wallBoundingBoxes || wallBoundingBoxes.length === 0) {
      console.log('⚠️  wallBoundingBoxes 为空，无法进行碰撞检测')
      return result;
    }

    for (const wallBox of wallBoundingBoxes) {
      // 计算人物与碰撞体中心的距离
      const wallCenter = new THREE.Vector3();
      wallBox.box.getCenter(wallCenter);
      const characterCenter = new THREE.Vector3();
      characterBox.getCenter(characterCenter);
      const currentDistance = characterCenter.distanceTo(wallCenter);

      // 用碰撞体的唯一标识作为key（这里用selectMode+索引，确保唯一）
      const wallKey = `${wallBox.selectMode.name}_${wallBox.selectMode.uuid}`;

      // 检查是否在接近阈值内
      if (currentDistance < threshold) {
        result.flag = true;
        result.boxes.push({ box: wallBox, distance: currentDistance });
      } 
      // 检查是否在离开阈值外
      else if (currentDistance > farThreshold) {
        result.farBoxes.push({ box: wallBox, distance: currentDistance });
      }

      lastWallDistances.set(wallKey, currentDistance);
    }

    return result;
  }

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
      } else {
        console.log('碰撞检测：阻止移动')
      }
    }
    
    // 更新所有包围盒的位置
    updateBoundingBoxes()
    
    // 碰撞检测（到达某个模型附近，自动弹窗）
    if (model && wallBoundingBoxes && showPopup && closePopup) {
      
      // 计算人物模型的包围盒
      const characterBox = new THREE.Box3().setFromObject(model)
      // 执行碰撞检测
      const collisionResult = isCloseToCollision(characterBox, wallBoundingBoxes.value)
      
      // 记录当前帧中接近的物体
      const currentCloseObjects = new Set<string>()
      // 记录当前帧中离开的物体（超过farThreshold）
      const currentFarObjects = new Set<string>()
      
      if (collisionResult.flag) {
        // 显示所有接近物体的弹窗
        if (showPopup && model.parent) {
          // 为每个接近的物体显示弹窗
          for (const item of collisionResult.boxes) {
            const wallBox = item.box
            const objectUuid = wallBox.selectMode.uuid
            
            // 记录当前接近的物体
            currentCloseObjects.add(objectUuid)
            
            // 从场景中找到对应的物体
            const targetObject = model.parent.getObjectByProperty('uuid', objectUuid)
            if (targetObject) {
              // 显示弹窗
              let popupData = {}
              if (wallBox.isStairs) {
                console.log('楼梯', wallBox.selectMode.name)
                // 楼梯特殊弹窗
                popupData = {
                  id: `popup-${objectUuid}`,
                  title: '楼梯',
                  content: [
                    { name: '提示', value: '是否愿意上二楼？' }
                  ]
                }
                showPopup(popupData, targetObject)
              } 
           
            }
          }
        }
      }
      
      // 记录离开的物体（超过farThreshold）
      if (collisionResult.farBoxes.length > 0) {
        for (const item of collisionResult.farBoxes) {
          const objectUuid = item.box.selectMode.uuid
          currentFarObjects.add(objectUuid)
        }
      }
      
      // 关闭离开物体的弹窗（结合farThreshold阈值）
      if (closePopup) {
        // 关闭所有超过farThreshold的物体的弹窗
        currentFarObjects.forEach(uuid => {
          closePopup(`popup-${uuid}`)
        })
      }
      
      // 更新当前显示弹窗的物体集合
      visiblePopupObjects.value = currentCloseObjects
    }
  }
  
  return {
    keysPressed,
    initKeyboardEvents,
    updateCharacterMovement
  }
}
