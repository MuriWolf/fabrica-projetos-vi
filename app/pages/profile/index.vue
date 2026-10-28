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

    <div v-if="loading" class="text-center">
      <UIcon name="i-lucide-loader" class="w-8 h-8 animate-spin mx-auto mb-3" />
      <p class="text-gray-500">Carregando...</p>
    </div>

    <div v-else class="flex gap-4">
      <UFormGroup label="Nome" :error="error" class="flex-1">
        <UInput v-model="profile.name" placeholder="Seu nome completo" class="w-full" />
      </UFormGroup>

      <UFormGroup label="E-mail" class="flex-1">
        <UInput v-model="profile.email" disabled class="w-full" />
      </UFormGroup>

      <UFormGroup label="Telefone" :error="error" class="flex-1 max-w-36">
        <UInput v-model="profile.phone" placeholder="(XX) XXXXX-XXXX" class="w-full" />
      </UFormGroup>

      <UFormGroup label="Função" class="flex-1">
        <UInput v-model="profile.role" disabled class="w-full" />
      </UFormGroup>

      <UToken
        v-if="error"
        variant="solid"
        color="red"
        class="text-sm"
      >
        {{ error }}
      </UToken>
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
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'protected'
})

const authStore = useAuthMock();
const toast = useToast()
const profileStore = useProfileMock()
const showDeleteModal = ref(false)

const { profile, loading, error, loadProfile, saveProfile, deleteProfile, resetProfile } = profileStore
const { isAdmin } = authStore

// Carrega ao montar
onMounted(async () => {
  await loadProfile()
})

// Salvar
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
      icon: 'i-lucide-check' 
    })
  } catch (err: any) {
    console.error('Erro ao salvar:', err)
  }
}

function handleCancel() {
  resetProfile()
}

function handleDelete() {
  showDeleteModal.value = true
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
    
    // Redireciona para login (feito no deleteProfile via auth.logout())
    navigateTo('/login')
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