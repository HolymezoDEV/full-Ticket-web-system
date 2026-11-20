<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{ collapsed?: boolean }>()

const colorMode = useColorMode()
const { user, can, logout } = useAuth()
const sounds = useSounds()

const items = computed<DropdownMenuItem[][]>(() => [[{
  type: 'label',
  label: user.value?.name,
  description: `${user.value?.email} · ${user.value?.roleName}`,
  avatar: { text: initials(user.value?.name ?? '') }
}], [{
  label: 'Profil',
  icon: 'i-lucide-user',
  to: '/settings'
}, {
  label: 'Sicherheit',
  icon: 'i-lucide-shield',
  to: '/settings/security'
}, ...(can('settings.mail')
  ? [{ label: 'Mailserver', icon: 'i-lucide-mail', to: '/settings/mail' }]
  : [])], [{
  label: 'Töne',
  icon: sounds.enabled.value ? 'i-lucide-volume-2' : 'i-lucide-volume-x',
  type: 'checkbox',
  checked: sounds.enabled.value,
  onSelect(e: Event) {
    e.preventDefault()
    sounds.toggle()
  }
}, {
  label: 'Darstellung',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Hell',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    }
  }, {
    label: 'Dunkel',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
    }
  }]
}], [{
  label: 'Abmelden',
  icon: 'i-lucide-log-out',
  color: 'error',
  onSelect: () => logout()
}]])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-56' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :avatar="{ text: initials(user?.name ?? '') }"
      :label="collapsed ? undefined : user?.name"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />
  </UDropdownMenu>
</template>
