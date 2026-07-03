import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import HubView from '../components/layout/HubView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'hub', component: HubView },
  {
    path: '/play/:gameId',
    name: 'play',
    component: () => import('../components/layout/MinigameHost.vue'),
    props: true,
  },
  {
    path: '/gacha',
    name: 'gacha',
    component: () => import('../components/gacha/GachaScreen.vue'),
  },
  {
    path: '/devlab',
    name: 'devlab',
    component: () => import('../components/dev/EngineLab.vue'),
  },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
})
