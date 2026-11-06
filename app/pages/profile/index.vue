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
          <p class="text-sm text-gray-400">
            {{ formatCpf(profile.cpf) || 'CPF não informado' }}
          </p>
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

      <UAlert
        v-if="!isMockMode"
        color="warning"
        variant="soft"
        icon="i-lucide-info"
        title="Modo API real"
        description="Nome e telefone são mantidos apenas neste navegador. CPF e senha são salvos no servidor."
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField
          label="Nome"
          class="w-full"
          :description="!isMockMode ? 'Não armazenado pelo backend' : undefined"
        >
          <UInput
            v-model="profile.name"
            placeholder="Seu nome completo"
            class="w-full"
            :disabled="!isMockMode"
          />
        </UFormField>

        <UFormField label="E-mail" class="w-full">
          <UInput v-model="profile.email" disabled class="w-full" />
        </UFormField>

        <UFormField
          label="CPF"
          class="w-full"
          required
          :error="cpfError || undefined"
          :description="!isMockMode ? 'Salvo no servidor ao confirmar a senha' : undefined"
        >
          <UInput
            v-model="cpfModel"
            placeholder="000.000.000-00"
            inputmode="numeric"
            maxlength="14"
            class="w-full"
            @blur="cpfTouched = true"
          />
        </UFormField>

        <UFormField
          v-if="!isMockMode"
          label="Senha"
          class="w-full"
          required
          :error="passwordError || undefined"
          description="Informe sua senha atual ou uma nova senha."
        >
          <UInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-key"
            autocomplete="current-password"
            class="w-full"
            @blur="passwordTouched = true"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                size="xs"
                :padded="false"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField
          label="Telefone"
          class="w-full"
          :description="!isMockMode ? 'Não armazenado pelo backend' : undefined"
        >
          <UInput
            v-model="profile.phone"
            placeholder="(XX) XXXXX-XXXX"
            class="w-full"
            :disabled="!isMockMode"
          />
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
import { formatCpf, isValidCpf, onlyDigits } from '~/utils/cpf'

definePageMeta({
  layout: 'protected'
})

const config = useRuntimeConfig()
const isMockMode = config.public.useMocks
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
const cpfTouched = ref(false)
const password = ref('')
const passwordTouched = ref(false)
const showPassword = ref(false)

const cpfModel = computed({
  get: () => formatCpf(profile.value.cpf),
  set: (value: string) => {
    profile.value.cpf = onlyDigits(value).slice(0, 11)
  }
})

const cpfError = computed(() => {
  if (!cpfTouched.value) return ''

  if (!profile.value.cpf) return 'CPF é obrigatório'
  if (!isValidCpf(profile.value.cpf)) return 'Informe um CPF válido'

  return ''
})

const passwordError = computed(() => {
  if (isMockMode || !passwordTouched.value) return ''

  if (!password.value) return 'Informe sua senha para salvar'
  if (password.value.length < 8) return 'A senha deve ter pelo menos 8 caracteres'

  return ''
})

onMounted(async () => {
  try {
    await loadProfile()
  } catch {
    // The error state is rendered in the page.
  }
})

async function handleSave() {
  cpfTouched.value = true
  passwordTouched.value = true

  if (!profile.value.cpf || !isValidCpf(profile.value.cpf)) {
    toast.add({
      title: 'CPF inválido',
      description: profile.value.cpf
        ? 'Informe um CPF válido.'
        : 'O CPF é obrigatório.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
    return
  }

  if (!isMockMode && (!password.value || password.value.length < 8)) {
    toast.add({
      title: 'Senha obrigatória',
      description:
        'Informe sua senha atual ou uma nova senha com pelo menos 8 caracteres.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
    return
  }

  try {
    await saveProfile(
      {
        name: profile.value.name,
        phone: profile.value.phone,
        cpf: profile.value.cpf,
        role: profile.value.role
      },
      password.value
    )

    password.value = ''
    passwordTouched.value = false

    toast.add({
      title: 'Sucesso!',
      description: isMockMode
        ? 'Perfil salvo com sucesso.'
        : 'CPF e senha salvos. Nome e telefone continuam apenas neste navegador.',
      icon: 'i-lucide-check',
      color: 'primary'
    })
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível salvar o perfil.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

function handleCancel() {
  resetProfile()
  cpfTouched.value = false
  password.value = ''
  passwordTouched.value = false
  showPassword.value = false
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
