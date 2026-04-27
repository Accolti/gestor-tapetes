<script setup>
import { ref, computed } from 'vue'

// Estado dos dados (Futuramente virão do banco via API)
const custoM2 = ref(185) // Ex: Vinil Gold
const largura = ref(1.20)
const comprimento = ref(1.00)
const margem = ref(50) // Porcentagem de lucro

// Cálculos reativos
const areaTotal = computed(() => (largura.value * comprimento.value).toFixed(2))
const custoTotal = computed(() => (areaTotal.value * custoM2.value))
const precoVenda = computed(() => (custoTotal.value / (1 - (margem.value / 100))))
const lucroLiquido = computed(() => precoVenda.value - custoTotal.value)
const markup = computed(() => (precoVenda.value / custoTotal.value).toFixed(2))

const formatarMoeda = (valor) => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Simulador de Venda Kapazi</h1>
      <p class="text-slate-500">Calcule orçamentos personalizados com base na metragem e margem desejada.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 class="font-bold text-slate-700 mb-4 border-b pb-2">Configuração</h2>
          
          <div class="space-y-4">
            <div>
              <label class="text-xs font-bold text-slate-400 uppercase">Custo M² (Fábrica)</label>
              <div class="flex items-center text-xl font-bold text-slate-800">
                <span class="mr-1">R$</span>
                <input v-model="custoM2" type="number" class="w-full outline-none focus:text-blue-600">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-bold text-slate-400 uppercase">Largura (m)</label>
                <input v-model="largura" type="number" step="0.1" class="w-full border rounded-lg p-2 mt-1">
              </div>
              <div>
                <label class="text-xs font-bold text-slate-400 uppercase">Comp. (m)</label>
                <input v-model="comprimento" type="number" step="0.1" class="w-full border rounded-lg p-2 mt-1">
              </div>
            </div>

            <div>
              <label class="flex justify-between text-xs font-bold text-slate-400 uppercase">
                Margem de Lucro: <span class="text-blue-600">{{ margem }}%</span>
              </label>
              <input v-model="margem" type="range" min="10" max="200" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2">
            </div>
          </div>
        </div>

        <div class="bg-slate-800 p-6 rounded-2xl text-white">
          <p class="text-xs font-bold text-slate-400 uppercase mb-2">Resumo da Peça</p>
          <p class="text-2xl font-bold">{{ areaTotal }} m²</p>
          <p class="text-sm text-slate-400">Área total do tapete</p>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="bg-blue-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
          <div class="relative z-10">
            <p class="text-blue-100 font-medium mb-1">Preço Sugerido de Venda</p>
            <h3 class="text-5xl font-black mb-6">{{ formatarMoeda(precoVenda) }}</h3>
            
            <div class="grid grid-cols-2 gap-4 border-t border-blue-500 pt-6">
              <div>
                <p class="text-blue-100 text-sm">Lucro Bruto</p>
                <p class="text-2xl font-bold">{{ formatarMoeda(lucroLiquido) }}</p>
              </div>
              <div>
                <p class="text-blue-100 text-sm">Markup Aplicado</p>
                <p class="text-2xl font-bold">{{ markup }}x</p>
              </div>
            </div>
          </div>
          <div class="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full opacity-50"></div>
        </div>

        <button class="w-full bg-white border-2 border-blue-600 text-blue-600 py-4 rounded-2xl font-black hover:bg-blue-50 transition shadow-sm flex items-center justify-center space-x-2">
          <span>📋</span>
          <span>Gerar Orçamento em PDF</span>
        </button>
      </div>
    </div>
  </div>
</template>