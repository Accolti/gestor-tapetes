import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Clientes from './views/Clientes.vue'
import Simulador from './views/Simulador.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/clientes', component: Clientes },
  { path: '/simulador', component: Simulador },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router