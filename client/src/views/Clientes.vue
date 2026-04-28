<script setup>
import { ref, onMounted } from 'vue'
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

const listaClientes = ref([]) 
const mensagem = ref({ texto: '', tipo: '' })

// 1. Função para carregar a lista do banco
const carregarClientes = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    
    // CORREÇÃO: Usando crases (`) em vez de aspas simples (')
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clientes`, {
      params: {
        usuario_id: user.id,
        nivel: user.nivel 
      }
    });

    listaClientes.value = response.data; 
  } catch (err) {
    console.error("Erro ao carregar lista:", err);
  }
};

onMounted(carregarClientes)

const addTelefone = () => cliente.value.telefones.push({ numero: '', tipo: 'WhatsApp' })
const removeTelefone = (index) => cliente.value.telefones.splice(index, 1)
const addEndereco = () => cliente.value.enderecos.push({ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', tipo: 'Comercial' })
const removeEndereco = (index) => cliente.value.enderecos.splice(index, 1)

const salvarCliente = async () => {
  try {
    const usuarioObj = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    
    if (!usuarioObj.id) {
       alert("Erro: Usuário não identificado. Faça login novamente.");
       return;
    }

    mensagem.value = { texto: 'Processando...', tipo: 'info' }

    const dadosParaEnviar = {
      ...cliente.value,
      usuario_id: usuarioObj.id
    };

    if (cliente.value.id) {
      // EDITAR - CORREÇÃO: Usando crases (`)
      await axios.put(`${import.meta.env.VITE_API_URL}/api/clientes/${cliente.value.id}`, dadosParaEnviar);
      mensagem.value = { texto: '✅ Cliente atualizado com sucesso!', tipo: 'sucesso' };
    } else {
      // NOVO - CORREÇÃO: Usando crases (`)
      await axios.post(`${import.meta.env.VITE_API_URL}/api/clientes`, dadosParaEnviar);
      mensagem.value = { texto: '✅ Cliente cadastrado com sucesso!', tipo: 'sucesso' };
    }
    
    setTimeout(() => {
        resetarFormulario();
        carregarClientes();
    }, 500);

  } catch (error) {
    mensagem.value = { texto: '❌ Erro ao salvar dados.', tipo: 'erro' }
    console.error(error)
  }
}

const editarCliente = (item) => {
  cliente.value = { 
    ...item,
    // Mapeamento caso o backend retorne email_principal em vez de email
    email: item.email || item.email_principal, 
    telefones: item.telefones && item.telefones.length > 0 ? item.telefones : [{ numero: '', tipo: 'WhatsApp' }],
    enderecos: item.enderecos && item.enderecos.length > 0 ? item.enderecos : [{ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', tipo: 'Comercial' }]
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const excluirCliente = async (id) => {
  if (confirm("Tem certeza que deseja excluir este cliente?")) {
    try {
      // CORREÇÃO: Usando crases (`)
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/clientes/${id}`)
      carregarClientes()
    } catch (error) {
      alert("Erro ao excluir cliente")
    }
  }
}

const resetarFormulario = () => {
  cliente.value = {
    tipo_pessoa: 'PJ', documento: '', razao_social: '', nome_fantasia: '', email: '',
    telefones: [{ numero: '', tipo: 'WhatsApp' }],
    enderecos: [{ logradouro: '', numero: '', complemento: '', cidade: '', estado: '', tipo: 'Comercial' }]
  }
  mensagem.value = { texto: '', tipo: '' }
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">
        {{ cliente.id ? 'Editar Cliente' : 'Novo Cliente' }}
      </h1>
      <div class="space-x-2">
        <button v-if="cliente.id" @click="resetarFormulario" class="text-slate-500 font-medium hover:text-slate-700">Cancelar</button>
        <button @click="salvarCliente" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
          {{ cliente.id ? 'Atualizar Cadastro' : 'Salvar Cadastro' }}
        </button>
      </div>
    </div>

    <div v-if="mensagem.texto" :class="['p-4 mb-6 rounded-lg font-medium shadow-sm', 
      mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 
      mensagem.tipo === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700']">
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
            <select v-model="cliente.tipo_pessoa" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500 transition">
              <option value="PF">Pessoa Física (CPF)</option>
              <option value="PJ">Pessoa Jurídica (CNPJ)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">{{ cliente.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF' }}</label>
            <input v-model="cliente.documento" type="text" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="00.000.000/0000-00">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-500">Razão Social / Nome Completo</label>
            <input v-model="cliente.razao_social" type="text" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div v-if="cliente.tipo_pessoa === 'PJ'">
            <label class="block text-sm font-medium text-slate-500">Nome Fantasia</label>
            <input v-model="cliente.nome_fantasia" type="text" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-500">E-mail Principal</label>
            <input v-model="cliente.email" type="email" class="w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="exemplo@email.com">
          </div>
        </div>
      </section>

      <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold text-slate-700 mb-6">Clientes Cadastrados</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr class="text-slate-400 text-sm">
                <th class="pb-3 px-4">Razão Social / Nome</th>
                <th class="pb-3 px-4">Documento</th>
                <th class="pb-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in listaClientes" :key="item.id" class="bg-slate-50 hover:bg-slate-100 transition shadow-sm rounded-lg">
                <td class="py-4 px-4 font-medium text-slate-700 rounded-l-lg">{{ item.razao_social }}</td>
                <td class="py-4 px-4 text-slate-500 text-sm">{{ item.documento }}</td>
                <td class="py-4 px-4 text-right space-x-4 rounded-r-lg">
                  <button @click="editarCliente(item)" class="text-blue-600 font-bold hover:text-blue-800 transition">Editar</button>
                  <button @click="excluirCliente(item.id)" class="text-red-500 font-bold hover:text-red-700 transition">Excluir</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="listaClientes.length === 0" class="py-10 text-center text-slate-400 italic">
            Nenhum cliente cadastrado no momento.
          </div>
        </div>
      </section>
    </div>
  </div>
</template>