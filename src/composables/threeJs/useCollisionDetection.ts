/**
 * 碰撞检测模块
 * 
 * @author huweili
 * @email czxyhuweili@163.com
 * @version 1.0.0
 * @date 2026-02-26
 * @description 碰撞检测模块，用于检测角色与墙壁的碰撞
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
type MeshBoxHelper = THREE.BoxHelper | THREE.Box3Helper

export function useCollisionDetection() {
  // 控制变量
  const wallBoundingBoxes = ref<WallBoundingBox[]>([])
  const wallHelpers = ref<MeshBoxHelper[]>([])
  const characterBoundingBox = ref<THREE.Box3 | null>(null)
  const characterHelper = ref<MeshBoxHelper | null>(null)
  
  /**
   * 为指定名称的物体添加红色包围盒（单个模型）
   * @param options.scene 场景对象
   * @param options.objectNames 要添加包围盒的物体名称数组
   * @param options.model 单个模型对象
   */
  const addBoundingBoxesToModel = (options: {
    scene: THREE.Scene
    objectNames: string[]
    model: THREE.Group
  }) => {
    const { scene, objectNames, model } = options
    
    model.updateMatrixWorld(true)
    
    // 遍历模型的所有子对象
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && 
          objectNames.some(name => child.name === name)) {
        
        const worldMatrix = child.matrixWorld
        const box = new THREE.Box3().setFromBufferAttribute(child.geometry.attributes.position)
        box.applyMatrix4(worldMatrix)

        wallBoundingBoxes.value.push({ 
          "box": box, 
          "selectMode": { "name": child.name, "uuid": child.uuid } 
        })

        const helper = new THREE.BoxHelper(child, 0xff0000)
        helper.visible = true
        helper.renderOrder = 1000
        if (helper.material instanceof THREE.Material) {
          helper.material.depthTest = false
        }
        helper.update()
        wallHelpers.value.push(helper as MeshBoxHelper)
        scene.add(helper)

        console.log(`已添加红色包围盒，名称:`, child.name)
      }
    })
  }

  /**
   * 为指定名称的物体添加红色包围盒（多个模型）
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
      addBoundingBoxesToModel({
        scene,
        objectNames,
        model
      })
    })
  }

  /**
   * 直接从 loadModels 返回的包围盒信息设置碰撞检测数据
   * @param boundingBoxes 从 loadModels 返回的包围盒信息数组
   * @param scene 场景对象，用于添加包围盒辅助器
   */
  const setBoundingBoxesFromLoadResult = (boundingBoxes: { name: string; box: THREE.Box3; uuid: string }[], scene?: THREE.Scene) => {
    // 清空之前的包围盒数据
    wallBoundingBoxes.value = []
    
    // 清空之前的包围盒辅助器
    if (scene) {
      wallHelpers.value.forEach(helper => scene.remove(helper))
      wallHelpers.value = []
    }
    
    // 直接使用从 loadModels 返回的包围盒信息
    boundingBoxes.forEach(item => {
      wallBoundingBoxes.value.push({
        box: item.box,
        selectMode: { name: item.name, uuid: item.uuid }
      })
      
      // 创建包围盒辅助器
      if (scene) {
        const helper = new THREE.Box3Helper(item.box, 0xff0000) as MeshBoxHelper
        helper.visible = true
        helper.renderOrder = 1000
        if (helper.material instanceof THREE.Material) {
          helper.material.depthTest = false
        }
        wallHelpers.value.push(helper)
        scene.add(helper)
      }
    })
    
    console.log(`已设置 ${boundingBoxes.length} 个碰撞包围盒`)
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
    const helper = new THREE.BoxHelper(model, 0xff0000)
    helper.visible = true
    helper.renderOrder = 1000
    if (helper.material instanceof THREE.Material) {
      helper.material.depthTest = false
    }
    helper.update()
    characterHelper.value = helper as MeshBoxHelper
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
      // 只有 BoxHelper 才有 update() 方法，Box3Helper 不需要更新
      if ('update' in helper) {
        helper.update()
      }
    })
    
    // 更新人物包围盒辅助对象
    if (characterHelper.value && 'update' in characterHelper.value) {
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
    addBoundingBoxesToModel,
    addBoundingBoxesToObjects,
    setBoundingBoxesFromLoadResult,
    addCharacterBoundingBox,
    updateBoundingBoxes,
    checkCollision
  }
}
