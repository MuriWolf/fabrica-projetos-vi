import usersData from '~/mocks/users.json'
import { onlyDigits } from '~/utils/cpf'

export interface AuthUser {
  id: string
  email: string
  cpf: string
  role: string
}

interface MockUser {
  id: string
  email: string
  password: string
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

// Rebuild the session user so stale cookie fields are dropped.
function normalizeUser(value: AuthUser | null | undefined): AuthUser | null {
  if (!value) return null

  return {
    id: value.id,
    email: value.email,
    cpf: onlyDigits(value.cpf),
    role: value.role
  }
}

function getErrorMessage(error: any, fallback = 'E-mail ou senha inválidos.'): string {
  const data = error?.data

  if (typeof data === 'string' && data.trim()) return data
  if (data?.detail) return data.detail
  if (data?.message) return data.message

  if (data?.errors && typeof data.errors === 'object') {
    const firstError = Object.values(data.errors).flat().find(Boolean)
    if (typeof firstError === 'string') return firstError
  }

  if (error?.message) return error.message

  return fallback
}

function generateMockUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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

  // Kept in shared state so a registration made in mock mode can be used by login.
  const mockUsers = useState<MockUser[]>('mock_users', () =>
    (usersData.users as MockUser[]).map(user => ({ ...user }))
  )

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

        const found = mockUsers.value.find(
          user => user.email.toLowerCase() === email.toLowerCase()
        )

        if (!found || found.password !== password) {
          throw new Error('E-mail ou senha inválidos.')
        }

        const mockUser: AuthUser = {
          id: found.id,
          email: found.email,
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

  async function register(email: string, password: string, cpf: string) {
    isLoading.value = true

    try {
      const normalizedEmail = email.trim()
      const normalizedCpf = onlyDigits(cpf)

      if (config.public.useMocks) {
        await delay(600)

        const alreadyExists = mockUsers.value.some(
          user => user.email.toLowerCase() === normalizedEmail.toLowerCase()
        )

        if (alreadyExists) {
          throw new Error('Já existe uma conta com este e-mail.')
        }

        const newUser: MockUser = {
          id: generateMockUserId(),
          email: normalizedEmail,
          password,
          cpf: normalizedCpf,
          role: 'Regular'
        }

        mockUsers.value.push(newUser)

        setSession(generateMockToken(newUser), {
          id: newUser.id,
          email: newUser.email,
          cpf: newUser.cpf,
          role: newUser.role
        })

        return true
      }

      await $fetch(`${config.public.apiBaseUrl}/api/users`, {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password,
          cpf: normalizedCpf
        },
        headers: { 'Content-Type': 'application/json' }
      })

      // Sign in immediately after the account is created.
      await login(normalizedEmail, password)
      return true
    } catch (error: any) {
      throw new Error(getErrorMessage(error, 'Não foi possível criar a conta.'))
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
    register,
    logout,
    restoreAuth,
    updateUser,
    getAuthHeader
  }
}
