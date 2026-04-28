<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const config = ref({
  tipo_identificacao: 'CNPJ',
  documento: '',
  razao_social: '',
  nome_fantasia: '',
  imposto_venda_percentual: 0,
  custo_fixo_operacional: 0,
  markup_alvo: 0,
  logo_path: null
})

const mensagem = ref({ texto: '', tipo: '' })
const logoPreview = ref(null)

// Carregar configurações existentes ao abrir a página
const carregarConfig = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/config-empresa')
    if (res.data) {
      config.value = res.data
      if (config.value.logo_path) {
        logoPreview.value = `http://localhost:3000/uploads/${config.value.logo_path}`
      }
    }
  } catch (error) {
    console.error("Erro ao carregar configurações")
  }
}

onMounted(carregarConfig)

// Lógica para Upload da Logo
const handleLogoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    config.value.logo_file = file // Guarda o arquivo para o upload
    logoPreview.value = URL.createObjectURL(file) // Mostra preview na tela
  }
}

const salvarConfig = async () => {
  try {
    mensagem.value = { texto: 'Salvando...', tipo: 'info' }
    
    // Como tem arquivo (Logo), precisamos usar FormData
    const formData = new FormData()
    Object.keys(config.value).forEach(key => {
      formData.append(key, config.value[key])
    })

    await axios.post('http://localhost:3000/api/config-empresa', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    mensagem.value = { texto: '✅ Configurações salvas com sucesso!', tipo: 'sucesso' }
  } catch (error) {
    mensagem.value = { texto: '❌ Erro ao salvar configurações.', tipo: 'erro' }
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Configurações da Empresa</h1>
      <button @click="salvarConfig" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
        Salvar Alterações
      </button>
    </div>

    <div v-if="mensagem.texto" :class="['p-4 mb-6 rounded-lg font-medium', mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
      {{ mensagem.texto }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="md:col-span-2 space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">🏢 Identificação</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Tipo</label>
              <select v-model="config.tipo_identificacao" class="w-full border rounded p-2 mt-1">
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">{{ config.tipo_identificacao }}</label>
              <input v-model="config.documento" type="text" class="w-full border rounded p-2 mt-1" placeholder="00.000.000/0000-00">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-bold text-slate-400 uppercase">Razão Social</label>
              <input v-model="config.razao_social" type="text" class="w-full border rounded p-2 mt-1">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-bold text-slate-400 uppercase">Nome Fantasia (Aparece no Orçamento)</label>
              <input v-model="config.nome_fantasia" type="text" class="w-full border rounded p-2 mt-1">
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">💰 Regras Financeiras (Simulador)</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Impostos (%)</label>
              <input v-model="config.imposto_venda_percentual" type="number" step="0.01" class="w-full border rounded p-2 mt-1 text-blue-600 font-bold">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Custo Fixo (%)</label>
              <input v-model="config.custo_fixo_operacional" type="number" step="0.01" class="w-full border rounded p-2 mt-1 text-blue-600 font-bold">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Markup Alvo</label>
              <input v-model="config.markup_alvo" type="number" step="0.1" class="w-full border rounded p-2 mt-1 text-green-600 font-bold">
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">🖼️ Logomarca</h2>
          <div class="mt-4 border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px]">
            <img v-if="logoPreview" :src="logoPreview" class="max-h-32 mb-4 rounded shadow">
            <div v-else class="text-slate-300 mb-4 text-4xl">📷</div>
            
            <label class="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded text-sm font-bold transition">
              Selecionar Imagem
              <input type="file" @change="handleLogoChange" accept="image/*" class="hidden">
            </label>
            <p class="text-[10px] text-slate-400 mt-2 italic">Formatos: PNG, JPG (Máx 2MB)</p>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>ate>