// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ui: {
    colorMode: false
  },
  runtimeConfig: {
    public: {
      // Override with NUXT_PUBLIC_API_BASE_URL
      apiBaseUrl: 'http://localhost:5080',
      // Override with NUXT_PUBLIC_USE_MOCKS=false when the backend is ready
      useMocks: true
    }
  }
})
