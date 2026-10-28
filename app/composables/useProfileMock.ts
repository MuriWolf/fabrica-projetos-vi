interface Profile {
  id?: string
  name: string
  email: string
  phone: string
  role: string
}

export function useProfileMock() {
  const auth = useAuthMock()
  
  const profile = ref<Profile>({
    name: '',
    email: '',
    phone: '',
    role: ''
  })
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadProfile(): Promise<Profile> {
    loading.value = true
    error.value = null

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      if (!auth.user.value?.name || !auth.user?.value.email) {
        throw new Error('Usuário não autenticado')
      }

      profile.value = {
        id: auth.user.value.id || undefined,
        name: auth.user.value.name,
        email: auth.user.value.email,
        phone: profile.value.phone || '(51) 99999-9999',
        role: profile.value.role
      }

      return profile.value
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(updates: Partial<Profile>): Promise<Profile> {
    loading.value = true
    error.value = null

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      // Atualiza localmente
      profile.value = { ...profile.value, ...updates }

      // Salva no mock (apenas em memória neste exemplo)
      console.log('Perfil salvo:', profile.value)

      return profile.value
    } catch (err: any) {
      error.value = err.message || 'Erro ao salvar perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Exclui o perfil (apenas para administradores) - MOCK */
  async function deleteProfile(): Promise<void> {
    // Verifica se é administrador
    if (profile.value.role !== 'Admin') {
      throw new Error('Somente administradores podem excluir seu perfil')
    }

    loading.value = true
    error.value = null

    try {
      // Confirmação adicional
      const confirmed = confirm('Tem certeza? Esta ação não pode ser desfeita.')
      if (!confirmed) return

      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Perfil excluído:', profile.value.email)

      // Desloga o usuário após exclusão
      await auth.logout()
    } catch (err: any) {
      error.value = err.message || 'Erro ao excluir perfil'
      throw err
    } finally {
      loading.value = false
    }
  }


  /** Atualiza apenas um campo */
  async function updateField<K extends keyof Profile>(field: K, value: Profile[K]) {
    profile.value[field] = value
  }

  /** Reseta para os dados originais */
  function resetProfile() {
    profile.value = {
      name: auth.user?.value?.name || '',
      email: auth.user?.value?.email || '',
      phone: profile.value.phone || '',
      role: profile.value.role || 'Usuário'
    }
  }

  // Carrega automaticamente no mount (opcional)
  if (import.meta.client) {
    // Descomente se quiser carregar ao instanciar
    // onMounted(loadProfile)
  }

  console.log(profile.value);
  

  return {
    profile,
    loading,
    error,
    loadProfile,
    saveProfile,
    deleteProfile,
    updateField,
    resetProfile
  }
}