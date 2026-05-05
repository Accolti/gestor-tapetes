<script setup lang="js">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

defineOptions({ name: 'OrcamentoView' })

// --- ESTADO DA PÁGINA ---
const clientes = ref([])
const clienteSelecionado = ref('')
const modoCliente = ref(false)
const faixaSelecionada = ref(null)

// --- REFS PARA OS FILTROS (CHAVE DO PROBLEMA ESTAVA AQUI) ---
const listaProdutosBase = ref([]) 
const opcoesLinha = ref([])      
const opcoesTipo = ref([])       
const opcoesNivel = ref([])      
const opcoesAcessorios = ref([]) // <-- DECLARADA AGORA

const filtros = ref({
  produtoId: '',
  matrizId: '',
  linha: '',
  tipo: '',
  nivel: '',
  acessorioId: ''
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
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clientes`)
    clientes.value = res.data
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
  console.log("Buscando detalhes para ID:", filtros.value.produtoId)
  
  try {
    // 1. Atributos da Matriz
    const resAtrib = await axios.get(`${import.meta.env.VITE_API_URL}/api/produto-detalhes/${filtros.value.produtoId}`)
    opcoesLinha.value = resAtrib.data.linhas
    opcoesTipo.value = resAtrib.data.tipos
    opcoesNivel.value = resAtrib.data.niveis

    // 2. Acessórios
    const resAce = await axios.get(`${import.meta.env.VITE_API_URL}/api/produto-acessorios/${filtros.value.produtoId}`)
    opcoesAcessorios.value = resAce.data
    // TESTE DE CONSOLE (Pressione F12 no navegador para ver)
    console.log("ID do Produto Selecionado:", filtros.value.produtoId)
    console.log("Acessórios retornados pelo Banco:", resAce.data)
    // Resetar seleções internas
    filtros.value.linha = ''
    filtros.value.tipo = ''
    filtros.value.nivel = ''
    filtros.value.acessorioId = ''
  } catch (err) {
    console.error("Erro ao atualizar filtros:", err)
  }
}

const buscarPrecoFinal = async () => {
  if (filtros.value.produtoId) {
    try {
      // 1. LIMPEZA INICIAL: Reseta o estado do produto antes da nova busca
      // Isso evita que o usuário veja o preço do produto anterior se a consulta falhar
      prod.value = { 
        ...prod.value, 
        id_matriz: null, 
        nome: '', 
        preco_base: 0, 
        custo_m2: 0,
        und_vnd: '' 
      };

      // 2. PREPARAÇÃO: Garante que strings vazias virem null para o SQL
      const paramsEnvio = {
        produtoId: filtros.value.produtoId,
        linha: filtros.value.linha || null,
        tipo: filtros.value.tipo || null,
        nivel: filtros.value.nivel || null
      };

      // 3. REQUISIÇÃO
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/produto-preco-final`, { 
        params: paramsEnvio 
      });

      const db = res.data;

      // 4. ATUALIZAÇÃO: Preenche com os novos dados do banco
      prod.value = { 
        ...prod.value,
        id_matriz: db.id_matriz,
        nome: db.nome_comercial,
        preco_base: db.preco_base,
        custo_m2: db.preco_base,
        und_vnd: db.unidade_venda
      };

    } catch (err) {
      console.error("Erro preço final:", err);
      // Opcional: Se der erro (ex: 404), você pode avisar o usuário aqui
    }
  }
};

