<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

useSeoMeta({ title: 'Team' })

type RoleOption = { id: string, name: string }

const toast = useToast()
const { user: me, can, refresh: refreshMe } = useAuth()
const { data: members, refresh } = await useFetch<TeamMember[]>('/api/users', { key: 'users', default: () => [] })
const { data: rolesData } = await useFetch<{ roles: RoleOption[] }>('/api/roles', { key: 'roles' })
const { data: settings, refresh: refreshSettings } = await useFetch<{ app: { allowRegistration: boolean, defaultRoleId: string } }>('/api/settings', { key: 'settings' })

const roleItems = computed(() => (rolesData.value?.roles ?? []).map(role => ({ label: role.name, value: role.id })))
const defaultRoleItems = computed(() => roleItems.value.filter(role => role.value !== 'admin'))

const q = ref('')
const filtered = computed(() => {
  const search = q.value.trim().toLowerCase()
  return members.value.filter(member => member.name.toLowerCase().includes(search) || member.email.toLowerCase().includes(search))
})

async function saveApp(body: Record<string, unknown>, title: string) {
  try {
    await $fetch('/api/settings/app', { method: 'PUT', body })
    await refreshSettings()
    toast.add({ title, color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    await refreshSettings()
    toast.add({ title: 'Nicht gespeichert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  }
}

async function setRole(member: TeamMember, roleId: string) {
  try {
    await $fetch(`/api/users/${member.id}`, { method: 'PATCH', body: { roleId } })
    await refresh()
    if (member.id === me.value?.id) await refreshMe()
    const name = roleItems.value.find(role => role.value === roleId)?.label
    toast.add({ title: `${member.name} hat jetzt die Rolle ${name}`, color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    await refresh()
    toast.add({ title: 'Rolle nicht geändert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  }
}

const toRemove = ref<TeamMember | null>(null)
const removing = ref(false)
async function remove() {
  if (!toRemove.value) return
  removing.value = true
  try {
    await $fetch(`/api/users/${toRemove.value.id}`, { method: 'DELETE' })
    toast.add({ title: `${toRemove.value.name} entfernt`, color: 'success', icon: 'i-lucide-check' })
    toRemove.value = null
    await refresh()
  } catch (err) {
    toast.add({ title: 'Nicht entfernt', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    removing.value = false
  }
}

const menuFor = (member: TeamMember): DropdownMenuItem[] => [{
  label: 'Konto entfernen',
  icon: 'i-lucide-user-minus',
  color: 'error',
  disabled: member.id === me.value?.id,
  onSelect: () => {
    toRemove.value = member
  }
}]
</script>

<template>
  <UPageCard title="Registrierung" description="Lege fest, ob sich neue Teammitglieder selbst ein Konto anlegen dürfen und welche Rolle sie bekommen." variant="subtle">
    <UFormField label="Selbstregistrierung" description="Zeigt auf der Anmeldeseite den Button „Registrieren“." class="flex max-sm:flex-col justify-between items-start gap-4">
      <USwitch
        :model-value="settings?.app.allowRegistration"
        :label="settings?.app.allowRegistration ? 'Erlaubt' : 'Gesperrt'"
        @update:model-value="saveApp({ allowRegistration: $event }, $event ? 'Registrierung erlaubt' : 'Registrierung gesperrt')"
      />
    </UFormField>
    <USeparator />
    <UFormField label="Rolle für neue Konten" description="Admin kann nicht automatisch vergeben werden." class="flex max-sm:flex-col justify-between items-start gap-4">
      <USelect
        :model-value="settings?.app.defaultRoleId"
        :items="defaultRoleItems"
        class="w-48"
        @update:model-value="saveApp({ defaultRoleId: $event }, 'Standardrolle gespeichert')"
      />
    </UFormField>
  </UPageCard>

  <div>
    <UPageCard
      title="Team"
      description="Alle Konten mit Zugang zum Portal."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        v-if="can('settings.roles')"
        to="/settings/roles"
        label="Rollen verwalten"
        icon="i-lucide-key-round"
        color="neutral"
        variant="outline"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }">
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Team durchsuchen"
          class="w-full"
        />
      </template>

      <ul role="list" class="divide-y divide-default">
        <li v-for="member in filtered" :key="member.id" class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6">
          <div class="flex items-center gap-3 min-w-0">
            <UAvatar :text="initials(member.name)" size="md" />
            <div class="text-sm min-w-0">
              <p class="text-highlighted font-medium truncate">
                {{ member.name }}
                <UBadge
                  v-if="member.id === me?.id"
                  label="Du"
                  size="sm"
                  variant="subtle"
                  class="ms-1"
                />
              </p>
              <p class="text-muted truncate">
                {{ member.email }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <USelect
              :model-value="member.roleId"
              :items="roleItems"
              color="neutral"
              class="w-36"
              :aria-label="`Rolle von ${member.name}`"
              @update:model-value="setRole(member, $event as string)"
            />
            <UDropdownMenu :items="menuFor(member)" :content="{ align: 'end' }">
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                :aria-label="`Aktionen für ${member.name}`"
              />
            </UDropdownMenu>
          </div>
        </li>
      </ul>
    </UPageCard>
  </div>

  <UModal
    :open="!!toRemove"
    title="Konto entfernen?"
    :description="`${toRemove?.name} (${toRemove?.email}) verliert sofort den Zugang zum Portal.`"
    @update:open="(value) => { if (!value) toRemove = null }"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          @click="toRemove = null"
        />
        <UButton
          label="Entfernen"
          color="error"
          :loading="removing"
          @click="remove"
        />
      </div>
    </template>
  </UModal>
</template>
