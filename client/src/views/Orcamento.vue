<script setup lang="js">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'

defineOptions({ name: 'OrcamentoView' })

// --- ESTADO DA PÁGINA ---
const clientes = ref([])
const clienteSelecionado = ref('')
const modoCliente = ref(false)
const faixaSelecionada = ref(null)

// --- REFS PARA OS FILTROS (CHAVE DO PROBLEMA ESTAVA AQUI) ---
const listaProdutosBase = ref([]) 
const opcoesAcessorios = ref([])
const combinacoes = ref([])

const opcoesLinha = computed(() =>
  [...new Set(combinacoes.value.map(m => m.attr_linha))].filter(Boolean)
)

const opcoesTipo = computed(() => {
  if (!filtros.value.linha) return []
  return [...new Set(
    combinacoes.value
      .filter(m => m.attr_linha === filtros.value.linha)
      .map(m => m.attr_tipo)
  )].filter(Boolean)
})

const opcoesNivel = computed(() => {
  if (!filtros.value.linha || !filtros.value.tipo) return []
  return [...new Set(
    combinacoes.value
      .filter(m => m.attr_linha === filtros.value.linha && m.attr_tipo === filtros.value.tipo)
      .map(m => m.attr_nivel)
  )].filter(Boolean)
})

const filtros = ref({
  produtoId: '',
  matrizId: '',
  linha: '',
  tipo: '',
  nivel: '',
  acessorioId: ''
})

// Watchers para cascata de selecoes
watch(() => filtros.value.linha, () => {
  filtros.value.tipo = ''
  filtros.value.nivel = ''
})

watch(() => filtros.value.tipo, () => {
  filtros.value.nivel = ''
})

const prod = ref({
  nome: '',
  largura: 0,
  comprimento: 0,
  custo_m2: 0,
  preco_base: 0,
  und_vnd: '',
  id_matriz: null,
  id_acessorio: null
})

const itensOrcamento = ref([])

// --- CÁLCULOS ---
const totalCusto = computed(() => {
  return itensOrcamento.value.reduce((acc, item) => acc + item.total_item, 0)
})

const valorVendaSimulado = computed(() => {
  if (!faixaSelecionada.value) return 0
  return totalCusto.value * (1 + faixaSelecionada.value / 10)
})

const valorParcelaPix = computed(() => (valorVendaSimulado.value / 2).toFixed(2))
const valorParcelaBoleto = computed(() => (valorVendaSimulado.value / 3).toFixed(2))

// --- FUNÇÕES DE CARREGAMENTO ---
const carregarClientes = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clientes`, {
      params: { usuario_id: user.id, nivel: user.nivel }
    });
    clientes.value = res.data;
  } catch (err) { console.error("Erro clientes:", err) }
}

const carregarProdutosBase = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/produtos-lista`)
    listaProdutosBase.value = res.data
  } catch (err) { console.error("Erro lista produtos:", err) }
}

const atualizarOpcoesFiltros = async () => {
  if (!filtros.value.produtoId) return
  
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/produto-opcoes-completas/${filtros.value.produtoId}`)
    const dados = res.data
    
    combinacoes.value = dados.combinacoes
    opcoesAcessorios.value = dados.acessorios

    // Reset de seleções
    filtros.value.linha = ''
    filtros.value.tipo = ''
    filtros.value.nivel = ''
    filtros.value.acessorioId = ''
  } catch (err) {
    console.error(err)
  }
}

// Remova o @change="buscarPrecoFinal" das suas comboboxes no HTML e use esta lógica:

const buscarPrecoFinal = async () => {
  if (!filtros.value.produtoId) {
    alert("Por favor, selecione um Produto.");
    return;
  }
  if (opcoesLinha.value.length > 0 && !filtros.value.linha) {
    alert("Por favor, selecione a Linha.");
    return;
  }
  if (opcoesTipo.value.length > 0 && !filtros.value.tipo) {
    alert("Por favor, selecione o Tipo.");
    return;
  }
  if (opcoesNivel.value.length > 0 && !filtros.value.nivel) {
    alert("Por favor, selecione o Nível.");
    return;
  }

  let resultado = combinacoes.value;

  if (filtros.value.linha) {
    resultado = resultado.filter(c => c.attr_linha === filtros.value.linha);
  }
  if (filtros.value.tipo) {
    resultado = resultado.filter(c => c.attr_tipo === filtros.value.tipo);
  }
  if (filtros.value.nivel) {
    const comNivel = resultado.filter(c => c.attr_nivel === filtros.value.nivel);
    if (comNivel.length > 0) {
      resultado = comNivel;
    } else {
      resultado = resultado.filter(c => c.attr_nivel === null);
    }
  }

  const match = resultado[0] || null;

  if (!match) {
    alert("Combinação inválida. Selecione novamente.");
    return;
  }

  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/.`, { 
      params: { 
        produtoId: filtros.value.produtoId,
        id_matriz_preco: match.id_matriz_preco,
        id_acessorio: filtros.value.acessorioId || null
      }
    });
    
    const db = res.data;
    
    prod.value = { 
      ...prod.value,
      id_matriz: match.id_matriz_preco,
      id_acessorio: filtros.value.acessorioId || null,
      nome: db.nome_comercial,
      preco_base: db.preco_base,
      custo_m2: db.preco_base
    };

    console.log("Preço atualizado com sucesso!");
  } catch (err) {
    console.error("Erro ao buscar preço:", err);
    alert("Não encontramos um preço para essa combinação específica.");
  }
};

