<template>
  <div class="">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Meu Perfil</h1>
      <p class="text-gray-500">Gerencie suas informações pessoais</p>
    </div>

    <!-- Card de Perfil -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span class="text-white font-bold text-2xl">
              {{ profile.name.charAt(0) || 'U' }}
            </span>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              {{ profile.name }}
            </h2>
            <p class="text-gray-500">
              {{ profile.email }}
            </p>
          </div>
        </div>
      </template>

      <!-- Informações do Usuário -->
      <div class="flex flex-wrap gap-4">
        <UFormGroup label="Nome completo" class="flex-1">
          <UInput v-model="profile.name" disabled class="w-full" />
        </UFormGroup>

        <UFormGroup label="E-mail" class="flex-1">
          <UInput v-model="profile.email" disabled class="w-full" />
        </UFormGroup>

        <UFormGroup label="Telefone" class="flex-1 max-w-36">
          <UInput v-model="profile.phone" class="w-full" />
        </UFormGroup>

        <UFormGroup label="Função" class="flex-1">
          <UInput v-model="profile.role" disabled class="w-full" />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" class="cursor-pointer">Cancelar</UButton>
          <UButton color="primary" class="cursor-pointer">Salvar Alterações</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'protected'
})

const auth = useAuthMock()

const profile = computed(() => ({
  name: auth.user.value?.name || '',
  email: auth.user.value?.email || '',
  phone: '(51) 99999-9999',
  role: 'Administrador'
}))
</script>