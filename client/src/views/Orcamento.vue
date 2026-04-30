<script setup lang="js">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

defineOptions({ name: 'OrcamentoView' })

// --- ESTADO DA PÁGINA ---
const clientes = ref([])
const clienteSelecionado = ref('')
const modoCliente = ref(false) // Controla o "Olhinho"
const faixaSelecionada = ref(null)

// Objeto para o produto que está sendo digitado
const prod = ref({
  nome: '',
  largura: 0,
  comprimento: 0,
  custo_m2: 0 // Valor vindo do banco/tabela Kapazi
})

// Lista de produtos adicionados ao orçamento
const itensOrcamento = ref([])

// --- CÁLCULOS AUTOMÁTICOS ---

// Calcula o custo total da soma de todos os itens
const totalCusto = computed(() => {
  return itensOrcamento.value.reduce((acc, item) => acc + (item.largura * item.comprimento * item.custo_m2), 0)
})

// Funções para a Simulação MVL
const selecionarFaixa = (n) => {
  faixaSelecionada.value = n
}

const valorVendaSimulado = computed(() => {
  if (!faixaSelecionada.value) return 0
  return totalCusto.value * (1 + faixaSelecionada.value / 10)
})

const valorParcelaPix = computed(() => (valorVendaSimulado.value / 2).toFixed(2))
const valorParcelaBoleto = computed(() => (valorVendaSimulado.value / 3).toFixed(2))

// --- CARREGAMENTO DE DADOS ---
const carregarClientes = async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/clientes`)
    clientes.value = res.data
  } catch (err) {
    console.error("Erro ao carregar clientes:", err)
  }
}

onMounted(() => {
  carregarClientes()
})

// Função para adicionar produto na lista
const adicionarProduto = () => {
  if (prod.value.largura > 0 && prod.value.comprimento > 0) {
    itensOrcamento.value.push({ ...prod.value })
    // Limpa campos após adicionar
    prod.value = { nome: '', largura: 0, comprimento: 0, custo_m2: 50 } // custo_m2 fixo para teste
  }
}
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
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="col-span-2">
              <label class="text-xs font-bold text-slate-400">PRODUTO</label>
              <input v-model="prod.nome" type="text" class="w-full border rounded p-2" placeholder="Ex: Tapete Gold">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400">LARGURA (m)</label>
              <input v-model.number="prod.largura" type="number" step="0.01" class="w-full border rounded p-2">
            </div>
            <div>
              <label class="text-xs font-bold text-slate-400">COMPRIMENTO (m)</label>
              <input v-model.number="prod.comprimento" type="number" step="0.01" class="w-full border rounded p-2">
            </div>
          </div>
          
          <button @click="adicionarProduto" class="mt-4 w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-900">
            Adicionar Item ao Orçamento
          </button>

          <div class="mt-6" v-if="itensOrcamento.length > 0">
            <h3 class="text-sm font-bold text-slate-700 mb-2 uppercase">Itens no Orçamento:</h3>
            <div v-for="(item, idx) in itensOrcamento" :key="idx" class="flex justify-between p-2 border-b text-sm">
              <span>{{ item.nome }} ({{ item.largura }}x{{ item.comprimento }})</span>
              <span v-if="!modoCliente" class="font-mono text-slate-500">Custo: R$ {{ (item.largura * item.comprimento * item.custo_m2).toFixed(2) }}</span>
            </div>
          </div>
        </section>

        <section v-if="!modoCliente" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-3 bg-slate-100 rounded-lg">
              <label class="text-[10px] font-bold text-slate-400 uppercase">Total Custo (C)</label>
              <div class="text-lg font-bold text-slate-700">R$ {{ totalCusto.toFixed(2) }}</div>
            </div>
            <div class="p-3 bg-red-50 rounded-lg">
              <label class="text-[10px] font-bold text-red-400 uppercase">Lucro Previsto</label>
              <div class="text-lg font-bold text-red-600">R$ {{ (valorVendaSimulado - totalCusto).toFixed(2) }}</div>
            </div>
           </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-600">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-slate-700 uppercase">Simulação (M V L)</h3>
            <span v-if="!modoCliente" class="text-xs font-bold text-slate-400">C {{ totalCusto.toFixed(2) }}</span>
          </div>
          
          <div class="space-y-2">
            <div v-for="n in [5, 6, 7, 8, 9, 10]" :key="n" 
                 @click="selecionarFaixa(n)"
                 :class="['flex justify-between p-2 border rounded-lg cursor-pointer transition', 
                          faixaSelecionada === n ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white hover:bg-blue-50 border-slate-200']">
              <span class="font-bold w-8 text-center">{{ n }}</span>
              <span class="font-bold">R$ {{ (totalCusto * (1 + n/10)).toFixed(2) }}</span>
              <span :class="['font-bold', faixaSelecionada === n ? 'text-blue-100' : 'text-green-600']">
                 {{ (totalCusto * (n/10)).toFixed(2) }}
              </span>
            </div>
          </div>

          <div v-if="faixaSelecionada" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-900 animate-pulse">
            <p class="font-bold mb-2">Opções de Pagamento:</p>
            <p>💳 Pix (2x) de <b>R$ {{ valorParcelaPix }}</b></p>
            <p class="mt-2">📄 Boleto (3x) de <b>R$ {{ valorParcelaBoleto }}</b></p>
            <p class="text-[10px] mt-2 italic">* 1ª parcela em 5 dias, demais a cada 30 dias.</p>
          </div>
          <div v-else class="mt-6 text-center text-xs text-slate-400 italic">
            Clique em uma linha acima para ver as parcelas.
          </div>
        </section>
      </div>

    </div>
  </div>
</template>