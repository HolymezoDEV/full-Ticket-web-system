<script setup lang="ts">
useSeoMeta({ title: 'Themen' })

const toast = useToast()
const { topics, refresh } = await useTopics()

const editorOpen = ref(false)
const editing = ref<Topic | null>(null)
const form = reactive({ name: '', description: '', active: true })
const saving = ref(false)

function openEditor(topic?: Topic) {
  editing.value = topic ?? null
  Object.assign(form, { name: topic?.name ?? '', description: topic?.description ?? '', active: topic?.active ?? true })
  editorOpen.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) await $fetch(`/api/topics/${editing.value.id}`, { method: 'PATCH', body: form })
    else await $fetch('/api/topics', { method: 'POST', body: form })
    await refresh()
    editorOpen.value = false
    toast.add({ title: editing.value ? 'Thema gespeichert' : 'Thema angelegt', description: form.name, color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: 'Nicht gespeichert', description: errorMessage(err, 'Bitte prüfe deine Eingaben.'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function setActive(topic: Topic, active: boolean) {
  try {
    await $fetch(`/api/topics/${topic.id}`, { method: 'PATCH', body: { ...topic, active } })
    await refresh()
  } catch (err) {
    await refresh()
    toast.add({ title: 'Nicht geändert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  }
}

const toDelete = ref<Topic | null>(null)
const deleting = ref(false)
async function confirmDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/topics/${toDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: `Thema ${toDelete.value.name} gelöscht`, color: 'success', icon: 'i-lucide-check' })
    toDelete.value = null
    await refresh()
  } catch (err) {
    toast.add({ title: 'Nicht gelöscht', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <UPageCard
      title="Themen"
      description="Diese Themen wählen Kund:innen im Kontaktformular aus. Ausgeblendete Themen bleiben an bestehenden Tickets erhalten."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Neues Thema"
        icon="i-lucide-plus"
        class="w-fit lg:ms-auto"
        @click="openEditor()"
      />
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch' }">
      <ul role="list" class="divide-y divide-default">
        <li v-for="topic in topics" :key="topic.id" class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring ring-inset ring-primary/25">
              <UIcon name="i-lucide-tag" class="size-4" />
            </span>
            <div class="min-w-0 text-sm">
              <p class="truncate font-medium" :class="topic.active ? 'text-highlighted' : 'text-dimmed line-through'">
                {{ topic.name }}
              </p>
              <p class="truncate text-muted">
                {{ topic.description || (topic.active ? 'Im Formular sichtbar' : 'Im Formular ausgeblendet') }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <USwitch :model-value="topic.active" :aria-label="`${topic.name} im Formular anzeigen`" @update:model-value="setActive(topic, $event)" />
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              :aria-label="`${topic.name} bearbeiten`"
              @click="openEditor(topic)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :aria-label="`${topic.name} löschen`"
              @click="toDelete = topic"
            />
          </div>
        </li>
      </ul>
    </UPageCard>
  </div>

  <UModal v-model:open="editorOpen" :title="editing ? 'Thema bearbeiten' : 'Neues Thema'">
    <template #body>
      <form id="topic-form" class="flex flex-col gap-4" @submit.prevent="save">
        <UFormField label="Name" required>
          <UInput v-model="form.name" placeholder="z. B. Lieferung & Versand" class="w-full" />
        </UFormField>
        <UFormField label="Beschreibung" help="Nur intern sichtbar.">
          <UInput v-model="form.description" class="w-full" />
        </UFormField>
        <USwitch v-model="form.active" label="Im Kontaktformular anzeigen" />
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          @click="editorOpen = false"
        />
        <UButton
          form="topic-form"
          type="submit"
          :label="editing ? 'Speichern' : 'Thema anlegen'"
          :loading="saving"
        />
      </div>
    </template>
  </UModal>

  <UModal
    :open="!!toDelete"
    title="Thema löschen?"
    :description="`${toDelete?.name} verschwindet aus dem Formular. Bestehende Tickets behalten das Thema.`"
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
