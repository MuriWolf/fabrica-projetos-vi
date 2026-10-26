// composables/useAuth.ts

const API_BASE = 'http://localhost:5080' // Porta do backend (confira em launchSettings.json)

interface LoginResponse {
  token: string
}

interface User {
  id: string
  email: string
}

export function useAuth() {
  const token = useState<string>('auth_token', () => '')
  const user = useState<User | null>('auth_user', () => null)
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    try {
      isLoading.value = true;
      const response = await $fetch<LoginResponse>(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: { email, password },
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Guarda token e dados
      token.value = response.token
      user.value = { id: '', email } // ID só vem do /api/users/email/{email} depois
      
      // Salva no localStorage (persiste entre recargas)
      if (import.meta.client) {
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('auth_user', JSON.stringify({ id: '', email }))
      }

      return true
    } catch (error: any) {
      console.error('Erro no login:', error)
      throw new Error(error.data?.message || 'E-mail ou senha inválidos')
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    token.value = ''
    user.value = null
    
    if (import.meta.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  function restoreAuth() {
    if (!import.meta.client) return
    
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken) token.value = savedToken
    if (savedUser) user.value = JSON.parse(savedUser)
  }

  function getAuthHeader() {
    if (!token.value) return {}
    return {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }
  }

  // Inicializa ao carregar a página
  if (import.meta.client) {
    restoreAuth()
  }

  return {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    restoreAuth,
    getAuthHeader,
  }
}