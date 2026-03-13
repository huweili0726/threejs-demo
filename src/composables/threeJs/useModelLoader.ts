/**
 * 模型加载模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 * @description 模型加载模块，用于加载3D模型并添加到场景中
 */
import * as THREE from 'three'
import { ref, ShallowRef } from 'vue'
import { GLTFLoader, DRACOLoader } from 'three-stdlib'

// 全局单例DRACOLoader，只初始化一次，提升加载性能
const globalDracoLoader = new DRACOLoader()
globalDracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}/draco/`)
globalDracoLoader.setDecoderConfig({ type: 'wasm' })
globalDracoLoader.setWorkerLimit(4)
globalDracoLoader.preload()

export function useModelLoader(scene: ShallowRef<THREE.Scene>, render?: () => void) {
  const isLoading = ref(false)
  const loadingText = ref('正在加载模型...')
  const modelMixers = ref<Map<string, THREE.AnimationMixer>>(new Map())
  const loadedModelMaps = ref<Map<string, THREE.Group>>(new Map())

  /**
   * 加载3D模型
   * @param options.modelUrl 模型的 URL
   * @param options.scale 模型缩放比例
   * @param options.modelInitPosition 模型初始位置
   * @param options.onLookAt 模型初始朝向
   * @param options.frontAxis 模型前方向量（默认：0,0,1，可根据不同模型自定义）
   * @param options.enableAnimation 是否启用动画
   * @param options.collisionObjects 需要添加碰撞检测的物体配置数组（可选）
   * @returns 加载完成后的 Promise，返回包含包围盒信息的数组
   */
  const loadModel = (options: {
    modelUrl: string
    scale: number
    modelInitPosition?: { x: number; y: number; z: number }
    onLookAt?: { x: number; y: number; z: number }
    frontAxis?: THREE.Vector3
    enableAnimation?: boolean
    collisionObjects?: Array<{ name: string; thickness?: number }>
  }): Promise<{ name: string; box: THREE.Box3; uuid: string }[]> => {
    const { modelUrl, scale, modelInitPosition = { x: 0, y: 0, z: 0 }, onLookAt = { x: 0, y: 0, z: 0 }, enableAnimation = true, collisionObjects = [] } = options
    return new Promise((resolve, reject) => {
      if (!scene.value) {
        reject(new Error('Scene not initialized'))
        return
      }

      // 检查模型是否已经加载过，如果已加载则直接返回
      if (loadedModelMaps.value.has(modelUrl)) {
        console.log(`⚠️ 模型 ${modelUrl} 已加载，跳过重复加载`)
        resolve([])
        return
      }

      const loader = new GLTFLoader()
      loader.setPath(`${import.meta.env.BASE_URL}/`)
      
      loader.setDRACOLoader(globalDracoLoader)
      
      loader.load(
        modelUrl,
        (gltf) => {
          const group = gltf.scene
          group.scale.set(scale, scale, scale)
          group.position.set(modelInitPosition.x, modelInitPosition.y, modelInitPosition.z)
          group.lookAt(onLookAt.x, onLookAt.y, onLookAt.z)
          
          if (enableAnimation && gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(group)
            modelMixers.value.set(modelUrl, mixer)
            
            gltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip)
              action.setLoop(THREE.LoopRepeat, Infinity)
              action.play()
            })
            
            console.log(`✅ ${modelUrl} 包含 ${gltf.animations.length} 个动画`)
          }
          
          // 存储模型配置到userData
          group.userData.frontAxis = options.frontAxis || new THREE.Vector3(0, 0, 1)
          group.userData.config = options
          
          loadedModelMaps.value.set(modelUrl, group)
          scene.value!.add(group)
          
          // 在模型加载时直接处理包围盒，避免后续重复遍历
          const boundingBoxes: { name: string; box: THREE.Box3; uuid: string }[] = []
          if (collisionObjects.length > 0) {
            group.updateMatrixWorld(true)
            
            group.traverse((child) => {
              if (child instanceof THREE.Mesh && 
                  collisionObjects.some(obj => obj.name === child.name)) {
                
                const worldMatrix = child.matrixWorld
                const box = new THREE.Box3().setFromBufferAttribute(child.geometry.attributes.position)
                box.applyMatrix4(worldMatrix)
                
                // 检查是否有厚度配置
                const collisionObject = collisionObjects.find(obj => obj.name === child.name)
                if (collisionObject && collisionObject.thickness) {
                  // 为平面添加厚度
                  const thickness = collisionObject.thickness
                  const center = new THREE.Vector3()
                  box.getCenter(center)
                  const size = new THREE.Vector3()
                  box.getSize(size)
                  
                  // 扩展包围盒，添加厚度
                  const halfThickness = thickness / 2
                  box.expandByVector(new THREE.Vector3(halfThickness, halfThickness, halfThickness))
                  
                  console.log(`为物体 ${child.name} 添加厚度: ${thickness}`)
                }
                
                boundingBoxes.push({
                  name: child.name,
                  box: box,
                  uuid: child.uuid
                })
                
                // 添加红色包围盒可视化
                const helper = new THREE.BoxHelper(child, 0xff0000)
                helper.visible = true
                helper.renderOrder = 1000
                helper.material.depthTest = false
                helper.update()
                scene.value!.add(helper)
                
                console.log(`已添加红色包围盒，名称:`, child.name)
              }
            })
          }
          
          if (render) {
            render()
          }
          resolve(boundingBoxes)
        },
        (xhr) => {
          const percent = Math.round((xhr.loaded / xhr.total) * 100)
          if (percent % 5 === 0) {
            // 可以在这里触发渲染
            if (render) {
              render()
            }
          }
        },
        (error) => {
          console.error(`❌ ${modelUrl}模型加载失败:`, error)
          reject(error)
        }
      )
    })
  }

  /**
   * 并行加载多个3D模型
   * @param options.modelUrls 模型 URL 数组
   * @param options.scale 模型缩放比例
   * @param options.modelInitPosition 模型初始位置
   * @param options.onLookAt 模型初始朝向
   * @param options.enableAnimation 是否启用动画
   * @param options.collisionObjects 需要添加碰撞检测的物体配置数组（可选）
   * @returns 加载完成后的 Promise，返回所有模型的包围盒信息
   */
  const loadModels = (options: {
    modelUrls: string[]
    scale: number
    modelInitPosition?: { x: number; y: number; z: number }
    onLookAt?: { x: number; y: number; z: number }
    enableAnimation?: boolean
    collisionObjects?: Array<{ name: string; thickness?: number }>
  }): Promise<{ name: string; box: THREE.Box3; uuid: string }[]> => {
    const { modelUrls, scale, modelInitPosition, onLookAt, enableAnimation, collisionObjects = [] } = options
    return new Promise(async (resolve, reject) => {
      try {
        isLoading.value = true
        loadingText.value = '正在并行加载3D模型...'
        const modelLoadStartTime = performance.now()
        
        const loadPromises = modelUrls.map(url => loadModel({
          modelUrl: url,
          scale,
          modelInitPosition,
          onLookAt,
          enableAnimation,
          collisionObjects
        }))
        const results = await Promise.all(loadPromises)
        
        // 合并所有模型的包围盒信息
        const allBoundingBoxes = results.flat()
        
        isLoading.value = false
        const modelLoadEndTime = performance.now()
        const totalLoadTime = modelLoadEndTime - modelLoadStartTime
        console.log(`🚀 所有模型并行加载完成总耗时：${totalLoadTime.toFixed(3)} 毫秒 (${(totalLoadTime / 1000).toFixed(3)} 秒)`)
        
        resolve(allBoundingBoxes)
      } catch (error) {
        console.error('模型加载失败:', error)
        loadingText.value = '模型加载失败'
        isLoading.value = false
        reject(error)
      }
    })
  }

  /**
   * 移动模型
   * @param options.modelUrl 模型URL
   * @param options.direction 移动方向向量
   * @param options.speed 移动速度
   */
  const moveModel = (options: {
    modelUrl: string
    direction: THREE.Vector3
    speed: number
  }) => {
    const { modelUrl, direction, speed } = options
    console.log(`移动模型 ${modelUrl} 方向 ${direction.toArray()} 速度 ${speed}`)
    const model = loadedModelMaps.value.get(modelUrl)
    if (model) {
      model.position.add(direction.multiplyScalar(speed))
      if (render) {
        render()
      }
    }
  }

  /**
   * 获取模型位置
   * @param modelUrl 模型URL
   * @returns 模型位置向量
   */
  const getModelPosition = (modelUrl: string): THREE.Vector3 | null => {
    const model = loadedModelMaps.value.get(modelUrl)
    return model ? model.position.clone() : null
  }

  /**
   * 相机跟随模型移动
   * @param modelUrl 模型URL
   * @param camera 相机对象
   * @param offset 相机偏移量（基于模型局部坐标系）
   */
  const cameraFollowModel = (modelUrl: string, camera: THREE.PerspectiveCamera | null, offset: THREE.Vector3 = new THREE.Vector3(0, 2, -5)) => {
    const model = loadedModelMaps.value.get(modelUrl)
    if (model && camera) {
      // 计算相机目标位置（基于模型局部坐标系）
      const targetPosition = new THREE.Vector3()
      targetPosition.copy(offset)
      targetPosition.applyQuaternion(model.quaternion)
      targetPosition.add(model.position)
      
      // 平滑移动相机到目标位置
      camera.position.lerp(targetPosition, 1) // 0.2是平滑因子，值越大跟随越紧密
      
      // 获取模型前方向量（优先使用模型自定义的frontAxis，默认0,0,1）
      const direction = model.userData.frontAxis ? model.userData.frontAxis.clone() : new THREE.Vector3(0, 0, 1)
      direction.applyQuaternion(model.quaternion)
      
      // 计算相机应该看向的目标点（人物前方某个点）
      const lookAtTarget = new THREE.Vector3()
      lookAtTarget.copy(model.position)
      lookAtTarget.add(direction)
      
      // 让相机看向人物所朝向的方向
      camera.lookAt(lookAtTarget)
      
      if (render) {
        render()
      }
    }
  }

  /**
   * 删除模型
   * @param modelUrl 模型URL
   */
  const removeModel = (modelUrl: string) => {
    const model = loadedModelMaps.value.get(modelUrl)
    if (model && scene.value) {
      // 停止动画
      const mixer = modelMixers.value.get(modelUrl)
      if (mixer) {
        mixer.stopAllAction()
        modelMixers.value.delete(modelUrl)
      }
      
      // 确保从场景中移除模型（无论它在哪个父对象下）
      if (model.parent) {
        model.parent.remove(model)
      } else {
        scene.value.remove(model)
      }
      
      // 清理模型资源（包括所有子对象）
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // 清理几何体
          if (child.geometry) {
            child.geometry.dispose()
          }
          // 清理材质
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
        // 清理包围盒辅助器
        if (child instanceof THREE.BoxHelper) {
          if (child.parent) {
            child.parent.remove(child)
          }
          child.material.dispose()
          child.geometry.dispose()
        }
      })
      
      // 从已加载模型Map中删除
      loadedModelMaps.value.delete(modelUrl)
      
      console.log(`✅ 已移除模型：${modelUrl}`)
      
      if (render) {
        render()
      }
    }
  }

  /**
   * 检查场景中是否存在指定名称的物体
   * @param objectName 物体名称
   * @returns 是否存在
   */
  const hasObjectByName = (objectName: string): boolean => {
    if (!scene.value) {
      return false
    }

    let found = false
    
    // 递归遍历场景中的所有物体
    scene.value.traverse((object) => {
      if (object.name === objectName) {
        found = true
      }
    })
    
    return found
  }

  return {
    isLoading,
    loadingText,
    modelMixers,
    loadedModelMaps,
    loadModel,
    loadModels,
    moveModel,
    getModelPosition,
    cameraFollowModel,
    removeModel,
    hasObjectByName
  }
}
