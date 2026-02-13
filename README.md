# Three.js + Vue 3 演示项目

一个基于 Vue 3 + TypeScript + Three.js 的 3D 可视化演示项目，使用 Vite 作为构建工具，提供了现代化的 3D Web 开发体验。

## 技术栈

| 技术/依赖 | 版本 | 用途 |
|---------|------|------|
| Vue | ^3.5.22 | 前端框架 |
| TypeScript | ^5.9.3 | 类型系统 |
| Vite | ^7.1.11 | 构建工具 |
| Vue Router | ^4.6.3 | 路由管理 |
| Three.js | ^0.182.0 | 3D 图形库 |
| three-stdlib | ^2.36.1 | Three.js 扩展库 |
| @vueuse/core | ^14.2.1 | Vue 组合式工具集 |
| Less | ^4.5.1 | CSS 预处理器 |
| @vitejs/plugin-vue | ^6.0.1 | Vue 插件 |
| vue-tsc | ^3.1.1 | Vue TypeScript 编译器 |

## 项目结构

```
├── src/
│   ├── assets/          # 静态资源
│   │   └── css/         # 全局样式
│   ├── components/      # 全局组件
│   │   └── threeJs/     # Three.js 组件
│   ├── composables/     # 组合式函数（Hooks）
│   │   └── threeJs/     # Three.js 相关 Hooks
│   ├── views/           # 页面视图
│   │   └── three/       # Three.js 页面
│   ├── router/          # 路由配置
│   ├── utils/           # 工具函数
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── public/              # 公共资源
│   ├── draco/           # DRACO 压缩解码器
│   ├── glb/             # 3D 模型文件
│   └── hdr/             # 环境贴图
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发服务器

启动本地开发服务器：

```bash
npm run dev
```

默认会在 http://localhost:5173 启动开发服务器。

### 构建生产版本

构建用于生产的应用：

```bash
npm run build
```

### 预览生产构建

预览生产构建结果：

```bash
npm run preview
```

## 功能特性

- **3D 模型加载**：支持 GLB/GLTF 格式模型加载
- **DRACO 压缩**：使用 DRACO 压缩技术优化模型加载速度
- **并行加载**：支持多个模型并行加载，提升加载效率
- **环境贴图**：支持 HDR 环境贴图，增强真实感
- **相机控制**：支持 OrbitControls 相机控制
- **视角飞行**：平滑的相机飞行动画效果
- **坐标轴显示**：可选的 XYZ 坐标轴辅助器
- **性能优化**：使用 shallowRef 避免 Three.js 对象的深度响应式
- **人物移动控制**：支持 WASD/方向键控制人物移动和转向
- **相机跟随**：智能相机跟随系统，确保相机始终在人物后方
- **平滑移动**：使用线性插值实现相机和人物的平滑移动
- **模块化设计**：将核心逻辑封装为独立的 hook，提高代码可维护性
- **键盘事件管理**：自动清理键盘事件监听器，避免内存泄漏

## 开发说明

### 添加新页面

1. 在 `src/views/` 目录下创建新的 Vue 组件
2. 在 `src/router/index.ts` 中添加新的路由配置

### Three.js 组件开发

- Three.js 组件放在 `src/components/threeJs/` 目录下
- 使用组合式 API（Composables）管理 Three.js 逻辑
- 相关 Hooks 放在 `src/composables/threeJs/` 目录下
- 遵循 Vue 3 组合式 API 的最佳实践

### 模型资源

- 3D 模型文件放在 `public/glb/` 目录下
- DRACO 解码器放在 `public/draco/` 目录下
- 环境贴图放在 `public/hdr/` 目录下

## Three.js Hooks 说明

项目提供了四个主要的 Three.js 组合式函数，实现了核心功能的模块化和可复用性：

### useThreeScene
- **功能**：场景初始化、相机、渲染器、控制器管理
- **主要方法**：
  - `initScene`：初始化 Three.js 场景、相机和渲染器
  - `render`：执行渲染操作
  - `onWindowResize`：处理窗口大小变化
  - `setAnimationUpdateCallback`：设置动画更新回调
  - `startAnimationLoop`：启动动画循环
  - `stopAnimationLoop`：停止动画循环
  - `flyTo`：平滑相机飞行动画

### useModelLoader
- **功能**：3D 模型加载、DRACO 压缩支持、并行加载、相机跟随逻辑
- **主要方法**：
  - `loadModel`：加载单个 3D 模型
  - `loadModels`：并行加载多个 3D 模型
  - `updateAnimations`：更新模型动画
  - `moveModel`：移动模型位置
  - `cameraFollowModel`：相机跟随模型移动

### useEnvironmentLoader
- **功能**：环境贴图加载
- **主要方法**：
  - `loadEnvironment`：加载 HDR 环境贴图

### useCharacterMovement
- **功能**：人物移动控制、键盘事件管理、方向向量计算
- **主要方法**：
  - `initKeyboardEvents`：初始化键盘事件监听，返回清理函数
  - `updateCharacterMovement`：更新人物移动和旋转状态

## 人物移动控制

### 控制方式
- **W/↑**：向前移动
- **S/↓**：向后移动
- **A/←**：向左转向
- **D/→**：向右转向

### 技术实现
- 使用 `useCharacterMovement` hook 管理移动逻辑
- 基于模型局部坐标系计算移动方向
- 使用四元数处理旋转，避免万向锁问题
- 自动清理键盘事件监听器，防止内存泄漏

## 性能优化建议

1. 使用 DRACO 压缩减少模型文件大小
2. 使用并行加载提升加载速度
3. 使用 shallowRef 避免 Three.js 对象的深度响应式
4. 合理设置渲染器的像素比限制
5. 使用环境贴图替代复杂的光照计算
6. 使用线性插值（lerp）实现平滑移动，避免相机抖动
7. 基于时间增量（deltaTime）控制移动速度，确保不同帧率下速度一致
8. 模块化设计，将复杂逻辑分离到独立的 hook 中，提高代码可维护性
