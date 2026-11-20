export type AuthUser = { id: string; name: string; email: string; role: 'Admin' | 'Agent'; createdAt: string }
type MeResponse = { user: AuthUser | null; registrationOpen: boolean; hasUsers: boolean }

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const registrationOpen = useState('auth-registration-open', () => true)
  const hasUsers = useState('auth-has-users', () => true)
  const loaded = useState('auth-loaded', () => false)
  const requestFetch = useRequestFetch()

  async function refresh() {
    const me = await requestFetch<MeResponse>('/api/auth/me')
    user.value = me.user
    registrationOpen.value = me.registrationOpen
    hasUsers.value = me.hasUsers
    loaded.value = true
  }

  async function login(email: string, password: string) {
    const result = await $fetch<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: { email, password } })
    user.value = result.user
  }

  async function register(input: { name: string; email: string; password: string }) {
    const result = await $fetch<{ user: AuthUser }>('/api/auth/register', { method: 'POST', body: input })
    user.value = result.user
    hasUsers.value = true
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    clearNuxtData()
    await navigateTo('/login')
  }

  return { user, registrationOpen, hasUsers, loaded, refresh, login, register, logout }
}

/** Only allow same-site relative redirects after login. */
export function safeRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'
}

export function errorMessage(error: unknown, fallback: string) {
  const data = (error as { data?: { statusMessage?: string; message?: string } })?.data
  return data?.statusMessage || data?.message || fallback
}
