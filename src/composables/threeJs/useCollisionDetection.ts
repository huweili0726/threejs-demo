/**
 * 碰撞检测模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-26
 */
import * as THREE from 'three'
import { ref } from 'vue'

// 定义包围盒类型
interface WallBoundingBox {
  box: THREE.Box3
  selectMode: {
    name: string
    uuid: string
  }
}

// 定义包围盒辅助对象类型
interface MeshBoxHelper extends THREE.BoxHelper {
  // 扩展BoxHelper类型
}

export function useCollisionDetection() {
  // 控制变量
  const wallBoundingBoxes = ref<WallBoundingBox[]>([])
  const wallHelpers = ref<MeshBoxHelper[]>([])
  const characterBoundingBox = ref<THREE.Box3 | null>(null)
  const characterHelper = ref<MeshBoxHelper | null>(null)
  
  /**
   * 为指定名称的物体添加红色包围盒
   * @param options.scene 场景对象
   * @param options.objectNames 要添加包围盒的物体名称数组
   * @param options.loadedModelMaps 已加载的模型Map
   */
  const addBoundingBoxesToObjects = (options: {
    scene: THREE.Scene
    objectNames: string[]
    loadedModelMaps: Map<string, THREE.Group>
  }) => {
    const { scene, objectNames, loadedModelMaps } = options
    
    // 清空之前的包围盒和辅助对象
    wallBoundingBoxes.value = []
    wallHelpers.value.forEach(helper => scene.remove(helper))
    wallHelpers.value = []
    
    // 遍历所有加载的模型
    loadedModelMaps.forEach(model => {
      model.updateMatrixWorld(true)
      
      // 遍历模型的所有子对象
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && 
            objectNames.some(name => child.name === name)) {
          
          const worldMatrix = child.matrixWorld // 获取子对象的世界矩阵
          const box = new THREE.Box3().setFromBufferAttribute(child.geometry.attributes.position) // 创建包围盒
          box.applyMatrix4(worldMatrix) // 将世界矩阵应用到包围盒上

          wallBoundingBoxes.value.push({ 
            "box": box, 
            "selectMode": { "name": child.name, "uuid": child.uuid } 
          }) // 将计算好的包围盒添加到数组中

          // 添加红色包围盒可视化
          const helper = new THREE.BoxHelper(child, 0xff0000) as MeshBoxHelper
          helper.visible = true
          helper.renderOrder = 1000
          helper.material.depthTest = false
          helper.update()
          wallHelpers.value.push(helper)
          scene.add(helper)

          console.log(`已添加红色包围盒，名称:`, child.name)
        }
      })
    })
  }
  
  /**
   * 为人物模型添加红色包围盒
   * @param options.scene 场景对象
   * @param options.modelUrl 人物模型URL
   * @param options.loadedModelMaps 已加载的模型Map
   */
  const addCharacterBoundingBox = (options: {
    scene: THREE.Scene
    modelUrl: string
    loadedModelMaps: Map<string, THREE.Group>
  }) => {
    const { scene, modelUrl, loadedModelMaps } = options
    
    // 移除之前的人物包围盒
    if (characterHelper.value) {
      scene.remove(characterHelper.value)
      characterHelper.value = null
    }
    characterBoundingBox.value = null
    
    const model = loadedModelMaps.get(modelUrl)
    if (!model) return
    
    model.updateMatrixWorld(true)
    
    // 为人物模型添加包围盒
    const helper = new THREE.BoxHelper(model, 0xff0000) as MeshBoxHelper
    helper.visible = true
    helper.renderOrder = 1000
    helper.material.depthTest = false
    helper.update()
    characterHelper.value = helper
    scene.add(helper)
    
    // 计算人物模型的包围盒
    const box = new THREE.Box3().setFromObject(model)
    characterBoundingBox.value = box
    
    console.log(`已添加人物模型红色包围盒`)
  }
  
  /**
   * 更新所有包围盒的位置
   */
  const updateBoundingBoxes = () => {
    // 更新墙体包围盒辅助对象
    wallHelpers.value.forEach(helper => {
      helper.update()
    })
    
    // 更新人物包围盒辅助对象
    if (characterHelper.value) {
      characterHelper.value.update()
    }
  }
  
  /**
   * 检测人物是否与墙体发生碰撞
   * @param characterBox 人物的包围盒
   * @returns 是否发生碰撞
   */
  const checkCollision = (characterBox: THREE.Box3): boolean => {
    // 遍历所有目标墙体的包围盒
    for (const wallBox of wallBoundingBoxes.value) {
      // 检测人物碰撞盒是否与墙体包围盒重叠
      if (characterBox.intersectsBox(wallBox.box)) {
        return true
      }
    }
    return false
  }
  
  return {
    wallBoundingBoxes,
    addBoundingBoxesToObjects,
    addCharacterBoundingBox,
    updateBoundingBoxes,
    checkCollision
  }
}
