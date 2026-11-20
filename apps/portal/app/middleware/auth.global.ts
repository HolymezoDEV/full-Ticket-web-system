const guestPages = new Set(['/login', '/register'])

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  if (!auth.loaded.value) await auth.refresh()

  if (!auth.user.value) {
    if (guestPages.has(to.path)) return
    return navigateTo({ path: auth.hasUsers.value ? '/login' : '/register', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } })
  }
  if (guestPages.has(to.path)) return navigateTo('/')
  if (to.path.startsWith('/settings') && auth.user.value.role !== 'Admin') return navigateTo('/')
})
