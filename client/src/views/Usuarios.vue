<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const usuario = ref({
  nome: '',
  email: '',
  senha: '',
  nivel_acesso: 'vendedor',
  comissao_padrao: 0,
  desconto_maximo: 0,
  ativo: 1,
  telefones: [{ numero: '', tipo: 'Celular' }],
  enderecos: [{ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' }]
})

const listaUsuarios = ref([])
const mensagem = ref({ texto: '', tipo: '' })

const carregarUsuarios = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/usuarios')
    listaUsuarios.value = res.data
  } catch (error) {
    console.error("Erro ao carregar usuários:", error)
  }
}

onMounted(carregarUsuarios)

// Funções Dinâmicas
const addTelefone = () => usuario.value.telefones.push({ numero: '', tipo: 'Celular' })
const removeTelefone = (index) => usuario.value.telefones.splice(index, 1)
const addEndereco = () => usuario.value.enderecos.push({ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' })
const removeEndereco = (index) => usuario.value.enderecos.splice(index, 1)

const salvarUsuario = async () => {
  try {
    mensagem.value = { texto: 'Processando...', tipo: 'info' }
    if (usuario.value.id) {
      await axios.put(`http://localhost:3000/api/usuarios/${usuario.value.id}`, usuario.value)
      mensagem.value = { texto: '✅ Usuário atualizado!', tipo: 'sucesso' }
    } else {
      await axios.post('http://localhost:3000/api/usuarios', usuario.value)
      mensagem.value = { texto: '✅ Usuário cadastrado!', tipo: 'sucesso' }
    }
    resetarForm()
    carregarUsuarios()
  } catch (error) {
    mensagem.value = { texto: '❌ Erro ao salvar usuário.', tipo: 'erro' }
  }
}

const editarUsuario = (item) => {
  usuario.value = { ...item }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetarForm = () => {
  usuario.value = {
    nome: '', email: '', senha: '', nivel_acesso: 'vendedor', comissao_padrao: 0, desconto_maximo: 0, ativo: 1,
    telefones: [{ numero: '', tipo: 'Celular' }],
    enderecos: [{ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' }]
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">{{ usuario.id ? 'Editar Usuário' : 'Novo Usuário' }}</h1>
      <button @click="salvarUsuario" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-lg transition">
        Salvar Usuário
      </button>
    </div>

    <div v-if="mensagem.texto" :class="['p-4 mb-6 rounded-lg font-medium', mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ mensagem.texto }}
    </div>

    <div class="space-y-6">
      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-lg font-semibold text-slate-700 mb-4 flex items-center border-b pb-2">🔑 Acesso e Perfil</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-slate-500">Nome Completo</label>
            <input v-model="usuario.nome" type="text" class="w-full border rounded-lg p-2 mt-1">
          </div>
          <div>
            <label class="text-sm font-medium text-slate-500">E-mail (Login)</label>
            <input v-model="usuario.email" type="email" class="w-full border rounded-lg p-2 mt-1">
          </div>
          <div>
            <label class="text-sm font-medium text-slate-500">Senha</label>
            <input v-model="usuario.senha" type="password" class="w-full border rounded-lg p-2 mt-1" placeholder="Mínimo 6 caracteres">
          </div>
          <div>
            <label class="text-sm font-medium text-slate-500">Nível de Acesso</label>
            <select v-model="usuario.nivel_acesso" class="w-full border rounded-lg p-2 mt-1">
              <option value="vendedor">Vendedor</option>
              <option value="gerente">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-sm font-medium text-slate-500">Comissão (%)</label>
              <input v-model="usuario.comissao_padrao" type="number" class="w-full border rounded-lg p-2 mt-1">
            </div>
            <div>
              <label class="text-sm font-medium text-slate-500">Status</label>
              <select v-model="usuario.ativo" class="w-full border rounded-lg p-2 mt-1">
                <option :value="1">Ativo</option>
                <option :value="0">Inativo</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold text-slate-700 mb-6">Equipe Cadastrada</h2>
        <table class="w-full text-left">
          <thead>
            <tr class="text-slate-400 text-sm border-b">
              <th class="pb-3 px-2">Nome</th>
              <th class="pb-3 px-2">Perfil</th>
              <th class="pb-3 px-2">Status</th>
              <th class="pb-3 px-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in listaUsuarios" :key="user.id" class="border-b hover:bg-slate-50">
              <td class="py-3 px-2 font-medium">{{ user.nome }}</td>
              <td class="py-3 px-2 uppercase text-xs font-bold text-slate-500">{{ user.nivel_acesso }}</td>
              <td class="py-3 px-2">
                <span :class="user.ativo ? 'text-green-600' : 'text-red-600'">{{ user.ativo ? '● Ativo' : '● Inativo' }}</span>
              </td>
              <td class="py-3 px-2 text-right">
                <button @click="editarUsuario(user)" class="text-indigo-600 font-bold hover:underline">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>