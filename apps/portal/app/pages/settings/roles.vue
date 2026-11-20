<script setup lang="ts">
useSeoMeta({ title: 'Rollen' })

type PermissionInfo = { id: Permission, group: string, label: string, description: string }
type Role = { id: string, name: string, description: string, permissions: Permission[], system?: boolean, members: number }

const toast = useToast()
const { refresh: refreshMe } = useAuth()
const { data, refresh } = await useFetch<{ roles: Role[], permissions: PermissionInfo[] }>('/api/roles', { key: 'roles' })

const roles = computed(() => data.value?.roles ?? [])
const groups = computed(() => {
  const map = new Map<string, PermissionInfo[]>()
  for (const permission of data.value?.permissions ?? []) map.set(permission.group, [...(map.get(permission.group) ?? []), permission])
  return [...map.entries()]
})

// Editor (create + edit share one modal)
const editorOpen = ref(false)
const editing = ref<Role | null>(null)
const form = reactive({ name: '', description: '', permissions: [] as Permission[] })
const saving = ref(false)
const isAdminRole = computed(() => editing.value?.id === 'admin')

function openEditor(role?: Role) {
  editing.value = role ?? null
  Object.assign(form, { name: role?.name ?? '', description: role?.description ?? '', permissions: [...(role?.permissions ?? ['tickets.view'])] })
  editorOpen.value = true
}

function toggle(permission: Permission, value: boolean | 'indeterminate') {
  form.permissions = value === true ? [...new Set([...form.permissions, permission])] : form.permissions.filter(item => item !== permission)
}
function toggleGroup(items: PermissionInfo[], value: boolean | 'indeterminate') {
  const ids = items.map(item => item.id)
  form.permissions = value === true ? [...new Set([...form.permissions, ...ids])] : form.permissions.filter(item => !ids.includes(item))
}
const groupState = (items: PermissionInfo[]) => {
  const count = items.filter(item => form.permissions.includes(item.id)).length
  return count === 0 ? false : count === items.length ? true : 'indeterminate'
}

async function save() {
  saving.value = true
  try {
    const body = { name: form.name, description: form.description, permissions: form.permissions }
    if (editing.value) await $fetch(`/api/roles/${editing.value.id}`, { method: 'PATCH', body })
    else await $fetch('/api/roles', { method: 'POST', body })
    await Promise.all([refresh(), refreshMe()])
    editorOpen.value = false
    toast.add({ title: editing.value ? 'Rolle gespeichert' : 'Rolle angelegt', description: form.name, color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: 'Nicht gespeichert', description: errorMessage(err, 'Bitte prüfe deine Eingaben.'), color: 'error' })
  } finally {
    saving.value = false
  }
}

const toDelete = ref<Role | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/roles/${toDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: `Rolle ${toDelete.value.name} gelöscht`, color: 'success', icon: 'i-lucide-check' })
    toDelete.value = null
    await refresh()
  } catch (err) {
    toast.add({ title: 'Nicht gelöscht', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    deleting.value = false
  }
}

const permissionLabel = (id: Permission) => data.value?.permissions.find(item => item.id === id)?.label ?? id
</script>

<template>
  <div>
    <UPageCard
      title="Rollen"
      description="Lege fest, wer im Portal was darf. Jedes Konto hat genau eine Rolle."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Neue Rolle"
        icon="i-lucide-plus"
        class="w-fit lg:ms-auto"
        @click="openEditor()"
      />
    </UPageCard>

    <div class="flex flex-col gap-4">
      <UPageCard v-for="role in roles" :key="role.id" variant="subtle">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-highlighted">
                {{ role.name }}
              </p>
              <UBadge
                v-if="role.system"
                label="Fest"
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-lock"
              />
              <UBadge
                :label="`${role.members} ${role.members === 1 ? 'Konto' : 'Konten'}`"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
            <p v-if="role.description" class="mt-1 text-sm text-muted">
              {{ role.description }}
            </p>
          </div>
          <div class="flex gap-1">
            <UButton
              label="Bearbeiten"
              icon="i-lucide-pencil"
              color="neutral"
              variant="outline"
              size="sm"
              @click="openEditor(role)"
            />
            <UTooltip v-if="!role.system" :text="role.members ? 'Noch Konten zugewiesen' : 'Rolle löschen'">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                :disabled="role.members > 0"
                :aria-label="`Rolle ${role.name} löschen`"
                @click="toDelete = role"
              />
            </UTooltip>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <UBadge
            v-for="permission in role.permissions"
            :key="permission"
            :label="permissionLabel(permission)"
            color="primary"
            variant="soft"
            size="sm"
          />
          <span v-if="!role.permissions.length" class="text-sm text-dimmed">Keine Berechtigungen</span>
        </div>
      </UPageCard>
    </div>
  </div>

  <UModal v-model:open="editorOpen" :title="editing ? `Rolle bearbeiten: ${editing.name}` : 'Neue Rolle'" :ui="{ content: 'sm:max-w-xl' }">
    <template #body>
      <form id="role-form" class="flex flex-col gap-5" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Name" required>
            <UInput v-model="form.name" placeholder="z. B. Teamleitung" class="w-full" />
          </UFormField>
          <UFormField label="Beschreibung">
            <UInput v-model="form.description" placeholder="Wofür ist die Rolle?" class="w-full" />
          </UFormField>
        </div>

        <UAlert
          v-if="isAdminRole"
          color="info"
          variant="subtle"
          icon="i-lucide-lock"
          title="Admin hat immer alle Berechtigungen."
          description="So kann sich niemand aus dem Portal aussperren. Name und Beschreibung kannst du ändern."
        />

        <div v-for="[group, items] in groups" :key="group" class="rounded-lg border border-default">
          <div class="flex items-center justify-between gap-3 border-b border-default bg-elevated/50 px-4 py-2.5">
            <p class="text-sm font-semibold text-highlighted">
              {{ group }}
            </p>
            <UCheckbox
              :model-value="groupState(items)"
              :disabled="isAdminRole"
              label="Alle"
              @update:model-value="toggleGroup(items, $event)"
            />
          </div>
          <div class="divide-y divide-default">
            <div v-for="permission in items" :key="permission.id" class="px-4 py-3">
              <UCheckbox
                :model-value="isAdminRole || form.permissions.includes(permission.id)"
                :disabled="isAdminRole"
                :label="permission.label"
                :description="permission.description"
                @update:model-value="toggle(permission.id, $event)"
              />
            </div>
          </div>
        </div>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <span class="text-sm text-muted">{{ isAdminRole ? 'Alle' : form.permissions.length }} Berechtigungen ausgewählt</span>
        <div class="flex gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="ghost"
            @click="editorOpen = false"
          />
          <UButton
            form="role-form"
            type="submit"
            :label="editing ? 'Speichern' : 'Rolle anlegen'"
            :loading="saving"
          />
        </div>
      </div>
    </template>
  </UModal>

  <UModal
    :open="!!toDelete"
    title="Rolle löschen?"
    :description="`Die Rolle ${toDelete?.name} wird entfernt.`"
    @update:open="(value) => { if (!value) toDelete = null }"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          @click="toDelete = null"
        />
        <UButton
          label="Löschen"
          color="error"
          :loading="deleting"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
