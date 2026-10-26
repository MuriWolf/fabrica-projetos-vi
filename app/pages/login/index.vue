<template>
  <div
    class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4"
  >
    <UCard
      class="w-full max-w-md shadow-xl border-0"
      :ui="{
        base: 'bg-white/80 backdrop-blur-sm',
        ring: 'ring-2 ring-purple-100',
        divide: 'divide-y divide-gray-100',
        body: { base: 'p-6' },
        footer: { base: 'pt-4' },
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
      <UForm class="flex flex-col gap-4">
        <!-- E-mail -->
        <UFormGroup label="E-mail" name="email" class="w-full">
          <UInput
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            icon="i-heroicons-envelope"
            autocomplete="email"
            :ui="{ base: 'rounded-lg' }"
            class="w-full"
            @keyup.enter="handleLogin"
          />
        </UFormGroup>

        <!-- Senha -->
        <UFormGroup label="Senha" name="password">
          <UInput
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-key"
            autocomplete="current-password"
            class="w-full"
            :ui="{ base: 'rounded-lg' }"
          >
            <template #trailing>
              <UButton
                color="gray"
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
        </UFormGroup>

        <UToken
          v-if="error"
          variant="solid"
          color="red"
          class="text-sm"
          :ui="{ base: 'py-2 px-3' }"
        >
          {{ error }}
        </UToken>

        <UButton
          type="submit"
          block
          size="lg"
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
          @click="handleLogin"
          class="font-semibold cursor-pointer"
        >
          <span v-if="isLoading" class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-path-solid" class="animate-spin" />
            Entrando...
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-right-circle-solid" />
            Entrar
          </span>
        </UButton>
      </UForm>

      <!-- Footer -->
      <template #footer>
        <div class="text-center text-sm text-gray-500 space-y-2">
          <!-- Créditos / Info do backend -->
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

const { login, isLoading } = useAuthMock();
const route = useRoute()
const router = useRouter()

const email = ref("");
const password = ref("");
const error = ref("");
const showPassword = ref(false);

// Validação simples
const isFormValid = computed(() => {
  return email.value.trim().length > 0 && password.value.length > 0;
});

const redirectTo = computed(() => {
  const redirect = route.query.redirect as string
  return redirect || '/'
})

async function handleLogin() {
  try {
    error.value = "";
    await login(email.value, password.value);

    await router.push(redirectTo.value)
  } catch (err: any) {
    error.value = err.message || "E-mail ou senha inválidos";
  }
}

// Pre-fill com usuário de exemplo (opcional, para facilitar testes)
onMounted(() => {
  email.value = "aluno@ages.edu.br";
  password.value = "123456";
});
</script>

<style lang="css" scoped>

</style>