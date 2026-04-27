<script setup>
import { ref } from 'vue'
import axios from 'axios'

// Estado do formulário
const cliente = ref({
  tipo_pessoa: 'PJ',
  documento: '',
  razao_social: '',
  nome_fantasia: '',
  email: '',
  telefones: [{ numero: '', tipo: 'WhatsApp' }],
  enderecos: [{ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', tipo: 'Comercial' }]
})

const mensagem = ref({ texto: '', tipo: '' })

// Funções para adicionar campos dinâmicos
const addTelefone = () => cliente.value.telefones.push({ numero: '', tipo: 'WhatsApp' })
const removeTelefone = (index) => cliente.value.telefones.splice(index, 1)

const addEndereco = () => cliente.value.enderecos.push({ logradouro: '', numero: '', cidade: '', estado: '', tipo: 'Entrega' })
const removeEndereco = (index) => cliente.value.enderecos.splice(index, 1)

const salvarCliente = async () => {
  try {
    mensagem.value = { texto: 'Salvando...', tipo: 'info' }
    // Enviamos para a API (lembre-se que o usuário_id será tratado no backend futuramente)
    await axios.post('http://localhost:3000/api/clientes', cliente.value)
    
    mensagem.value = { texto: '✅ Cliente e contatos salvos com sucesso!', tipo: 'sucesso' }
    
    // Resetar formulário após sucesso
    // (Opcional: você pode redirecionar para uma lista de clientes)
  } catch (error) {
    mensagem.value = { texto: '❌ Erro ao salvar no banco de dados.', tipo: 'erro' }
    console.error(error)
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Novo Cliente</h1>
      <button @click="salvarCliente" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
        Salvar Cadastro
      </button>
    </div>

    <div v-if="mensagem.texto" :class="['p-4 mb-6 rounded-lg font-medium', 
      mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ mensagem.texto }}
    </div>

    <div class="space-y-6">
      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-lg font-semibold text-slate-700 mb-4 flex items-center border-b pb-2">
          <span class="mr-2">📄</span> Dados Básicos
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-500">Tipo de Pessoa</label>
            <select v-model="cliente.tipo_pessoa" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="PF">Pessoa Física (CPF)</option>
              <option value="PJ">Pessoa Jurídica (CNPJ)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">{{ cliente.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF' }}</label>
            <input v-model="cliente.documento" type="text" class="w-full border rounded-lg p-2 mt-1" placeholder="00.000.000/0000-00">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-500">Razão Social / Nome Completo</label>
            <input v-model="cliente.razao_social" type="text" class="w-full border rounded-lg p-2 mt-1">
          </div>
          <div v-if="cliente.tipo_pessoa === 'PJ'">
            <label class="block text-sm font-medium text-slate-500">Nome Fantasia</label>
            <input v-model="cliente.nome_fantasia" type="text" class="w-full border rounded-lg p-2 mt-1">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">E-mail Principal</label>
            <input v-model="cliente.email" type="email" class="w-full border rounded-lg p-2 mt-1" placeholder="exemplo@email.com">
          </div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h2 class="text-lg font-semibold text-slate-700 flex items-center">
            <span class="mr-2">📞</span> Telefones de Contato
          </h2>
          <button @click="addTelefone" class="text-blue-600 text-sm font-bold hover:underline">+ Adicionar Outro</button>
        </div>
        <div v-for="(tel, index) in cliente.telefones" :key="index" class="flex gap-4 mb-3 items-end">
          <div class="flex-1">
            <label class="text-xs text-slate-400">Número</label>
            <input v-model="tel.numero" type="text" class="w-full border rounded-lg p-2" placeholder="(00) 00000-0000">
          </div>
          <div class="w-32">
            <label class="text-xs text-slate-400">Tipo</label>
            <select v-model="tel.tipo" class="w-full border rounded-lg p-2">
              <option>WhatsApp</option>
              <option>Celular</option>
              <option>Fixo</option>
            </select>
          </div>
          <button @click="removeTelefone(index)" v-if="cliente.telefones.length > 1" class="text-red-500 mb-2 font-bold px-2">✕</button>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h2 class="text-lg font-semibold text-slate-700 flex items-center">
            <span class="mr-2">📍</span> Endereços
          </h2>
          <button @click="addEndereco" class="text-blue-600 text-sm font-bold hover:underline">+ Adicionar Outro</button>
        </div>
        <div v-for="(end, index) in cliente.enderecos" :key="index" class="p-4 bg-slate-50 rounded-lg mb-4 relative">
          <button @click="removeEndereco(index)" v-if="cliente.enderecos.length > 1" class="absolute top-2 right-2 text-red-400 hover:text-red-600">Remover</button>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="text-xs text-slate-400">Rua / Logradouro</label>
              <input v-model="end.logradouro" type="text" class="w-full border rounded-lg p-2">
            </div>
            <div>
              <label class="text-xs text-slate-400">Nº</label>
              <input v-model="end.numero" type="text" class="w-full border rounded-lg p-2">
            </div>
            <div class="col-span-1">
                <label class="text-xs text-slate-400">Complemento</label>
                <input v-model="end.complemento" type="text" class="w-full border rounded-lg p-2" placeholder="Ex: Apto 101">
            </div>
            <div>
              <label class="text-xs text-slate-400">Cidade</label>
              <input v-model="end.cidade" type="text" class="w-full border rounded-lg p-2">
            </div>
            <div>
              <label class="text-xs text-slate-400">Estado (UF)</label>
              <input v-model="end.estado" type="text" maxlength="2" class="w-full border rounded-lg p-2">
            </div>
            <div>
              <label class="text-xs text-slate-400">Tipo</label>
              <select v-model="end.tipo" class="w-full border rounded-lg p-2">
                <option>Comercial</option>
                <option>Entrega</option>
                <option>Faturamento</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>