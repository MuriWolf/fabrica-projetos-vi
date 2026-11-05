<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Meu Perfil</h1>
    <p class="text-gray-500">Gerencie suas informações</p>
  </div>

  <UCard>
    <template #header>
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center">
          <span class="text-white font-bold text-2xl">
            {{ profile.name?.charAt(0) || 'U' }}
          </span>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ profile.name || 'Usuário' }}
          </h2>
          <p class="text-gray-500">{{ profile.email }}</p>
        </div>
      </div>
    </template>

    <div v-if="loading" class="text-center py-6">
      <UIcon name="i-lucide-loader" class="w-8 h-8 animate-spin mx-auto mb-3" />
      <p class="text-gray-500">Carregando...</p>
    </div>

    <div v-else class="space-y-4">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="error"
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField label="Nome" class="w-full">
          <UInput v-model="profile.name" placeholder="Seu nome completo" class="w-full" />
        </UFormField>

        <UFormField label="E-mail" class="w-full">
          <UInput v-model="profile.email" disabled class="w-full" />
        </UFormField>

        <UFormField label="Telefone" class="w-full">
          <UInput v-model="profile.phone" placeholder="(XX) XXXXX-XXXX" class="w-full" />
        </UFormField>

        <UFormField label="Função" class="w-full">
          <UInput v-model="profile.role" disabled class="w-full" />
        </UFormField>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          class="cursor-pointer"
          @click="handleCancel"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :loading="loading"
          class="cursor-pointer"
          @click="handleSave"
        >
          Salvar
        </UButton>
      </div>
    </template>
  </UCard>

  <UCard v-if="isAdmin" class="mt-6 border border-red-200">
    <template #header>
      <div class="flex items-center gap-2 text-red-700">
        <UIcon name="i-lucide-triangle-alert" class="w-5 h-5" />
        <h2 class="font-semibold">Zona de perigo</h2>
      </div>
    </template>

    <p class="text-sm text-gray-600">
      Excluir sua conta remove o acesso permanentemente. Esta ação não pode ser desfeita.
    </p>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          class="cursor-pointer"
          @click="showDeleteModal = true"
        >
          Excluir minha conta
        </UButton>
      </div>
    </template>
  </UCard>

  <UModal v-model:open="showDeleteModal" title="Excluir conta?">
    <template #body>
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-triangle-alert" class="w-5 h-5 text-red-600" />
          </div>
          <p class="text-gray-600">
            Sua conta será removida permanentemente. Todos os seus dados de acesso serão perdidos.
          </p>
        </div>

        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="showDeleteModal = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="error"
            :loading="loading"
            class="cursor-pointer"
            @click="confirmDelete"
          >
            Excluir
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'protected'
})

const auth = useAuth()
const { isAdmin } = auth
const toast = useToast()

const {
  profile,
  loading,
  error,
  loadProfile,
  saveProfile,
  deleteProfile,
  resetProfile
} = useProfile()

const showDeleteModal = ref(false)

onMounted(async () => {
  try {
    await loadProfile()
  } catch {
    // The error state is rendered in the page.
  }
})

async function handleSave() {
  try {
    await saveProfile({
      name: profile.value.name,
      phone: profile.value.phone,
      role: profile.value.role
    })

    toast.add({
      title: 'Sucesso!',
      description: 'Perfil salvo com sucesso.',
      icon: 'i-lucide-check',
      color: 'primary'
    })
  } catch {
    // The error state is rendered in the page.
  }
}

function handleCancel() {
  resetProfile()
}

async function confirmDelete() {
  try {
    await deleteProfile()

    toast.add({
      title: 'Perfil excluído',
      description: 'Sua conta foi removida permanentemente.',
      icon: 'i-lucide-check-circle',
      color: 'primary'
    })

    showDeleteModal.value = false
    await navigateTo('/login')
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível excluir o perfil.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}
</script>
