import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/three/index.vue'
import AboutPage from '@/views/AboutPage.vue'

const routes = [
  {
    path: '/three',
    name: 'home',
    component: HomePage
  },
  {
    path: '/about',
    name: 'about',
    component: AboutPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router