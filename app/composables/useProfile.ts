import { onlyDigits } from '~/utils/cpf'

interface Profile {
  id?: string
  name: string
  email: string
  phone: string
  cpf: string
  role: string
}

interface BackendUser {
  id: string
  email: string
  cpf?: string
  Cpf?: string
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Profile adapter. Uses the authenticated user as the source of truth.
 * The backend stores id, email, CPF and password; name, phone and role are
 * local-only until the API supports them.
 */
export function useProfile() {
  const config = useRuntimeConfig()
  const useMocks = config.public.useMocks
  const api = useApi()
  const auth = useAuth()

  const profile = useState<Profile>('profile_data', () => ({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    role: ''
  }))
  const loading = useState<boolean>('profile_loading', () => false)
  const error = useState<string | null>('profile_error', () => null)

  async function loadProfile(): Promise<Profile> {
    loading.value = true
    error.value = null

    try {
      const currentUser = auth.user.value

      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      if (useMocks) {
        await delay(300)

        profile.value = {
          id: currentUser.id || undefined,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '(51) 99999-9999',
          cpf: onlyDigits(currentUser.cpf),
          role: currentUser.role
        }

        auth.updateUser({
          name: profile.value.name,
          email: profile.value.email,
          phone: profile.value.phone,
          cpf: profile.value.cpf,
          role: profile.value.role
        })

        return profile.value
      }

      const user = await api<BackendUser>(
        `/api/users/email/${encodeURIComponent(currentUser.email)}`
      )

      profile.value = {
        id: user.id,
        name: currentUser.name || user.email.split('@')[0] || 'Usuário',
        email: user.email,
        phone: currentUser.phone || '',
        // Older API responses do not include CPF; fall back to the session.
        cpf: onlyDigits(user.cpf || user.Cpf || currentUser.cpf),
        role: currentUser.role || 'Regular'
      }

      auth.updateUser({
        id: profile.value.id || '',
        email: profile.value.email,
        name: profile.value.name,
        phone: profile.value.phone,
        cpf: profile.value.cpf,
        role: profile.value.role
      })

      return profile.value
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Erro ao carregar perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(updates: Partial<Profile>, password?: string): Promise<Profile> {
    loading.value = true
    error.value = null

    try {
      if (useMocks) {
        profile.value = { ...profile.value, ...updates }

        // Keep the sidebar and the persisted session in sync with the profile.
        auth.updateUser({
          name: profile.value.name,
          email: profile.value.email,
          phone: profile.value.phone,
          cpf: profile.value.cpf,
          role: profile.value.role
        })

        await delay(500)
        return profile.value
      }

      // PUT /api/users/{id} requires email, password and CPF. The backend has no
      // name, phone or role fields yet, so those stay local to the browser.
      if (!password || password.length < 8) {
        throw new Error(
          'Informe uma senha com pelo menos 8 caracteres para salvar as alterações.'
        )
      }

      const userId = profile.value.id
      if (!userId) {
        throw new Error('Não foi possível identificar o usuário para salvar o perfil.')
      }

      const email = (updates.email ?? profile.value.email).trim()
      const cpf = onlyDigits(updates.cpf ?? profile.value.cpf)

      const user = await api<BackendUser>(`/api/users/${userId}`, {
        method: 'PUT',
        body: { email, password, cpf }
      })

      profile.value = {
        ...profile.value,
        ...updates,
        id: user.id || userId,
        email: user.email || email,
        cpf: onlyDigits(user.cpf || user.Cpf || cpf)
      }

      auth.updateUser({
        id: profile.value.id || '',
        email: profile.value.email,
        name: profile.value.name,
        phone: profile.value.phone,
        cpf: profile.value.cpf,
        role: profile.value.role
      })

      return profile.value
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Erro ao salvar perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProfile(): Promise<void> {
    if (profile.value.role !== 'Admin') {
      throw new Error('Somente administradores podem excluir seu perfil')
    }

    loading.value = true
    error.value = null

    try {
      if (!useMocks && profile.value.id) {
        await api(`/api/users/${profile.value.id}`, { method: 'DELETE' })
      }

      await auth.logout()
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Erro ao excluir perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateField<K extends keyof Profile>(field: K, value: Profile[K]) {
    profile.value[field] = value
  }

  function resetProfile() {
    const currentUser = auth.user.value

    profile.value = {
      id: currentUser?.id || undefined,
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      cpf: onlyDigits(currentUser?.cpf),
      role: currentUser?.role || 'Usuário'
    }
  }

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
