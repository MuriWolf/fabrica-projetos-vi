// composables/useAuthMock.ts

import usersData from '../mocks/users.json'

interface User {
  id: string
  email: string
  password: string
  name: string
}

interface LoginResponse {
  token: string
}

// Gerador simples de JWT fake (não precisa ser seguro, é só mock!)
function generateFakeToken(email: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(
    JSON.stringify({
      unique_name: email,
      email: email,
      exp: now + 28800, // 8 horas
      iat: now
    })
  )
  const signature = btoa('fake-signature')
  return `${header}.${payload}.${signature}`
}

export function useAuthMock() {
  const token = useState<string>('auth_token', () => '')
  const user = useState<{ id: string; email: string; name: string } | null>('auth_user', () => null)
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, passowrd: string) {
    isLoading.value = true
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500))

    isLoading.value = false

    const users = usersData.users as User[]
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!found) {
      throw new Error('E-mail ou senha inválidos.')
    }

    if (found.password !== passowrd) {
      throw new Error('E-mail ou senha inválidos.')
    }

    const fakeToken = generateFakeToken(found.email)

    token.value = fakeToken
    user.value = {
      id: found.id,
      email: found.email,
      name: found.name
    }

    // Persiste no localStorage
    if (import.meta.client) {
      localStorage.setItem('auth_token', fakeToken)
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }

    return {
      token: fakeToken
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

  // Auto-restore no mount
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
    getAuthHeader
  }
}