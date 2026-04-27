<script setup>
// Aqui no futuro faremos um SELECT COUNT(*) para buscar esses números
const estatisticas = [
  { nome: 'Clientes Ativos', valor: '24', icone: '👥', cor: 'bg-blue-500' },
  { nome: 'Orçamentos (Mês)', valor: '12', icone: '📝', cor: 'bg-emerald-500' },
  { nome: 'Vendas Fechadas', valor: 'R$ 15.400', icone: '💰', cor: 'bg-amber-500' },
  { nome: 'Tapetes Produzidos', valor: '85m²', icone: '🎨', cor: 'bg-purple-500' },
]
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Olá, Vendedor! 👋</h1>
      <p class="text-slate-500">Bem-vindo ao seu painel de gestão de tapetes Kapazi.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div v-for="stat in estatisticas" :key="stat.nome" 
           class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div :class="['p-3 rounded-xl text-2xl', stat.cor]">
          {{ stat.icone }}
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">{{ stat.nome }}</p>
          <p class="text-2xl font-bold text-slate-800">{{ stat.valor }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold mb-4 text-slate-700">Ações Rápidas</h2>
        <div class="grid grid-cols-2 gap-4">
          <router-link to="/clientes" class="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-center group">
            <span class="block text-2xl mb-2">➕</span>
            <span class="font-semibold text-slate-600 group-hover:text-blue-600">Novo Cliente</span>
          </router-link>
          
          <router-link to="/simulador" class="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-center group">
            <span class="block text-2xl mb-2">📏</span>
            <span class="font-semibold text-slate-600 group-hover:text-blue-600">Simular Preço</span>
          </router-link>
        </div>
      </div>

      <div class="bg-slate-900 text-white p-8 rounded-2xl shadow-sm">
        <h2 class="text-xl font-bold mb-4">Dica do Dia: Kapazi</h2>
        <p class="text-slate-400 leading-relaxed italic">
          "Tapetes de vinil Gold são ideais para áreas de alto tráfego. Lembre-se de oferecer a borda vulcanizada para aumentar a durabilidade do produto final."
        </p>
        <div class="mt-6">
          <button class="bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
            Ver Catálogo Técnico
          </button>
        </div>
      </div>
    </div>
  </div>
</template>