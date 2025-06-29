import { createRouter, createWebHistory } from 'vue-router'
import ActivityPage from '@/pages/ActivityPage.vue'
import TrackPage from '@/pages/TrackPage.vue'

const routes = [
  {
    path: '/',
    name: 'Activity',
    component: ActivityPage,
  },
  {
    path: '/track',
    name: 'Track',
    default: true,
    component: TrackPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
