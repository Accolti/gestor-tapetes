<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const email = ref('')
const senha = ref('')
const erro = ref('')
const router = useRouter()

const primeiroAcesso = () => {
  // Redireciona para uma nova rota que criaremos
  router.push('/definir-senha')
}

const logar = async () => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, {
      email: email.value,
      senha: senha.value
    })

    // Salva o Token e o Nome no navegador
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('usuarioNome', res.data.user.nome)
    localStorage.setItem('usuarioLogado', JSON.stringify(res.data.user));
    
    // Redireciona para o Início
    router.push('/')
    // Recarrega a página para o Menu Lateral perceber que logou
    window.location.reload()
  } catch (err) {
    erro.value = err.response?.data?.error || "Erro ao conectar com o servidor"
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-extrabold text-slate-800">Gestor Kapazi</h1>
        <p class="text-slate-500 mt-2">Acesse sua conta para continuar</p>
      </div>

      <div v-if="erro" class="mb-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-bold text-center">
        ⚠️ {{ erro }}
      </div>
      

      <form @submit.prevent="logar" class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase">E-mail</label>
          <input v-model="email" type="email" required class="w-full border rounded-lg p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500 transition">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase">Senha</label>
          <input v-model="senha" type="password" required class="w-full border rounded-lg p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500 transition">
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-1">
          Entrar no Sistema
        </button>
        <div class="mt-6 text-center space-y-2">
  <a href="#" @click.prevent="primeiroAcesso" class="block text-sm text-blue-600 hover:underline font-medium">
    Primeiro acesso? Cadastre sua senha
  </a>
  <a href="#" class="block text-xs text-slate-400 hover:text-slate-600 transition">
    Esqueci minha senha
  </a>
</div>
      </form>
    </div>
  </div>
</template>