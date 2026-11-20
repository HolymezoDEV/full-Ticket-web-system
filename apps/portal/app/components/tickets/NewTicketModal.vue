<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const { createTicket } = await useTickets()
const { active: topicNames } = await useTopics()

const schema = z.object({
  name: z.string().trim().min(2, 'Bitte gib einen Namen ein.').max(120),
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  category: z.string().min(1, 'Bitte wähle ein Thema.'),
  subject: z.string().trim().min(3, 'Mindestens 3 Zeichen.').max(180),
  message: z.string().trim().min(10, 'Mindestens 10 Zeichen.').max(10000)
})
type Schema = z.output<typeof schema>

const empty = () => ({ name: '', email: '', category: '', subject: '', message: '' })
const state = reactive<Schema>(empty())
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const result = await createTicket(event.data)
    toast.add({
      title: `Ticket ${result.ticketId} angelegt`,
      description: result.emailSent ? 'Die Bestätigung wurde per E-Mail verschickt.' : 'Es wurde keine Bestätigungsmail verschickt. Prüfe die Mailserver-Einstellungen.',
      color: result.emailSent ? 'success' : 'warning',
      icon: 'i-lucide-ticket-check'
    })
    Object.assign(state, empty())
    open.value = false
    await navigateTo({ path: '/tickets', query: { id: result.ticketId } })
  } catch (err) {
    toast.add({ title: 'Ticket nicht gespeichert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Neues Ticket"
    description="Erfasse eine Anfrage für dein Support-Team."
    :ui="{ content: 'sm:max-w-xl' }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" class="w-full" />
          </UFormField>
          <UFormField label="E-Mail-Adresse" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Thema" name="category" required>
          <USelect
            v-model="state.category"
            :items="topicNames"
            placeholder="Thema auswählen"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Betreff" name="subject" required>
          <UInput v-model="state.subject" placeholder="Kurze Zusammenfassung" class="w-full" />
        </UFormField>
        <UFormField label="Nachricht" name="message" required>
          <UTextarea
            v-model="state.message"
            :rows="5"
            autoresize
            placeholder="Beschreibung der Anfrage …"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="Ticket anlegen"
            icon="i-lucide-plus"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
