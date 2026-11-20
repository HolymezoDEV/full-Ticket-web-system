import type { NavigationMenuItem } from '@nuxt/ui'

/** Settings sections the current user may open, shared by sidebar and settings tabs. */
export function useSettingsLinks() {
  const { can } = useAuth()
  return computed(() => {
    const links: (NavigationMenuItem & { to: string })[] = [
      { label: 'Profil', icon: 'i-lucide-user', to: '/settings', exact: true },
      { label: 'Sicherheit', icon: 'i-lucide-shield', to: '/settings/security' }
    ]
    if (can('settings.mail')) links.push({ label: 'Mailserver', icon: 'i-lucide-mail', to: '/settings/mail' })
    if (can('settings.topics')) links.push({ label: 'Themen', icon: 'i-lucide-tags', to: '/settings/topics' })
    if (can('settings.team')) links.push({ label: 'Team', icon: 'i-lucide-users', to: '/settings/team' })
    if (can('settings.roles')) links.push({ label: 'Rollen', icon: 'i-lucide-key-round', to: '/settings/roles' })
    return links
  })
}
