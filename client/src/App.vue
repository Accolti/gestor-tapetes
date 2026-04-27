<template>
  <div class="flex min-h-screen bg-slate-50 text-slate-800">
    <aside class="w-64 bg-slate-900 text-white p-6 space-y-6">
      <h1 class="text-xl font-bold border-b border-slate-700 pb-4">Gestor Kapazi</h1>
      
      <nav class="flex flex-col space-y-2">
        <router-link to="/" class="p-3 hover:bg-slate-800 rounded-lg transition">🏠 Início</router-link>
        <router-link to="/clientes" class="p-3 hover:bg-slate-800 rounded-lg transition">👥 Clientes</router-link>
        <router-link to="/simulador" class="p-3 hover:bg-slate-800 rounded-lg transition">📊 Simulador</router-link>
        <router-link to="/produtos" class="p-3 hover:bg-slate-800 rounded-lg transition">📦 Produtos</router-link>
      </nav>
    </aside>

    <main class="flex-1 p-8">
      <router-view></router-view> </main>
  </div>
</template>

<style>
/* Estilo para link ativo */
.router-link-active {
  background-color: #1e293b; /* slate-800 */
  border-left: 4px solid #3b82f6; /* blue-500 */
}
</style>