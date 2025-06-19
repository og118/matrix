import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'

const routes = [
  {
    path: '/',
    name: 'Activity',
    component: {
      template:
        '<div class="flex items-center justify-center h-full pt-16"><h1 class="text-2xl">Activity Page Coming Soon</h1></div>',
    },
  },
  {
    path: '/track',
    name: 'Track',
    component: HomePage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
