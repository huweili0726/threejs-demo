/**
 * 环境加载模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-25
 */
import { ref, ShallowRef } from 'vue'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'

export function useEnvironmentLoader(scene: ShallowRef<THREE.Scene>) {
  /**
   * 加载环境贴图
   * @param skyBoxUrl - 环境贴图的 URL
   * @param onLoad - 加载完成后的回调函数
   * @returns 加载进度文本
   */
  const loadEnvironment = (skyBoxUrl: string, onLoad?: () => void) => {
    const loadingText = ref('正在加载环境贴图...')
    
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(`${import.meta.env.BASE_URL}/${skyBoxUrl}`, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping
      texture.colorSpace = THREE.SRGBColorSpace
      if (scene.value) {
        scene.value.background = texture
        scene.value.environment = texture
      }
      if (onLoad) onLoad()
    }, (xhr) => {
      const progress = Math.round((xhr.loaded / xhr.total) * 100)
      loadingText.value = `正在加载环境贴图... ${progress}%`
    })
    
    return loadingText
  }

  return {
    loadEnvironment
  }
}
