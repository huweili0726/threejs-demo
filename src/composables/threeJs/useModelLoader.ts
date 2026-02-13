import { ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader, DRACOLoader } from 'three-stdlib'

export function useModelLoader(scene: any, render?: () => void) {
  const isLoading = ref(false)
  const loadingText = ref('正在加载模型...')
  const modelMixers = ref<Map<string, THREE.AnimationMixer>>(new Map())
  const loadedModels = ref<Map<string, THREE.Group>>(new Map())

  /**
   * 加载3D模型
   * @param options.modelUrl 模型的 URL
   * @param options.scale 模型缩放比例
   * @param options.modelInitPosition 模型初始位置
   * @param options.onLookAt 模型初始朝向
   * @param options.enableAnimation 是否启用动画
   * @returns 加载完成后的 Promise
   */
  const loadModel = (options: {
    modelUrl: string
    scale: number
    modelInitPosition?: { x: number; y: number; z: number }
    onLookAt?: { x: number; y: number; z: number }
    enableAnimation?: boolean
  }): Promise<void> => {
    const { modelUrl, scale, modelInitPosition = { x: 0, y: 0, z: 0 }, onLookAt = { x: 0, y: 0, z: 0 }, enableAnimation = true } = options
    return new Promise((resolve, reject) => {
      if (!scene.value) {
        reject(new Error('Scene not initialized'))
        return
      }

      const loader = new GLTFLoader()
      loader.setPath(`${import.meta.env.BASE_URL}/`)
      
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}/draco/`)
      dracoLoader.setDecoderConfig({ type: 'wasm' })
      dracoLoader.setWorkerLimit(4)
      dracoLoader.preload()
      loader.setDRACOLoader(dracoLoader)
      
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
          
          loadedModels.value.set(modelUrl, group)
          scene.value!.add(group)
          if (render) {
            render()
          }
          resolve()
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
   * @returns 加载完成后的 Promise
   */
  const loadModels = (options: {
    modelUrls: string[]
    scale: number
    modelInitPosition?: { x: number; y: number; z: number }
    onLookAt?: { x: number; y: number; z: number }
    enableAnimation?: boolean
  }): Promise<void> => {
    const { modelUrls, scale, modelInitPosition, onLookAt, enableAnimation } = options
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
          enableAnimation
        }))
        await Promise.all(loadPromises)
        
        isLoading.value = false
        const modelLoadEndTime = performance.now()
        const totalLoadTime = modelLoadEndTime - modelLoadStartTime
        console.log(`🚀 所有模型并行加载完成总耗时：${totalLoadTime.toFixed(3)} 毫秒 (${(totalLoadTime / 1000).toFixed(3)} 秒)`)
        
        resolve()
      } catch (error) {
        console.error('模型加载失败:', error)
        loadingText.value = '模型加载失败'
        isLoading.value = false
        reject(error)
      }
    })
  }

  /**
   * 更新所有动画
   * @param deltaTime 时间增量（秒）
   */
  const updateAnimations = (deltaTime: number) => {
    modelMixers.value.forEach((mixer) => {
      mixer.update(deltaTime)
    })
  }

  /**
   * 移动模型
   * @param modelUrl 模型URL
   * @param direction 移动方向向量
   * @param speed 移动速度
   */
  const moveModel = (modelUrl: string, direction: THREE.Vector3, speed: number) => {
    console.log(`移动模型 ${modelUrl} 方向 ${direction.toArray()} 速度 ${speed}`)
    const model = loadedModels.value.get(modelUrl)
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
    const model = loadedModels.value.get(modelUrl)
    return model ? model.position.clone() : null
  }

  /**
   * 固定相机在人物头顶
   * @param modelUrl 模型URL
   * @param camera 相机对象
   * @param offset 相机偏移量
   */
  const attachCameraToModel = (modelUrl: string, camera: THREE.PerspectiveCamera | null, offset: THREE.Vector3 = new THREE.Vector3(0, 2, -5)) => {
    const model = loadedModels.value.get(modelUrl)
    if (model && camera) {
      // 计算相机目标位置（人物头顶）
      const targetPosition = new THREE.Vector3()
      targetPosition.copy(model.position)
      targetPosition.y += offset.y
      targetPosition.x += offset.x
      targetPosition.z += offset.z
      
      // 设置相机位置
      camera.position.copy(targetPosition)
      
      // 获取模型朝向向量
      const direction = new THREE.Vector3(0, 0, 1)
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
   * 相机跟随模型移动
   * @param modelUrl 模型URL
   * @param camera 相机对象
   * @param offset 相机偏移量
   */
  const cameraFollowModel = (modelUrl: string, camera: THREE.PerspectiveCamera | null, offset: THREE.Vector3 = new THREE.Vector3(0, 2, -5)) => {
    const model = loadedModels.value.get(modelUrl)
    if (model && camera) {
      // 计算相机目标位置（人物头顶）
      const targetPosition = new THREE.Vector3()
      targetPosition.copy(model.position)
      targetPosition.y += offset.y
      targetPosition.x += offset.x
      targetPosition.z += offset.z
      
      // 平滑移动相机到目标位置
      camera.position.lerp(targetPosition, 0.1) // 0.1是平滑因子
      
      // 获取模型朝向向量
      const direction = new THREE.Vector3(0, 0, 1)
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

  return {
    isLoading,
    loadingText,
    modelMixers,
    loadedModels,
    loadModel,
    loadModels,
    updateAnimations,
    moveModel,
    getModelPosition,
    attachCameraToModel,
    cameraFollowModel
  }
}
