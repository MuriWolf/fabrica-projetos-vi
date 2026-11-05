<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4"
  >
    <UCard
      class="w-full max-w-md shadow-xl border-0"
      :ui="{
        root: 'bg-white/80 backdrop-blur-sm ring-2 ring-purple-100',
        body: 'p-6',
        footer: 'pt-4',
      }"
    >
      <!-- Header -->
      <template #header>
        <div class="flex flex-col items-center gap-3">
          <!-- Logo / Ícone -->
          <div
            class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg"
          >
            <UIcon
              name="i-heroicons-lock-closed-solid"
              class="w-8 h-8 text-white"
            />
          </div>

          <div class="text-center space-y-1">
            <h1 class="text-2xl font-bold text-gray-900">Bem-vindo(a)</h1>
            <p class="text-sm text-gray-500">Faça login para continuar</p>
          </div>
        </div>
      </template>

      <!-- Formulário -->
      <UForm class="flex flex-col gap-4" @submit="handleLogin">
        <!-- E-mail -->
        <UFormField label="E-mail" name="email" class="w-full">
          <UInput
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            icon="i-heroicons-envelope"
            autocomplete="email"
            :ui="{ base: 'rounded-lg' }"
            class="w-full"
            required
          />
        </UFormField>

        <!-- Senha -->
        <UFormField label="Senha" name="password">
          <UInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-key"
            autocomplete="current-password"
            class="w-full"
            :ui="{ base: 'rounded-lg' }"
            required
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="
                  showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'
                "
                size="xs"
                :padded="false"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="error"
        />

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
          class="font-semibold cursor-pointer"
        >
          <span class="flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-right-circle-solid" />
            Entrar
          </span>
        </UButton>
      </UForm>

      <!-- Footer -->
      <template #footer>
        <div class="text-center text-sm text-gray-500 space-y-2">
          <p>Sistema de Gestão de Medicamentos</p>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  public: true
})

const { login, isLoading } = useAuth()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)

const isFormValid = computed(() => {
  return email.value.trim().length > 0 && password.value.length > 0
})

const redirectTo = computed(() => {
  const redirect = route.query.redirect as string
  return redirect || '/'
})

async function handleLogin() {
  error.value = ''

  if (!isFormValid.value) {
    error.value = 'Preencha o e-mail e a senha.'
    return
  }

  try {
    await login(email.value, password.value)
    await router.push(redirectTo.value)
  } catch (err: any) {
    error.value = err.message || 'E-mail ou senha inválidos'
  }
}
</script>
