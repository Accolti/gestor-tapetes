<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const email = ref('')
const novaSenha = ref('')
const confirmarSenha = ref('')
const etapa = ref(1) // 1: Verificar e-mail, 2: Digitar nova senha
const erro = ref('')
const sucesso = ref('')
const router = useRouter()

const verificarEmail = async () => {
  try {
    erro.value = ''
    // Rota que verifica se o usuário existe e se está ativo
    await axios.post('http://localhost:3000/api/usuarios/verificar-email', { email: email.value })
    etapa.value = 2
  } catch (err) {
    erro.value = "E-mail não encontrado ou usuário inativo."
  }
}

const atualizarSenha = async () => {
  if (novaSenha.value !== confirmarSenha.value) {
    return erro.value = "As senhas não coincidem."
  }
  try {
    await axios.post('http://localhost:3000/api/usuarios/definir-senha', {
      email: email.value,
      senha: novaSenha.value
    })
    sucesso.value = "Senha cadastrada com sucesso! Redirecionando..."
    setTimeout(() => router.push('/login'), 3000)
  } catch (err) {
    erro.value = "Erro ao salvar nova senha."
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-2xl p-10">
      <h2 class="text-2xl font-bold text-slate-800 text-center mb-6">Definir Senha</h2>
      
      <div v-if="erro" class="mb-4 p-3 bg-red-100 text-red-700 rounded text-center font-bold">{{ erro }}</div>
      <div v-if="sucesso" class="mb-4 p-3 bg-green-100 text-green-700 rounded text-center font-bold">{{ sucesso }}</div>

      <form v-if="etapa === 1" @submit.prevent="verificarEmail" class="space-y-4">
        <p class="text-slate-500 text-sm">Informe o e-mail cadastrado pelo seu administrador para validar seu acesso.</p>
        <input v-model="email" type="email" placeholder="Seu e-mail" required class="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500">
        <button type="submit" class="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition">Verificar E-mail</button>
        <button @click="router.push('/login')" type="button" class="w-full text-slate-400 text-sm italic">Voltar ao login</button>
      </form>

      <form v-if="etapa === 2" @submit.prevent="atualizarSenha" class="space-y-4">
        <p class="text-blue-600 text-sm font-bold italic">E-mail validado! Escolha sua senha abaixo.</p>
        <input v-model="novaSenha" type="password" placeholder="Nova Senha" required class="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500">
        <input v-model="confirmarSenha" type="password" placeholder="Confirme a Senha" required class="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500">
        <button type="submit" class="w-full bg-green-600 text-white p-3 rounded-xl font-bold hover:bg-green-700 transition">Salvar Senha</button>
      </form>
    </div>
  </div>
</template>