const adicionarProduto = () => {
  if (prod.value.largura > 0 && prod.value.comprimento > 0 && prod.value.custo_m2 > 0) {
    const acessorio = opcoesAcessorios.value.find(a => a.id_acessorio == filtros.value.acessorioId)
    let custoAcessorio = acessorio ? parseFloat(acessorio.preco_custo) : 0
    
    // Se for m2, multiplica
    if (acessorio?.base_calculo === 'm2') {
        custoAcessorio = (prod.value.largura * prod.value.comprimento) * acessorio.preco_custo
    }
    
    const totalItem = (prod.value.largura * prod.value.comprimento * prod.value.custo_m2) + custoAcessorio

    itensOrcamento.value.push({
      id_matriz_preco: prod.value.id_matriz,
      id_acessorio: prod.value.id_acessorio,
      descricao: `${prod.value.nome} (${filtros.value.linha}) ${acessorio ? '+ ' + acessorio.nome : ''}`,
      largura: prod.value.largura,
      comprimento: prod.value.comprimento,
      custo_m2: prod.value.custo_m2,
      total_item: totalItem
    })

    // Reset total
    filtros.value = { produtoId: '', linha: '', tipo: '', nivel: '', acessorioId: '' }
    prod.value = { nome: '', largura: 0, comprimento: 0, custo_m2: 0, preco_base: 0, id_matriz: null, id_acessorio: null }
  }
}

const selecionarFaixa = (n) => faixaSelecionada.value = n

onMounted(() => {
  carregarClientes()
  carregarProdutosBase()
})
</script>

