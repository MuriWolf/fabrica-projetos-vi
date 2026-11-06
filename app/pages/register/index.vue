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
      <template #header>
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg"
          >
            <UIcon name="i-heroicons-user-plus" class="w-8 h-8 text-white" />
          </div>

          <div class="text-center space-y-1">
            <h1 class="text-2xl font-bold text-gray-900">Criar conta</h1>
            <p class="text-sm text-gray-500">Cadastre-se para acessar o sistema</p>
          </div>
        </div>
      </template>

      <UForm
        :schema="registerSchema"
        :state="form"
        class="flex flex-col gap-4"
        @submit="handleRegister"
      >
        <UFormField label="E-mail" name="email" class="w-full">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="seu@email.com"
            icon="i-heroicons-envelope"
            autocomplete="email"
            class="w-full"
            :ui="{ base: 'rounded-lg' }"
            :disabled="isLoading"
            required
          />
        </UFormField>

        <UFormField label="CPF" name="cpf" class="w-full">
          <UInput
            v-model="cpfModel"
            placeholder="000.000.000-00"
            icon="i-heroicons-identification"
            inputmode="numeric"
            maxlength="14"
            class="w-full"
            :ui="{ base: 'rounded-lg' }"
            :disabled="isLoading"
            required
          />
        </UFormField>

        <UFormField
          label="Senha"
          name="password"
          class="w-full"
          description="Mínimo de 8 caracteres"
        >
          <UInput
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-key"
            autocomplete="new-password"
            class="w-full"
            :ui="{ base: 'rounded-lg' }"
            :disabled="isLoading"
            required
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

        <UFormField label="Confirmar senha" name="confirmPassword" class="w-full">
          <UInput
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-heroicons-key"
            autocomplete="new-password"
            class="w-full"
            :ui="{ base: 'rounded-lg' }"
            :disabled="isLoading"
            required
          />
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
          :disabled="isLoading"
          class="font-semibold cursor-pointer"
        >
          <span class="flex items-center justify-center gap-2">
            <UIcon name="i-heroicons-arrow-right-circle-solid" />
            Criar conta
          </span>
        </UButton>
      </UForm>

      <template #footer>
        <div class="text-center text-sm text-gray-500">
          Já tem uma conta?
          <NuxtLink
            :to="loginLink"
            class="text-primary-600 hover:underline font-medium"
          >
            Entrar
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { registerSchema, type RegisterFormData } from '~/composables/useRegisterSchema'
import { formatCpf, onlyDigits } from '~/utils/cpf'

definePageMeta({
  public: true
})

const { register, isLoading } = useAuth()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const form = reactive({
  email: '',
  cpf: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')
const showPassword = ref(false)

const cpfModel = computed({
  get: () => formatCpf(form.cpf),
  set: (value: string) => {
    form.cpf = onlyDigits(value).slice(0, 11)
  }
})

const redirectTo = computed(() => {
  const redirect = route.query.redirect as string
  return redirect || '/'
})

const loginLink = computed(() => ({
  path: '/login',
  query: route.query.redirect ? { redirect: route.query.redirect } : {}
}))

async function handleRegister(event: { data: RegisterFormData }) {
  error.value = ''

  try {
    await register(event.data.email, event.data.password, event.data.cpf)

    toast.add({
      title: 'Conta criada!',
      description: 'Você já está autenticado.',
      icon: 'i-lucide-check',
      color: 'primary'
    })

    await router.push(redirectTo.value)
  } catch (err: any) {
    error.value = err.message || 'Não foi possível criar a conta.'
  }
}
</script>
