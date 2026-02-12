import { ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader, DRACOLoader } from 'three-stdlib'

export function useModelLoader(scene: any, render?: () => void) {
  const isLoading = ref(false)
  const loadingText = ref('正在加载模型...')

  const loadModel = (modelUrl: string): Promise<void> => {
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

  const loadModels = (modelUrls: string[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        isLoading.value = true
        loadingText.value = '正在并行加载3D模型...'
        const modelLoadStartTime = performance.now()
        
        const loadPromises = modelUrls.map(url => loadModel(url))
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

  return {
    isLoading,
    loadingText,
    loadModel,
    loadModels
  }
}
