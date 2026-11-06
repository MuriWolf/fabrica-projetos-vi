import usersData from '~/mocks/users.json'
import { onlyDigits } from '~/utils/cpf'

export interface AuthUser {
  id: string
  email: string
  name: string
  phone: string
  cpf: string
  role: string
}

interface MockUser {
  id: string
  email: string
  password: string
  name: string
  cpf: string
  role: string
}

interface LoginResponse {
  token: string
}

const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateMockToken(user: MockUser) {
  return `mock.${user.id}.${Date.now()}`
}

// Sessions created before CPF support may not have the field yet.
function normalizeUser(value: AuthUser | null | undefined): AuthUser | null {
  if (!value) return null

  return { ...value, cpf: onlyDigits(value.cpf) }
}

function getErrorMessage(error: any): string {
  const data = error?.data

  if (typeof data === 'string' && data.trim()) return data
  if (data?.message) return data.message
  if (error?.message) return error.message

  return 'E-mail ou senha inválidos.'
}

/**
 * Single auth implementation for the whole app.
 *
 * While NUXT_PUBLIC_USE_MOCKS is true it authenticates against app/mocks/users.json.
 * When the backend is ready, set NUXT_PUBLIC_USE_MOCKS=false and it will call
 * POST /api/auth/login and GET /api/users/email/{email}.
 */
export function useAuth() {
  const config = useRuntimeConfig()

  const tokenCookie = useCookie<string | null>('auth_token', {
    default: () => null,
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax',
    path: '/'
  })

  const userCookie = useCookie<AuthUser | null>('auth_user', {
    default: () => null,
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax',
    path: '/'
  })

  const token = useState<string>('auth_token', () => tokenCookie.value || '')
  const user = useState<AuthUser | null>('auth_user', () => normalizeUser(userCookie.value))
  const isLoading = useState<boolean>('auth_loading', () => false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'Admin')

  function setSession(newToken: string, newUser: AuthUser) {
    const normalizedUser = normalizeUser(newUser)

    token.value = newToken
    user.value = normalizedUser
    tokenCookie.value = newToken
    userCookie.value = normalizedUser
  }

  async function login(email: string, password: string) {
    isLoading.value = true

    try {
      if (config.public.useMocks) {
        await delay(500)

        const users = usersData.users as MockUser[]
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())

        if (!found || found.password !== password) {
          throw new Error('E-mail ou senha inválidos.')
        }

        const mockUser: AuthUser = {
          id: found.id,
          email: found.email,
          name: found.name,
          phone: '',
          cpf: onlyDigits(found.cpf),
          role: found.role
        }

        setSession(generateMockToken(found), mockUser)
        return true
      }

      const response = await $fetch<LoginResponse>(`${config.public.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        body: { email, password },
        headers: { 'Content-Type': 'application/json' }
      })

      // The backend currently returns only the token; fetch the user separately.
      type RemoteUser = { id: string; email: string; cpf?: string; Cpf?: string }
      let remoteUser: RemoteUser | null = null

      try {
        remoteUser = await $fetch<RemoteUser>(
          `${config.public.apiBaseUrl}/api/users/email/${encodeURIComponent(email)}`,
          { headers: { Authorization: `Bearer ${response.token}` } }
        )
      } catch {
        // Keep login working while the backend endpoint is unavailable.
      }

      const authenticatedUser: AuthUser = {
        id: remoteUser?.id || '',
        email: remoteUser?.email || email,
        name: email.split('@')[0] || email,
        phone: '',
        // Accept both camelCase and PascalCase while the backend contract settles.
        cpf: onlyDigits(remoteUser?.cpf || remoteUser?.Cpf),
        // Roles do not exist in the backend yet.
        role: 'Regular'
      }

      setSession(response.token, authenticatedUser)
      return true
    } catch (error: any) {
      throw new Error(getErrorMessage(error))
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    token.value = ''
    user.value = null
    tokenCookie.value = null
    userCookie.value = null
  }

  function restoreAuth() {
    token.value = tokenCookie.value || ''
    user.value = normalizeUser(userCookie.value)
  }

  function updateUser(updates: Partial<AuthUser>) {
    if (!user.value) return

    const updatedUser = normalizeUser({ ...user.value, ...updates })
    if (!updatedUser) return

    user.value = updatedUser
    userCookie.value = updatedUser
  }

  function getAuthHeader() {
    if (!token.value) return {}

    return {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    logout,
    restoreAuth,
    updateUser,
    getAuthHeader
  }
}
