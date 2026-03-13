/**
 * 自动漫游模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-03-12
 * @description 实现人物模型按照预设路径自动漫游的功能
 */
import * as THREE from 'three'
import { ref } from 'vue'
import { jsonUtils } from '@/utils/json'

// 漫游点接口
interface RoamPoint {
  position: {
    x: number
    y: number
    z: number
  }
  rotation: {
    y: string
  }
  duration: number
  stayTime: number
  sta?: string
}

// 漫游状态类型
type RoamState = 'stopped' | 'moving' | 'staying' | 'paused'

// 漫游起点信息
interface RoamStart {
  position: THREE.Vector3
  rotationY: number
}

export function useAutoRoam(wallBoundingBoxes: any, showPopup?: any, closePopup?: any) {
  // 漫游路径点
  const roamPoints = ref<RoamPoint[]>([])
  // 当前漫游点索引
  const currentPointIndex = ref(0)
  // 漫游状态
  const roamState = ref<RoamState>('stopped')
  // 暂停前的状态
  const previousState = ref<RoamState | null>(null)
  // 漫游开始时间
  const roamStartTime = ref(0)
  // 停留开始时间
  const stayStartTime = ref(0)
  // 暂停开始时间
  const pauseStartTime = ref(0)
  // 自动显示弹窗
  const autoShowPop = ref(false)
  // 移动开始前的位置和旋转
  const currentRoamStart = ref<RoamStart>({
    position: new THREE.Vector3(),
    rotationY: 0
  })
  // 速度向量
  const velocity = ref(new THREE.Vector3())

  // 模型引用
  let model: THREE.Group | null = null
  // 清理键盘事件的函数
  let cleanupKeyboardEvents: (() => void) | null = null
  // 记录与碰撞体的上一帧距离
  const lastWallDistances = new Map<string, number>()
  // 记录当前显示弹窗的物体
  const currentPopupObject = ref<string | null>(null)

  /**
   * 初始化自动漫游
   * @param modelInstance 模型实例
   */
  const initAutoRoam = (modelInstance: THREE.Group) => {
    model = modelInstance
    // 初始化键盘事件监听
    initKeyboardEvents()
  }

  /**
   * 初始化键盘事件监听
   */
  const initKeyboardEvents = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Esc 键退出漫游
      if (event.key === 'Escape') {
        stopAutoRoam()
        console.log('🚪 按下 Esc 键退出自动漫游')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    // 保存清理函数
    cleanupKeyboardEvents = () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * 碰撞检测（到达某个模型附近，自动弹窗）
   * @param characterBox 人物的包围盒
   * @param wallBoundingBoxes 墙体的包围盒数组
   * @returns 碰撞检测结果
   */
  const isCloseToCollision = (characterBox: THREE.Box3, wallBoundingBoxes: Array<{ box: THREE.Box3; selectMode: { name: string; uuid: string } }>) => {
    const threshold = 0.5; // 接近阈值（缩小阈值，更容易检测到物体）
    const farThreshold = 0.8; // 离开阈值（需大于接近阈值，避免抖动）
    const result = {
      flag: false, // 是否在接近阈值内
      box: null as any, // 对应的碰撞体
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

    console.log('🔍 开始碰撞检测，物体数量:', wallBoundingBoxes.length)
    
    let closestDistance = Infinity
    let closestBox = null

    for (const wallBox of wallBoundingBoxes) {
      // 计算人物与碰撞体中心的距离
      const wallCenter = new THREE.Vector3();
      wallBox.box.getCenter(wallCenter);
      const characterCenter = new THREE.Vector3();
      characterBox.getCenter(characterCenter);
      const currentDistance = characterCenter.distanceTo(wallCenter);

      console.log('📏 物体:', wallBox.selectMode.name, '距离:', currentDistance)

      // 用碰撞体的唯一标识作为key（这里用selectMode+索引，确保唯一）
      const wallKey = `${wallBox.selectMode.name}_${wallBox.selectMode.uuid}`;
      const lastDistance = lastWallDistances.get(wallKey) || Infinity;

      // 记录最近的物体
      if (currentDistance < closestDistance) {
        closestDistance = currentDistance
        closestBox = wallBox
      }

      // 判断是否已完全离开
      result.isFullyLeft = currentDistance > farThreshold;

      lastWallDistances.set(wallKey, currentDistance);
    }

    // 选择最近的物体进行弹窗
    if (closestBox && closestDistance < threshold) {
      result.flag = true;
      result.box = closestBox;
      result.distance = closestDistance;
      const wallKey = `${closestBox.selectMode.name}_${closestBox.selectMode.uuid}`;
      const lastDistance = lastWallDistances.get(wallKey) || Infinity;
      result.isApproaching = closestDistance < lastDistance;
      result.isLeaving = closestDistance > lastDistance;
      console.log('🎯 检测到最近物体:', closestBox.selectMode.name, '距离:', closestDistance)
    }

    return result;
  }

  /**
   * 加载漫游路径配置
   * @param configPath 配置文件路径
   */
  const loadRoamConfig = async (configPath: string = `${import.meta.env.BASE_URL}/config/roamingPathPoint.jsonc`) => {
    try {
      const { getJsonFile } = jsonUtils()
      const config = await getJsonFile(configPath)
      // 默认加载 allRoom 路径
      if (config && config.allRoom && config.allRoom.points) {
        roamPoints.value = config.allRoom.points
        console.log('✅ 自动漫游配置加载完成，共', roamPoints.value.length, '个点位')
        return true
      } else {
        console.error('❌ 自动漫游配置加载失败：配置格式不正确')
        return false
      }
    } catch (error) {
      console.error('❌ 自动漫游配置加载失败：', error)
      return false
    }
  }

  /**
   * 开始自动漫游
   * @param points 自定义路径点
   * @param autoShowPop 是否自动显示弹窗
   */
  const startAutoRoam = (points?: RoamPoint[], autoShowPopParam?: boolean) => {
    if (!model) {
      console.error('❌ 自动漫游失败：模型未初始化')
      return
    }

    // 支持自定义路径点
    if (points) {
      roamPoints.value = points
    }
    if (autoShowPopParam) {
      autoShowPop.value = autoShowPopParam
    }

    // 重置状态
    currentPointIndex.value = 0
    roamState.value = 'moving'
    roamStartTime.value = performance.now()

    // 关键：记录"移动开始前的模型当前位置"作为起点
    currentRoamStart.value.position.copy(model.position)
    currentRoamStart.value.rotationY = model.rotation.y

    console.log('✅ 开始自动漫游，起点位置:', currentRoamStart.value.position)
    console.log('第一个目标点位置:', roamPoints.value[0]?.position)
  }

  /**
   * 暂停自动漫游
   */
  const pauseAutoRoam = () => {
    if (roamState.value === 'moving' || roamState.value === 'staying') {
      previousState.value = roamState.value // 记录暂停前的状态
      roamState.value = 'paused'
      pauseStartTime.value = performance.now() // 记录暂停开始的时间
      console.log('⏸️ 暂停自动漫游，暂停开始时间:', pauseStartTime.value)
    }
  }

  /**
   * 继续自动漫游
   */
  const resumeAutoRoam = () => {
    if (roamState.value === 'paused' && previousState.value) {
      const currentTime = performance.now()
      const pauseDuration = currentTime - pauseStartTime.value

      // 如果之前是移动状态，修正移动起始时间
      if (previousState.value === 'moving') {
        roamStartTime.value += pauseDuration
      }
      // 如果之前是停留状态，修正停留起始时间
      else if (previousState.value === 'staying') {
        stayStartTime.value += pauseDuration
      }

      roamState.value = previousState.value // 恢复到暂停前的状态（移动或停留）
      previousState.value = null // 清空记录（避免重复使用）
      console.log(`▶️ 继续自动漫游（恢复到${roamState.value}状态），暂停时长：${pauseDuration}ms`)
    }
  }

  /**
   * 停止自动漫游 并重置模型位置
   */
  const stopAutoRoam = () => {
    roamState.value = 'stopped'
    velocity.value.set(0, 0, 0) // 停止移动
    currentPointIndex.value = 0 // 重置到第一个点
    stayStartTime.value = 0 // 重置停留计时
    
    // 将模型重置到第一个点的位置和旋转
    if (model && roamPoints.value.length > 0) {
      const firstPoint = roamPoints.value[0]
      const targetPos = new THREE.Vector3(
        firstPoint.position.x,
        firstPoint.position.y,
        firstPoint.position.z
      )
      
      // 解析旋转值
      let targetRotY = 0
      try {
        targetRotY = eval(firstPoint.rotation.y)
      } catch (error) {
        console.error('❌ 旋转值解析失败：', firstPoint.rotation.y)
        targetRotY = 0
      }
      
      model.position.copy(targetPos)
      model.rotation.y = targetRotY
      console.log('🔄 模型已重置到第一个点位置')
    }
    
    // 清理键盘事件
    if (cleanupKeyboardEvents) {
      cleanupKeyboardEvents()
      cleanupKeyboardEvents = null
    }
    
    console.log('⏹️ 停止自动漫游')
  }

  /**
   * 计算自动漫游的位置和朝向过渡
   * @param delta 时间增量
   */
  const updateAutoRoam = (delta: number) => {
    if (!model || roamPoints.value.length === 0) {
      return
    }

    const currentTime = performance.now()
    const currentPoint = roamPoints.value[currentPointIndex.value]

    // --------------------------
    // 1. 处理【用户主动暂停】
    // --------------------------
    if (roamState.value === 'paused') {
      return
    }

    // --------------------------
    // 2. 处理【系统自动停留】
    // --------------------------
    if (roamState.value === 'staying' && currentPoint.stayTime) {
      const elapsed = currentTime - stayStartTime.value

      // 停留时间到，切换到下一个点
      if (elapsed >= currentPoint.stayTime) {
        nextRoamPoint()
      }
      return // 停留状态下，不执行移动逻辑
    }

    // --------------------------
    // 3. 处理【移动状态】
    // --------------------------
    if (roamState.value === 'moving') {
      const startPoint = {
        position: currentRoamStart.value.position,
        rotationY: currentRoamStart.value.rotationY
      }
      const targetPos = new THREE.Vector3(
        currentPoint.position.x,
        currentPoint.position.y,
        currentPoint.position.z
      )

      // 解析旋转值
      let targetRotY = 0
      try {
        // 执行旋转表达式计算
        targetRotY = eval(currentPoint.rotation.y)
      } catch (error) {
        console.error('❌ 旋转值解析失败：', currentPoint.rotation.y)
        targetRotY = 0
      }

      const elapsed = currentTime - roamStartTime.value
      const progress = Math.min(elapsed / currentPoint.duration, 1)

      // 位置与旋转插值
      const newPos = new THREE.Vector3().lerpVectors(
        startPoint.position,
        targetPos,
        easeOutQuad(progress)
      )
      const newRotY = lerpAngle(
        startPoint.rotationY,
        targetRotY,
        easeOutQuad(progress)
      )

      model.position.copy(newPos)
      model.rotation.y = newRotY

      // 碰撞检测（到达某个模型附近，自动弹窗）
      if (model) {
        // 计算人物模型的包围盒
        const characterBox = new THREE.Box3().setFromObject(model)
        // 执行碰撞检测
        const collisionResult = isCloseToCollision(characterBox, wallBoundingBoxes.value)
        
        if (collisionResult.flag) {
          console.log('🚨 检测到碰撞体接近，距离:', collisionResult.distance)
          console.log('碰撞体信息:', collisionResult.box.selectMode.name)
          
          // 显示弹窗
          if (showPopup && model.parent) {
            // 从场景中找到对应的物体
            const targetObject = model.parent.getObjectByProperty('uuid', collisionResult.box.selectMode.uuid)

            if (targetObject) {
              // 检查是否已经显示了该物体的弹窗
              if (currentPopupObject.value !== collisionResult.box.selectMode.uuid) {
                // 关闭之前的弹窗
                if (currentPopupObject.value && closePopup) {
                  closePopup(`popup-${currentPopupObject.value}`)
                }
                // 显示新的弹窗
                const popupData = {
                  id: `popup-${collisionResult.box.selectMode.uuid}`,
                  title: collisionResult.box.selectMode.name,
                  content: [
                    { name: '距离', value: collisionResult.distance.toFixed(2) + ' 单位' },
                    { name: 'UUID', value: collisionResult.box.selectMode.uuid.slice(0, 8) + '...' }
                  ]
                }
                showPopup(popupData, targetObject)
                currentPopupObject.value = collisionResult.box.selectMode.uuid
                console.log('📌 显示物体弹窗:', collisionResult.box.selectMode.name)
              }
            }
          }
        } else {
          // 离开物体，关闭弹窗
          if (currentPopupObject.value && closePopup) {
            closePopup(`popup-${currentPopupObject.value}`)
            console.log('❌ 关闭物体弹窗:', currentPopupObject.value)
            currentPopupObject.value = null
          }
        }
      }

      // 到达目标点，进入停留状态
      if (progress >= 1) {
        if (currentPoint.stayTime) {
          roamState.value = 'staying'
          stayStartTime.value = currentTime // 记录停留开始时间
          console.log('🏠 到达目标点，开始停留:', currentPoint.sta || '未知位置')
        } else {
          nextRoamPoint()
        }
      }
    }
  }

  /**
   * 切换到下一个漫游点
   */
  const nextRoamPoint = () => {
    // 计算下一个点的索引
    const nextIndex = currentPointIndex.value + 1
    // 判断是否还有下一个点
    if (nextIndex < roamPoints.value.length) {
      currentPointIndex.value = nextIndex
      roamStartTime.value = performance.now()
      roamState.value = 'moving'
      // 记录下一段移动的起点
      if (model) {
        currentRoamStart.value.position.copy(model.position)
        currentRoamStart.value.rotationY = model.rotation.y
      }
      console.log('🔄 切换到下一个漫游点，起点位置:', currentRoamStart.value.position)
      console.log('下一个目标点位置:', roamPoints.value[nextIndex].position)
    } else {
      // 已遍历完所有点，停止漫游
      stopAutoRoam()
      console.log('🎉 已遍历完所有漫游点，自动停止漫游')
    }
  }

  /**
   * 缓动函数 - 二次方缓出
   * @param t 时间进度（0-1）
   * @returns 缓动后的进度值
   */
  const easeOutQuad = (t: number): number => {
    return t * (2 - t)
  }

  /**
   * 角度插值
   * @param start 起始角度
   * @param end 结束角度
   * @param t 时间进度（0-1）
   * @returns 插值后的角度
   */
  const lerpAngle = (start: number, end: number, t: number): number => {
    // 计算最短旋转路径
    let delta = end - start
    if (delta > Math.PI) delta -= 2 * Math.PI
    if (delta < -Math.PI) delta += 2 * Math.PI
    return start + delta * t
  }

  return {
    // 状态
    roamState,
    currentPointIndex,
    
    // 方法
    initAutoRoam,
    startAutoRoam,
    loadRoamConfig,
    pauseAutoRoam,
    resumeAutoRoam,
    stopAutoRoam,
    updateAutoRoam,
    isCloseToCollision
  }
}
