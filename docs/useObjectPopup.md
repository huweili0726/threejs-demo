# useObjectPopup 使用说明

## 功能介绍

`useObjectPopup` 是一个基于 CSS2DRenderer 的 3D 物体弹窗模块，支持双击 3D 场景中的物体时在物体附近弹出 HTML 弹窗。

## 主要特性

- ✅ 使用 CSS2DRenderer 渲染 HTML 弹窗
- ✅ 双击物体自动弹出弹窗
- ✅ 支持自定义弹窗内容和样式
- ✅ 弹窗跟随 3D 物体位置
- ✅ 支持关闭按钮
- ✅ 可过滤哪些物体可以弹出弹窗

## 基本使用

### 1. 导入模块

```typescript
import { useObjectPopup } from '@/composables/threeJs/useObjectPopup'
import '@/assets/css/object-popup.css' // 导入弹窗样式
```

### 2. 初始化

```typescript
const { initDoubleClickPopup, updateCSS2DRenderer, handleResize } = useObjectPopup(
  camera as any,
  scene as any,
  threeJsContainer
)
```

### 3. 启动双击弹窗功能

```typescript
onMounted(() => {
  // 初始化双击弹窗
  const cleanupPopup = initDoubleClickPopup({
    // 自定义弹窗数据（可选）
    getPopupData: (object: THREE.Object3D) => {
      // 根据物体名称或其他属性返回弹窗数据
      if (object.name === 'Cube109_1') {
        return {
          id: `popup-${Date.now()}`,
          title: '设备信息',
          content: [
            { name: '设备名称', value: 'Cube109_1' },
            { name: '状态', value: '运行中' },
            { name: '温度', value: '25°C' }
          ],
          position: {
            x: object.position.x,
            y: object.position.y + 1,
            z: object.position.z
          }
        }
      }
      return null
    },
    // 过滤物体（可选）
    filterObject: (object: THREE.Object3D) => {
      // 只允许特定名称的物体弹出弹窗
      return ['Cube109_1', 'Cube109_2'].includes(object.name)
    }
  })

  // 保存清理函数
  cleanupPopupRef.value = cleanupPopup
})
```

### 4. 在动画循环中更新

```typescript
const animate = () => {
  requestAnimationFrame(animate)
  
  // 更新 CSS2DRenderer
  updateCSS2DRenderer()
  
  // 其他渲染逻辑...
  render()
}

animate()
```

### 5. 处理窗口大小变化

```typescript
onMounted(() => {
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    const { width, height } = useWindowSize()
    handleResize(width.value, height.value)
  })
})
```

### 6. 组件卸载时清理

```typescript
onBeforeUnmount(() => {
  if (cleanupPopupRef.value) {
    cleanupPopupRef.value()
  }
})
```

## API 文档

### initDoubleClickPopup(options)

初始化双击弹窗功能。

**参数：**
- `options.getPopupData?: (object: THREE.Object3D) => PopupData | null` - 根据选中物体获取弹窗数据的回调函数
- `options.filterObject?: (object: THREE.Object3D) => boolean` - 过滤物体的回调函数，返回 true 表示可以弹出弹窗

**返回值：**
- `() => void` - 清理函数，用于移除事件监听器和清理资源

### showPopup(data)

手动显示弹窗。

**参数：**
- `data.id: string` - 弹窗 ID
- `data.title: string` - 弹窗标题
- `data.content: PopupContentItem[]` - 弹窗内容数组
- `data.position: { x: number; y: number; z: number }` - 弹窗位置

### closePopup()

关闭当前显示的弹窗。

### updateCSS2DRenderer()

更新 CSS2DRenderer（需要在动画循环中调用）。

### handleResize(width, height)

窗口大小改变时更新 CSS2DRenderer。

**参数：**
- `width: number` - 新的宽度
- `height: number` - 新的高度

## 完整示例

```vue
<template>
  <div class="threeJs-container" ref="threeJsContainer"></div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useThreeScene } from '@/composables/threeJs/useThreeScene'
import { useObjectPopup } from '@/composables/threeJs/useObjectPopup'
import '@/assets/css/object-popup.css'

const threeJsContainer = ref<HTMLDivElement>()
const { scene, camera, initScene, render } = useThreeScene(threeJsContainer)
const { initDoubleClickPopup, updateCSS2DRenderer, handleResize } = useObjectPopup(
  camera as any,
  scene as any,
  threeJsContainer
)

let cleanupPopup: (() => void) | null = null

onMounted(() => {
  // 初始化场景
  initScene({
    coordinateAxis: true,
    cameraPosition: new THREE.Vector3(-9, 5, -15)
  })

  // 初始化双击弹窗
  cleanupPopup = initDoubleClickPopup({
    getPopupData: (object: THREE.Object3D) => {
      // 自定义弹窗数据
      return {
        id: `popup-${Date.now()}`,
        title: object.name || '未命名物体',
        content: [
          { name: '类型', value: object.type },
          { name: 'UUID', value: object.uuid.slice(0, 8) + '...' }
        ],
        position: {
          x: object.position.x,
          y: object.position.y + 1,
          z: object.position.z
        }
      }
    }
  })

  // 开始动画循环
  animate()
})

const animate = () => {
  requestAnimationFrame(animate)
  updateCSS2DRenderer()
  render()
}

onBeforeUnmount(() => {
  if (cleanupPopup) {
    cleanupPopup()
  }
})
</script>
```

## 样式自定义

弹窗样式定义在 `src/assets/css/object-popup.css` 文件中，你可以根据需要自定义样式：

```css
.three-pop {
  pointer-events: auto;
  user-select: none;
}

.dev-info-div {
  background: linear-gradient(135deg, rgba(0, 160, 198, 0.95) 0%, rgba(0, 120, 160, 0.95) 100%);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  /* ... 更多样式 */
}
```

## 注意事项

1. **CSS2DRenderer 必须在动画循环中更新**：确保在 `animate()` 函数中调用 `updateCSS2DRenderer()`
2. **窗口大小变化时需要更新**：在窗口大小变化时调用 `handleResize(width, height)`
3. **组件卸载时需要清理**：在 `onBeforeUnmount` 中调用清理函数
4. **弹窗样式文件必须导入**：确保导入了 `object-popup.css` 样式文件

## 与现有功能的集成

`useObjectPopup` 可以与现有的 `useObjectSelection` 功能配合使用：

```typescript
// 同时使用物体选择和弹窗功能
const { initDoubleClickSelection } = useObjectSelection(camera as any, scene as any)
const { initDoubleClickPopup, updateCSS2DRenderer } = useObjectPopup(
  camera as any,
  scene as any,
  threeJsContainer
)

onMounted(() => {
  // 初始化物体选择（蓝色高亮）
  initDoubleClickSelection({
    highlightEnabled: true
  })

  // 初始化双击弹窗
  initDoubleClickPopup({
    getPopupData: (object) => {
      // 返回弹窗数据
      return { /* ... */ }
    }
  })
})
```

这样双击物体时，会同时显示蓝色高亮和弹窗信息。
