// stores/auth.ts
import { defineStore } from 'pinia'

interface User {
  id: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    isLoading.value = true
    const API_BASE = 'http://localhost:5080'

    try {
      const response = await $fetch<{ token: string }>(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        body: { email, password },
        headers: { 'Content-Type': 'application/json' },
      })

      token.value = response.token
      user.value = { id: '', email }

      if (import.meta.client) {
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('auth_user', JSON.stringify(user.value))
      }
    } catch (error: any) {
      throw new Error(error.data?.message || 'E-mail ou senha inválidos')
    } finally {
      isLoading.value = false
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

  // Auto-restore no mount
  if (import.meta.client) {
    restoreAuth()
  }

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    restoreAuth,
  }
})