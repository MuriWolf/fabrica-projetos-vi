export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  // Public pages do not require a session.
  const publicPages = ['/login', '/register']
  const isPublicPage = publicPages.some(page => to.path.startsWith(page)) || to.meta.public === true

  if (!auth.isAuthenticated.value && !isPublicPage) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  if (auth.isAuthenticated.value && isPublicPage) {
    const redirect = (to.query.redirect as string) || '/'
    return navigateTo(redirect, { replace: true })
  }

  return undefined
})
