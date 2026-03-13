import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/css/global.css'
import App from './App.vue'
import router from './router'
import { jsonUtils } from './utils/json'
import { useBasisStore } from './stores/basis'

// 初始化应用
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 加载基础配置
const { getJsonFile } = jsonUtils()
const basisStore = useBasisStore()

// 加载基础配置
async function loadBasisConfig() {
  try {
    const config = await getJsonFile(`${import.meta.env.BASE_URL}/config/basis.jsonc`)
    basisStore.setBasisConfig(config)
    console.log('✅ 基础配置加载完成')
  } catch (error) {
    console.error('❌ 基础配置加载失败:', error)
  }
}

// 加载三维设备配置
async function loadThreeDevConfig() {
  try {
    const config = await getJsonFile(`${import.meta.env.BASE_URL}/config/threeDimensionalDev.jsonc`)
    basisStore.setThreeDevConfig(config)
    console.log('✅ 三维设备配置加载完成，共', config?.threeDevs?.length || 0, '个设备')
  } catch (error) {
    console.error('❌ 三维设备配置加载失败:', error)
  }
}

// 加载墙体配置
async function loadWallConfig() {
  try {
    const config = await getJsonFile(`${import.meta.env.BASE_URL}/config/wall.jsonc`)
    basisStore.setWallConfig(config)
    console.log('✅ 墙体配置加载完成，共', config?.walls?.length || 0, '个墙体')
  } catch (error) {
    console.error('❌ 墙体配置加载失败:', error)
  }
}

// 执行配置加载
async function loadConfigs() {
  // 并行加载配置
  await Promise.all([
    loadBasisConfig(),
    loadThreeDevConfig(),
    loadWallConfig()
  ])
  // 配置加载完成后挂载应用
  app.mount('#app')
}

loadConfigs()