<template>
  <div class="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
    
    <div class="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-200">
      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label class="text-xs font-bold text-slate-400 uppercase">Cliente</label>
          <select v-model="clienteSelecionado" class="w-full border rounded-lg p-2 mt-1 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione o cliente</option>
            <option v-for="c in clientes" :key="c.id" :value="c.id">
              {{ c.nome_fantasia || c.razao_social }}
            </option>
          </select>
        </div>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-bold">
          + Novo Cliente
        </button>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-slate-800">Novo Orçamento</h2>
      <button @click="modoCliente = !modoCliente" class="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold bg-white px-4 py-2 rounded-lg border shadow-sm">
        <span>{{ modoCliente ? '👁️ Mostrar Custos (Interno)' : '🙈 Ocultar Custos (Modo Cliente)' }}</span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 space-y-6">
        
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">1. Produto</label>
              <select v-model="filtros.produtoId" @change="atualizarOpcoesFiltros" class="w-full border rounded p-2 text-sm outline-none">
                <option value="">Selecione...</option>
                <option v-for="p in listaProdutosBase" :key="p.id" :value="p.id">{{ p.produto }}</option>
              </select>
            </div>

            <div v-if="opcoesLinha.length > 0">
              <label class="text-[10px] font-bold text-slate-400 uppercase">2. Linha</label>
              <select v-model="filtros.linha" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="opt in opcoesLinha" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div v-if="opcoesTipo.length > 0">
              <label class="text-[10px] font-bold text-slate-400 uppercase">3. Tipo</label>
              <select v-model="filtros.tipo" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="opt in opcoesTipo" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div v-if="opcoesNivel.length > 0">
              <label class="text-[10px] font-bold text-slate-400 uppercase">4. Nível</label>
              <select v-model="filtros.nivel" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="opt in opcoesNivel" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <div v-if="opcoesAcessorios.length > 0">
              <label class="text-[10px] font-bold text-slate-400 uppercase">5. Acessório</label>
              <select v-model="filtros.acessorioId" class="w-full border rounded p-2 text-sm">
                <option value="">Nenhum</option>
                <option v-for="a in opcoesAcessorios" :key="a.id_acessorio" :value="a.id_acessorio">{{ a.nome }}</option>
              </select>
            </div>
          </div>

          <div class="flex justify-center mb-6">
            <button @click="buscarPrecoFinal" class="bg-blue-50 text-blue-600 border border-blue-200 px-6 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition shadow-sm">
              🔍 Verificar Preço da Combinação
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
            <div>
              <label class="text-xs font-bold text-slate-400">LARGURA (m)</label>
              <input v-model.number="prod.largura" type="number" step="0.01" class="w-full border rounded p-2 outline-none">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400">COMPRIMENTO (m)</label>
              <input v-model.number="prod.comprimento" type="number" step="0.01" class="w-full border rounded p-2 outline-none">
            </div>
            <div v-if="!modoCliente">
              <label class="text-xs font-bold text-slate-400">PREÇO BASE</label>
              <div class="p-2 bg-slate-100 rounded text-slate-600 font-mono font-bold">R$ {{ prod.preco_base || '0.00' }}</div>
            </div>
          </div>
          
          <button @click="adicionarProduto" :disabled="!prod.preco_base || !prod.largura" class="mt-4 w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 disabled:opacity-50 transition">
            Adicionar Item ao Orçamento
          </button>
        </section> <section v-if="itensOrcamento.length > 0" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4 uppercase text-sm">Itens Adicionados</h3>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b text-slate-400 text-[10px] uppercase">
                <th class="py-2">Descrição</th>
                <th class="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in itensOrcamento" :key="index" class="border-b text-sm text-slate-600">
                <td class="py-3">{{ item.descricao }} ({{ item.largura }}x{{ item.comprimento }})</td>
                <td class="py-3 text-right font-bold text-slate-800">R$ {{ item.total_item.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </section> <section v-if="!modoCliente" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div class="flex gap-4">
            <div class="p-3 bg-slate-100 rounded-lg flex-1">
              <label class="text-[10px] font-bold text-slate-400 uppercase">Custo Total (C)</label>
              <div class="text-xl font-bold text-slate-700">R$ {{ totalCusto.toFixed(2) }}</div>
            </div>
            <div class="p-3 bg-green-50 rounded-lg flex-1">
              <label class="text-[10px] font-bold text-green-400 uppercase">Lucro Simulado</label>
              <div class="text-xl font-bold text-green-600">R$ {{ (valorVendaSimulado - totalCusto).toFixed(2) }}</div>
            </div>
          </div>
        </section> </div> <div class="space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600">
          <h3 class="font-bold text-slate-700 uppercase mb-4 text-sm">Simulação de Venda</h3>
          <div class="space-y-2">
            <div v-for="n in [5, 6, 7, 8, 9, 10]" :key="n" @click="selecionarFaixa(n)"
                 :class="['flex justify-between p-3 border rounded-lg cursor-pointer transition-all', 
                          faixaSelecionada === n ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'hover:bg-blue-50 border-slate-100']">
              <span class="font-bold">M{{ n }}</span>
              <span class="font-bold font-mono">R$ {{ (totalCusto * (1 + n/10)).toFixed(2) }}</span>
            </div>
          </div>
          <div v-if="faixaSelecionada" class="mt-6 p-4 bg-blue-50 rounded-lg text-sm border border-blue-100">
            <p class="font-bold text-blue-800 mb-2">Opções de Pagamento:</p>
            <p class="text-blue-900">Pix (2x): <b>R$ {{ valorParcelaPix }}</b></p>
            <p class="text-blue-900 mt-1">Boleto (3x): <b>R$ {{ valorParcelaBoleto }}</b></p>
          </div>
        </section>
      </div> </div> </div> </template>