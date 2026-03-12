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

async function loadBasisConfig() {
  try {
    const config = await getJsonFile(`${import.meta.env.BASE_URL}/config/basis.jsonc`)
    basisStore.setBasisConfig(config)
    console.log('✅ 基础配置加载完成:', config)
    // 配置加载完成后挂载应用
    app.mount('#app')
  } catch (error) {
    console.error('❌ 基础配置加载失败:', error)
    // 即使配置加载失败，也挂载应用
    app.mount('#app')
  }
}

// 执行配置加载
loadBasisConfig()