import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Clientes from '@/views/Clientes.vue'
import Simulador from '@/views/Simulador.vue'
import Usuarios from '@/views/Usuarios.vue'
import Configuracoes from '@/views/Configuracoes.vue'
import Orcamento from '@/views/Orcamento.vue'
import Login from '@/views/Login.vue'
import DefinirSenha from '@/views/DefinirSenha.vue' // <--- ADICIONE ESTE IMPORT

const routes = [
  { path: '/login', component: Login },
  { path: '/definir-senha', component: DefinirSenha }, // <--- ROTA REGISTRADA
  { path: '/', component: Home },
  { path: '/clientes', component: Clientes },
  { path: '/simulador', component: Simulador },
  { path: '/usuarios', component: Usuarios },
  { path: '/orcamento', component: Orcamento },
  { path: '/configuracoes', component: Configuracoes },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  // 1. Se NÃO está logado e tenta acessar algo que NÃO seja Login ou Definir Senha -> Manda pro Login
  if (!token && to.path !== '/login' && to.path !== '/definir-senha') {
    next('/login');
  } 
  // 2. Se JÁ está logado e tenta ir pro Login -> Manda pro Início
  else if (token && to.path === '/login') {
    next('/');
  } 
  // 3. Em qualquer outro caso (ir para definir-senha sem token, ou navegar logado) -> Deixa passar
  else {
    next();
  }
});

export default router