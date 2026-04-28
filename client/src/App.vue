<template>
  <div class="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
    <aside v-if="$route.path !== '/login'" class="w-64 bg-slate-900 text-white p-6 flex flex-col fixed h-full z-10">
      <h1 class="text-xl font-bold border-b border-slate-700 pb-4 mb-6 tracking-tight">
        Gestor Kapazi
      </h1>
      
      <nav class="flex flex-col space-y-1 flex-1">
        <router-link to="/" class="p-3 hover:bg-slate-800 rounded-lg transition flex items-center gap-3">
          <span>🏠</span> Início
        </router-link>
        
        <router-link to="/clientes" class="p-3 hover:bg-slate-800 rounded-lg transition flex items-center gap-3">
          <span>👥</span> Clientes
        </router-link>
        
        <router-link to="/usuarios" class="p-3 hover:bg-slate-800 rounded-lg transition flex items-center gap-3">
          <span>👤</span> Usuários
        </router-link>

        <router-link to="/simulador" class="p-3 hover:bg-slate-800 rounded-lg transition flex items-center gap-3">
          <span>📊</span> Simulador
        </router-link>

        <router-link to="/produtos" class="p-3 hover:bg-slate-800 rounded-lg transition flex items-center gap-3">
          <span>📦</span> Produtos
        </router-link>

        <div class="my-4 border-t border-slate-800"></div>

        <router-link to="/configuracoes" class="p-3 hover:bg-slate-800 rounded-lg transition flex items-center gap-3">
          <span>⚙️</span> Configurações
        </router-link>

        <button @click="logout" class="w-full p-3 mt-4 text-left hover:bg-red-900/30 text-red-400 rounded-lg transition flex items-center gap-3">
          <span>🚪</span> Sair / Logout
        </button>
      </nav>

      <div class="pt-4 border-t border-slate-800 text-xs text-slate-500">
        v1.0.0 | Logado como: <span class="text-slate-300 font-bold">{{ usuarioNome }}</span>
      </div>
    </aside>

    <main :class="['flex-1 p-8 overflow-y-auto h-screen', $route.path !== '/login' ? 'ml-64' : '']">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const usuarioNome = ref('Usuário')

// Função para atualizar o nome do usuário vindo do localStorage
const atualizarNome = () => {
  usuarioNome.value = localStorage.getItem('usuarioNome') || 'Convidado'
}

onMounted(atualizarNome)

// Observa mudanças de rota para garantir que o nome seja atualizado após o login
watch(() => route.path, atualizarNome)

const logout = () => {
  if (confirm("Deseja realmente sair do sistema?")) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuarioNome')
    router.push('/login')
  }
}
</script>

<style>
/* Estilo para link ativo - Melhorado para visibilidade */
.router-link-active {
  background-color: #1e293b !important; /* slate-800 */
  color: #3b82f6 !important; /* blue-500 */
  border-left: 4px solid #3b82f6;
  font-weight: bold;
}

/* Esconde a scrollbar no Chrome/Safari do menu lateral se necessário */
aside::-webkit-scrollbar {
  display: none;
}
</style>