const adicionarProduto = () => {
  if (prod.value.largura > 0 && prod.value.comprimento > 0 && prod.value.custo_m2 > 0) {
    const acessorio = opcoesAcessorios.value.find(a => a.id === filtros.value.acessorioId)
    let custoAcessorio = acessorio ? parseFloat(acessorio.preco_custo) : 0
    
    // Se for m2, multiplica
    if (acessorio?.base_calculo === 'm2') {
        custoAcessorio = (prod.value.largura * prod.value.comprimento) * acessorio.preco_custo
    }
    
    const totalItem = (prod.value.largura * prod.value.comprimento * prod.value.custo_m2) + custoAcessorio

    itensOrcamento.value.push({
      descricao: `${prod.value.nome} (${filtros.value.linha}) ${acessorio ? '+ ' + acessorio.nome : ''}`,
      largura: prod.value.largura,
      comprimento: prod.value.comprimento,
      custo_m2: prod.value.custo_m2,
      total_item: totalItem
    })

    // Reset total
    filtros.value = { produtoId: '', linha: '', tipo: '', nivel: '', acessorioId: '' }
    prod.value = { nome: '', largura: 0, comprimento: 0, custo_m2: 0, preco_base: 0 }
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
          <select v-model="clienteSelecionado" class="w-full border rounded-lg p-2 mt-1 outline-none">
            <option value="">Selecione o cliente</option>
            <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nome_fantasia || c.razao_social }}</option>
          </select>
        </div>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">+ Novo Cliente</button>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold text-slate-800">Novo Orçamento</h2>
      <button @click="modoCliente = !modoCliente" class="bg-white px-4 py-2 rounded-lg border shadow-sm font-bold text-slate-500">
        {{ modoCliente ? '👁️ Mostrar Custos' : '🙈 Ocultar Custos' }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">1. Produto</label>
              <select v-model="filtros.produtoId" @change="atualizarOpcoesFiltros" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="p in listaProdutosBase" :key="p.id" :value="p.id">{{ p.produto }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">2. Linha</label>
              <select v-model="filtros.linha" :disabled="!opcoesLinha.length" @change="buscarPrecoFinal" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="opt in opcoesLinha" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">3. Tipo</label>
              <select v-model="filtros.tipo" :disabled="!opcoesTipo.length" @change="buscarPrecoFinal" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="opt in opcoesTipo" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">4. Nível</label>
              <select v-model="filtros.nivel" :disabled="!opcoesNivel.length" @change="buscarPrecoFinal" class="w-full border rounded p-2 text-sm">
                <option value="">Selecione...</option>
                <option v-for="opt in opcoesNivel" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase">5. Acessório</label>
              <select v-model="filtros.acessorioId" :disabled="fa" @change="buscarPrecoFinal" class="w-full border rounded p-2 text-sm">
                <option value="">Nenhum</option>
                <option v-for="a in opcoesAcessorios" :key="a.id" :value="a.id">{{ a.nome }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
            <div>
              <label class="text-xs font-bold text-slate-400">LARGURA (m)</label>
              <input v-model.number="prod.largura" type="number" step="0.01" class="w-full border rounded p-2">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400">COMPRIMENTO (m)</label>
              <input v-model.number="prod.comprimento" type="number" step="0.01" class="w-full border rounded p-2">
            </div>
            <div v-if="!modoCliente">
              <label class="text-xs font-bold text-slate-400">PREÇO BASE</label>
              <div class="p-2 bg-slate-100 rounded text-slate-600 font-mono">R$ {{ prod.preco_base }}</div>
            </div>
          </div>
          
          <button @click="adicionarProduto" :disabled="!filtros.nivel || !prod.largura" class="mt-4 w-full bg-slate-800 text-white py-2 rounded-lg font-bold uppercase text-sm">
            Adicionar ao Orçamento
          </button>
        </section>

        <section v-if="itensOrcamento.length > 0" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-700 mb-4 uppercase text-sm">Itens Adicionados</h3>
          <table class="w-full text-left">
            <thead>
              <tr class="border-b text-slate-400 text-[10px] uppercase">
                <th class="py-2">Descrição</th>
                <th class="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in itensOrcamento" :key="index" class="border-b text-sm">
                <td class="py-3">{{ item.descricao }} ({{ item.largura }}x{{ item.comprimento }})</td>
                <td class="py-3 text-right font-bold">R$ {{ item.total_item.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-if="!modoCliente" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600">
          <h3 class="font-bold text-slate-700 uppercase mb-4">Simulação de Venda</h3>
          <div class="space-y-2">
            <div v-for="n in [5, 6, 7, 8, 9, 10]" :key="n" 
                 @click="selecionarFaixa(n)"
                 :class="['flex justify-between p-2 border rounded-lg cursor-pointer transition', 
                          faixaSelecionada === n ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-50']">
              <span class="font-bold">M{{ n }}</span>
              <span class="font-bold">R$ {{ (totalCusto * (1 + n/10)).toFixed(2) }}</span>
            </div>
          </div>

          <div v-if="faixaSelecionada" class="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
            <p>💳 Pix (2x): <b>R$ {{ valorParcelaPix }}</b></p>
            <p>📄 Boleto (3x): <b>R$ {{ valorParcelaBoleto }}</b></p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>