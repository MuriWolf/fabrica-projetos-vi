import type { AuthUser } from './useAuth'

// Shared fetch wrapper: injects the auth token and handles expired sessions.
export function useApi() {
  const config = useRuntimeConfig()
  const router = useRouter()

  // These state keys and cookie-backed defaults are shared with useAuth, so it
  // does not matter which composable is instantiated first.
  const tokenCookie = useCookie<string | null>('auth_token', { default: () => null })
  const userCookie = useCookie<AuthUser | null>('auth_user', { default: () => null })

  const tokenState = useState<string>('auth_token', () => tokenCookie.value || '')
  const userState = useState<AuthUser | null>('auth_user', () => userCookie.value || null)

  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    onRequest({ options }) {
      if (!tokenState.value) return

      const headers = new Headers(options.headers as HeadersInit | undefined)
      headers.set('Authorization', `Bearer ${tokenState.value}`)
      options.headers = headers
    },
    onResponseError({ response }) {
      if (response.status !== 401) return

      // Token expired or invalid: clear the session and send the user to login.
      tokenState.value = ''
      userState.value = null
      tokenCookie.value = null
      userCookie.value = null

      if (import.meta.client) {
        router.push('/login')
      }
    }
  })
}
