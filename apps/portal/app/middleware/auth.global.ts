const guestPages = new Set(['/login', '/register'])

// Pages that need a specific permission; everything else only needs a login.
const pagePermissions: [string, Permission][] = [
  ['/settings/mail', 'settings.mail'],
  ['/settings/team', 'settings.team'],
  ['/settings/roles', 'settings.roles'],
  ['/settings/topics', 'settings.topics'],
  ['/customers', 'customers.view'],
  ['/tickets', 'tickets.view']
]

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  if (!auth.loaded.value) await auth.refresh()

  if (!auth.user.value) {
    if (guestPages.has(to.path)) return
    return navigateTo({ path: auth.hasUsers.value ? '/login' : '/register', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } })
  }
  if (guestPages.has(to.path)) return navigateTo('/')
  const required = pagePermissions.find(([path]) => to.path.startsWith(path))
  if (required && !auth.can(required[1])) return navigateTo(to.path.startsWith('/settings') ? '/settings' : '/')
})
