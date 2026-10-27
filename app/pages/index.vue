<template>
  <div>
    <!-- Header da Página -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
      <p class="text-gray-500">Visualize e gerencie os medicamentos</p>
    </div>

    <!-- Conteúdo Principal -->
    <UCard class="bg-white">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Medicamentos Cadastrados</h2>
          <UButton color="primary" icon="i-heroicons-plus">
            Novo Medicamento
          </UButton>
        </div>
      </template>

      <div class="text-center py-12">
        <UIcon name="i-heroicons-clipboard-document-check" class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">
          Estoque de medicamentos vazio
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'protected'
})
</script>