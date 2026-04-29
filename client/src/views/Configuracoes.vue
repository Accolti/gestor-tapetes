<script setup lang="js">
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Nome do componente para evitar erro de multi-word do ESLint
defineOptions({ name: 'ConfiguracoesEmpresa' })

// Recupera os dados do usuário logado no navegador
const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}')

const config = ref({
  id_usuario: usuarioLogado.id, 
  tipo_identificacao: 'CNPJ',
  documento: '',
  razao_social: '',
  nome_fantasia: '',
  uf_sede: 'SP',
  regime_tributario: 'SIMPLES_NACIONAL',
  imposto_venda_percentual: 0,
  custo_fixo_operacional: 0,
  markup_alvo: 0,
  logo_path: null,
  valor_minimo_isencao: 750.00,
  valor_frete_padrao: 0
})

const estados = ref([])
const mensagem = ref({ texto: '', tipo: '' })
const logoPreview = ref(null)

// 1. Carrega estados para o Select
const carregarEstadosFiscais = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/config/estados`)
    estados.value = res.data
  } catch (err) {
    console.error("Erro ao carregar matriz de estados:", err)
  }
}

// 2. Carregar configurações completas
const carregarConfig = async () => {
  if (!usuarioLogado.id) return

  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/config-completa/${usuarioLogado.id}`)
    
    if (res.data) {
      config.value = { ...config.value, ...res.data }
      if (config.value.logo_path) {
        logoPreview.value = `${import.meta.env.VITE_API_URL}/uploads/${config.value.logo_path}`
      }
    }
  } catch (err) {
    console.info("Info: Nenhuma configuração prévia encontrada.")
  }
}

onMounted(() => {
  carregarConfig()
  carregarEstadosFiscais()
})

const handleLogoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    config.value.logo_file = file
    logoPreview.value = URL.createObjectURL(file)
  }
}

const salvarConfig = async () => {
  try {
    if (!usuarioLogado.id) {
      mensagem.value = { texto: '❌ Erro: Usuário não identificado.', tipo: 'erro' }
      return
    }

    mensagem.value = { texto: 'Salvando...', tipo: 'info' }
    const formData = new FormData()
    
    Object.keys(config.value).forEach(key => {
      if (key === 'logo_file') {
        formData.append('logo_file', config.value[key])
      } else if (config.value[key] !== null && config.value[key] !== undefined) {
        formData.append(key, config.value[key])
      }
    })

    formData.append('usuario_id', usuarioLogado.id)

    await axios.post(`${import.meta.env.VITE_API_URL}/api/config-empresa`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    mensagem.value = { texto: '✅ Configurações salvas com sucesso!', tipo: 'sucesso' }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    setTimeout(() => carregarConfig(), 1000)

  } catch (err) {
    mensagem.value = { 
      texto: err.response?.data?.error || '❌ Erro ao salvar configurações.', 
      tipo: 'erro' 
    }
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto pb-20 p-4">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p class="text-slate-500 text-sm">Olá, <b>{{ usuarioLogado.nome || 'Vendedor' }}</b>. Gerencie seus parâmetros abaixo.</p>
      </div>
      <button @click="salvarConfig" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition active:scale-95">
        Salvar Alterações
      </button>
    </div>

    <div v-if="mensagem.texto" :class="['p-4 mb-6 rounded-lg font-medium shadow-sm border', 
      mensagem.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border-green-200' : 
      mensagem.tipo === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200']">
      {{ mensagem.texto }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="md:col-span-2 space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center">
            <span class="mr-2">🏢</span> Identificação da Empresa
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Tipo</label>
              <select v-model="config.tipo_identificacao" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="CNPJ">CNPJ</option>
                <option value="CPF">CPF</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">{{ config.tipo_identificacao }}</label>
              <input v-model="config.documento" type="text" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-bold text-slate-400 uppercase">Razão Social</label>
              <input v-model="config.razao_social" type="text" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="md:col-span-2">
              <label class="text-xs font-bold text-slate-400 uppercase">Nome Fantasia (Exibido no Orçamento)</label>
              <input v-model="config.nome_fantasia" type="text" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome da sua loja">
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center">
            <span class="mr-2">🚚</span> Logística e Frete (Fornecedor)
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Mínimo para Frete Grátis (R$)</label>
              <input v-model="config.valor_minimo_isencao" type="number" step="0.01" class="w-full border rounded-lg p-2 mt-1 text-orange-600 font-bold outline-none">
              <p class="text-[10px] text-slate-400 mt-1 italic">Acima de R$ 750,00 o frete Kapazi costuma ser grátis.</p>
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Valor Frete Padrão (R$)</label>
              <input v-model="config.valor_frete_padrao" type="number" step="0.01" class="w-full border rounded-lg p-2 mt-1 text-slate-600 font-bold outline-none">
              <p class="text-[10px] text-slate-400 mt-1 italic">Cobrado quando o pedido é abaixo do mínimo.</p>
            </div>
          </div>
        </section>

        <section class="bg-slate-50 p-6 rounded-xl shadow-sm border border-blue-100">
          <h2 class="text-lg font-semibold text-blue-800 mb-4 border-b border-blue-200 pb-2 flex items-center">
            <span class="mr-2">⚖️</span> Perfil Fiscal e Tributário
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-blue-600 uppercase">Estado (UF) de Sede</label>
              <select v-model="config.uf_sede" class="w-full border border-blue-200 rounded-lg p-2 mt-1 bg-white outline-none">
                <option v-for="est in estados" :key="est.uf" :value="est.uf">{{ est.uf }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-blue-600 uppercase">Regime Tributário</label>
              <select v-model="config.regime_tributario" class="w-full border border-blue-200 rounded-lg p-2 mt-1 bg-white outline-none">
                <option value="MEI">MEI</option>
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
              </select>
            </div>
          </div>
        </section>

        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 flex items-center">
            <span class="mr-2">💰</span> Margens e Impostos
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Imposto Venda (%)</label>
              <input v-model="config.imposto_venda_percentual" type="number" step="0.01" class="w-full border rounded-lg p-2 mt-1 text-blue-600 font-bold outline-none">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Custo Fixo (%)</label>
              <input v-model="config.custo_fixo_operacional" type="number" step="0.01" class="w-full border rounded-lg p-2 mt-1 text-blue-600 font-bold outline-none">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Markup Alvo</label>
              <input v-model="config.markup_alvo" type="number" step="0.1" class="w-full border rounded-lg p-2 mt-1 text-green-600 font-bold outline-none">
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
          <h2 class="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">🖼️ Logomarca</h2>
          <div class="mt-4 border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center min-h-[220px] bg-slate-50">
            <img v-if="logoPreview" :src="logoPreview" class="max-h-32 mb-4 rounded shadow-md border bg-white object-contain">
            <div v-else class="text-slate-300 mb-4 text-5xl">📷</div>
            <label class="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-6 py-2 rounded-lg text-sm font-bold transition border border-blue-200">
              Alterar Logo
              <input type="file" @change="handleLogoChange" accept="image/*" class="hidden">
            </label>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>