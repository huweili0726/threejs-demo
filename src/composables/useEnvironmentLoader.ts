import { ref } from 'vue'
import * as THREE from 'three'
import { RGBELoader } from 'three-stdlib'

export function useEnvironmentLoader(scene: any) {
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
