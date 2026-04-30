<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Estado do formulário - Restaurado com arrays para múltiplos dados
const usuario = ref({
  nome: '',
  email: '',
  senha_hash: '',
  nivel_acesso: 'vendedor',
  comissao_padrao: 0,
  ativo: 1,
  telefones: [{ numero: '', tipo: 'Celular' }],
  enderecos: [{ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' }]
})

const listaUsuarios = ref([])
const mensagem = ref({ texto: '', tipo: '' })

const carregarUsuarios = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/usuarios`)
    listaUsuarios.value = response.data
  } catch (err) {
    console.error("Erro ao carregar usuários:", err)
  }
}

onMounted(carregarUsuarios)

// Funções Dinâmicas para Campos
const addTelefone = () => usuario.value.telefones.push({ numero: '', tipo: 'Celular' })
const removeTelefone = (index) => usuario.value.telefones.splice(index, 1)
const addEndereco = () => usuario.value.enderecos.push({ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' })
const removeEndereco = (index) => usuario.value.enderecos.splice(index, 1)

const salvarUsuario = async () => {
  try {
    mensagem.value = { texto: 'Processando...', tipo: 'info' }

    if (usuario.value.id) {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/usuarios/${usuario.value.id}`, usuario.value)
      mensagem.value = { texto: '✅ Usuário atualizado com sucesso!', tipo: 'sucesso' }
    } else {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/usuarios`, usuario.value)
      mensagem.value = { texto: '✅ Usuário cadastrado com sucesso!', tipo: 'sucesso' }
    }

    setTimeout(() => {
      resetarFormulario()
      carregarUsuarios()
    }, 500)
  } catch (error) {
    mensagem.value = { texto: '❌ Erro ao salvar usuário.', tipo: 'erro' }
    console.error(error)
  }
}

const editarUsuario = (item) => {
  usuario.value = {
    ...item,
    telefones: item.telefones?.length ? item.telefones : [{ numero: '', tipo: 'Celular' }],
    enderecos: item.enderecos?.length ? item.enderecos : [{ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' }]
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetarFormulario = () => {
  usuario.value = {
    nome: '', email: '', senha_hash: '', nivel_acesso: 'vendedor', comissao_padrao: 0, ativo: 1,
    telefones: [{ numero: '', tipo: 'Celular' }],
    enderecos: [{ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', cep: '', tipo: 'Residencial' }]
  }
  mensagem.value = { texto: '', tipo: '' }
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20 p-4">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">
        {{ usuario.id ? 'Editar Usuário' : 'Novo Usuário' }}
      </h1>
      <div class="space-x-2">
        <button v-if="usuario.id" @click="resetarFormulario" class="text-slate-500 font-medium hover:text-slate-700">Cancelar</button>
        <button @click="salvarUsuario" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
          {{ usuario.id ? 'Atualizar Usuário' : 'Salvar Usuário' }}
        </button>
      </div>
    </div>

    <div v-if="mensagem.texto" :class="['p-4 mb-6 rounded-lg shadow-sm', mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ mensagem.texto }}
    </div>

    <div class="space-y-6">
      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center">
          <span class="mr-2">🔑</span> Acesso e Perfil
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-500">Nome Completo</label>
            <input v-model="usuario.nome" type="text" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">E-mail (Login)</label>
            <input v-model="usuario.email" type="email" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">Senha</label>
            <input v-model="usuario.senha_hash" type="password" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Digite para alterar">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">Nível de Acesso</label>
            <select v-model="usuario.nivel_acesso" class="w-full border rounded-lg p-2 mt-1 outline-none">
              <option value="admin">Administrador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">Comissão Padrão (%)</label>
            <input v-model="usuario.comissao_padrao" type="number" class="w-full border rounded-lg p-2 mt-1 outline-none">
          </div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h2 class="text-lg font-semibold text-slate-700 flex items-center">
            <span class="mr-2">📞</span> Contatos
          </h2>
          <button @click="addTelefone" class="text-blue-600 font-bold text-sm hover:underline">+ Adicionar</button>
        </div>
        <div v-for="(tel, index) in usuario.telefones" :key="index" class="flex gap-2 mb-2">
          <input v-model="tel.numero" type="text" placeholder="(00) 00000-0000" class="flex-1 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500">
          <select v-model="tel.tipo" class="border rounded-lg p-2 outline-none">
            <option>Celular</option>
            <option>WhatsApp</option>
            <option>Fixo</option>
          </select>
          <button @click="removeTelefone(index)" class="text-red-500 px-2" v-if="usuario.telefones.length > 1">✕</button>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
  <div class="flex justify-between items-center mb-4 border-b pb-2">
    <h2 class="text-lg font-semibold text-slate-700 flex items-center">
      <span class="mr-2">📍</span> Endereços
    </h2>
    <button @click="addEndereco" class="text-blue-600 font-bold text-sm hover:underline">+ Adicionar</button>
  </div>
  <div v-for="(end, index) in usuario.enderecos" :key="index" class="p-4 bg-slate-50 rounded-lg border mb-4 relative shadow-inner">
    <button @click="removeEndereco(index)" class="absolute top-2 right-2 text-red-500 text-xs font-bold" v-if="usuario.enderecos.length > 1">Remover</button>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase">CEP</label>
            <input v-model="end.cep" type="text" placeholder="00000-000" class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div class="md:col-span-2">
            <label class="block text-[10px] font-bold text-slate-400 uppercase">Logradouro</label>
            <input v-model="end.logradouro" type="text" class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase">Nº</label>
            <input v-model="end.numero" type="text" class="w-full border rounded p-2 outline-none">
        </div>

        <div class="md:col-span-2">
            <label class="block text-[10px] font-bold text-slate-400 uppercase">Complemento</label>
            <input v-model="end.complemento" type="text" class="w-full border rounded p-2 outline-none">
        </div>

        <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase">Cidade</label>
            <input v-model="end.cidade" type="text" class="w-full border rounded p-2 outline-none">
        </div>

        <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase">UF</label>
            <input v-model="end.estado" maxlength="2" class="w-full border rounded p-2 outline-none">
        </div>

        <div class="md:col-span-4">
            <label class="block text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
            <select v-model="end.tipo" class="w-full border rounded p-2 outline-none">
                <option>Residencial</option>
                <option>Comercial</option>
            </select>
        </div>
    </div>
  </div>
</section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold text-slate-700 mb-6">Equipe / Usuários</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-slate-400 text-sm border-b">
                <th class="pb-3 px-4">Nome</th>
                <th class="pb-3 px-4">Perfil</th>
                <th class="pb-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in listaUsuarios" :key="user.id" class="border-b hover:bg-slate-50 transition">
                <td class="py-4 px-4 font-medium text-slate-700">
                  {{ user.nome }}
                  <span class="block text-xs text-slate-400">{{ user.email }}</span>
                </td>
                <td class="py-4 px-4">
                  <span :class="['px-2 py-1 rounded-full text-[10px] font-bold uppercase', 
                    user.nivel_acesso === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700']">
                    {{ user.nivel_acesso }}
                  </span>
                </td>
                <td class="py-4 px-4 text-right space-x-3">
                  <button @click="editarUsuario(user)" class="text-blue-600 font-bold">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>