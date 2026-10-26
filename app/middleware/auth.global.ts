export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuthMock()

  // Aguarda restauração da sessão (caso venha de recarga)
  if (!auth.isAuthenticated.value && import.meta.client) {
    await nextTick()
  }

  const isAuthenticated = auth.isAuthenticated.value

  // Páginas públicas (não exigem login)
  const publicPages = [
    '/login'
  ]

  // Verifica se a rota atual é pública
  const isPublicPage = publicPages.some(page => 
    to.path.startsWith(page)
  )

  // Verifica se a rota tem meta.public: true
  const isExplicitPublic = to.meta.public === true

  const shouldBePublic = isPublicPage || isExplicitPublic

  if (!isAuthenticated && !shouldBePublic) {
    // Usuário não logado tentando acessar rota protegida
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  if (isAuthenticated && shouldBePublic) {
    // Usuário logado tentando acessar página pública
    const redirect = to.query.redirect as string || '/'
    return navigateTo(redirect, { replace: true })
  }

  // Permite acesso normal
  return undefined
})