<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

useSeoMeta({ title: 'Support kontaktieren' })

// Topics are managed in the portal (Einstellungen → Themen).
const { data: categories } = await useFetch<string[]>('/api/topics', { default: () => [] })

const schema = z.object({
  name: z.string().trim().min(2, 'Bitte gib deinen Namen ein.').max(120),
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein.').max(254),
  category: z.string().min(1, 'Bitte wähle ein Thema aus.'),
  subject: z.string().trim().min(3, 'Mindestens 3 Zeichen.').max(180),
  message: z.string().trim().min(10, 'Mindestens 10 Zeichen.').max(10000),
  website: z.string().optional()
})
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ name: '', email: '', category: '', subject: '', message: '', website: '' })
const loading = ref(false)
const error = ref('')
const result = ref<{ ticketId: string, emailSent: boolean, ticketUrl?: string, spam?: boolean }>()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  error.value = ''
  loading.value = true
  try {
    result.value = await $fetch('/api/tickets', { method: 'POST', body: event.data })
  } catch (err) {
    error.value = errorMessage(err, 'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.')
  } finally {
    loading.value = false
  }
}

function reset() {
  Object.assign(state, { name: '', email: '', category: '', subject: '', message: '', website: '' })
  result.value = undefined
}

const promises = [
  { icon: 'i-lucide-user-round-check', title: 'Persönliche Antwort', description: 'Ein Mensch aus unserem Team meldet sich per E-Mail.' },
  { icon: 'i-lucide-link', title: 'Eigener Ticket-Link', description: 'Verfolge den Verlauf und schreibe jederzeit weitere Nachrichten.' },
  { icon: 'i-lucide-shield-check', title: 'Sicher übertragen', description: 'Dein Link ist nur für dich bestimmt.' }
]
</script>

<template>
  <UContainer class="py-10 sm:py-16">
    <div v-if="!result" class="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
      <div class="lg:pt-6">
        <UBadge label="Holymezo Support" variant="subtle" />
        <h1 class="mt-4 text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
          Wie können wir helfen?
        </h1>
        <p class="mt-4 text-lg text-muted">
          Beschreibe dein Anliegen. Deine Anfrage geht direkt an unser Support-Team.
        </p>
        <ul class="mt-8 flex flex-col gap-5">
          <li v-for="item in promises" :key="item.title" class="flex gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring ring-inset ring-primary/25">
              <UIcon :name="item.icon" class="size-4.5" />
            </span>
            <div>
              <p class="font-medium text-highlighted">
                {{ item.title }}
              </p>
              <p class="text-sm text-muted">
                {{ item.description }}
              </p>
            </div>
          </li>
        </ul>
      </div>

      <UPageCard variant="outline" class="bg-default" :ui="{ container: 'sm:p-8' }">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              Neue Anfrage
            </p>
            <h2 class="mt-1 text-xl font-semibold text-highlighted">
              Ticket erstellen
            </h2>
          </div>
          <span class="text-xs text-muted"><span class="text-error">*</span> Pflichtfeld</span>
        </div>

        <UForm
          :schema="schema"
          :state="state"
          class="mt-6 flex flex-col gap-5"
          @submit="onSubmit"
        >
          <div class="grid gap-5 sm:grid-cols-2">
            <UFormField label="Dein Name" name="name" required>
              <UInput
                v-model="state.name"
                autocomplete="name"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField label="E-Mail-Adresse" name="email" required>
              <UInput
                v-model="state.email"
                type="email"
                autocomplete="email"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Thema" name="category" required>
            <USelect
              v-model="state.category"
              :items="categories"
              placeholder="Wähle ein Thema aus"
              size="lg"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Betreff" name="subject" required>
            <UInput
              v-model="state.subject"
              size="lg"
              placeholder="Kurze Zusammenfassung"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Deine Nachricht"
            name="message"
            required
            help="Bitte sende uns keine Passwörter oder Zahlungsdaten."
          >
            <UTextarea
              v-model="state.message"
              :rows="6"
              autoresize
              size="lg"
              placeholder="Was ist passiert? Was hast du erwartet?"
              class="w-full"
            />
          </UFormField>

          <!-- Honeypot: hidden from people, filled by bots. -->
          <div class="absolute -left-[9999px] size-px overflow-hidden" aria-hidden="true">
            <label>Website<input v-model="state.website" tabindex="-1" autocomplete="off"></label>
          </div>

          <UAlert
            v-if="error"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :title="error"
          />

          <div class="flex flex-col-reverse gap-4 border-t border-default pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-muted">
              Deine Daten werden nur zur Bearbeitung der Anfrage verwendet.
            </p>
            <UButton
              type="submit"
              label="Anfrage senden"
              trailing-icon="i-lucide-arrow-right"
              size="lg"
              :loading="loading"
              class="justify-center"
            />
          </div>
        </UForm>
      </UPageCard>
    </div>

    <UPageCard
      v-else
      variant="outline"
      class="mx-auto max-w-lg bg-default text-center"
      :ui="{ container: 'sm:p-10 items-center' }"
    >
      <span class="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-success ring ring-inset ring-success/25">
        <UIcon name="i-lucide-check" class="size-7" />
      </span>
      <p class="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
        {{ result.spam ? 'Anfrage erhalten' : 'Anfrage übermittelt' }}
      </p>
      <h1 class="text-2xl font-semibold text-highlighted">
        Danke, {{ state.name.split(' ')[0] }}.
      </h1>
      <p v-if="result.spam" class="text-muted">
        Deine Anfrage wurde erhalten.
      </p>
      <p v-else class="text-muted">
        Dein Ticket wurde gespeichert.
        <template v-if="result.emailSent">
          Eine Bestätigung mit deinem persönlichen Link wurde an <strong class="text-highlighted">{{ state.email }}</strong> gesendet.
        </template>
        <template v-else>
          Eine E-Mail konnte noch nicht zugestellt werden. Nutze den persönlichen Link unten, um den Verlauf aufzurufen und Nachrichten hinzuzufügen.
        </template>
      </p>
      <div v-if="!result.spam" class="mt-2 w-full rounded-lg border border-default bg-elevated/50 px-4 py-3">
        <p class="text-xs text-muted">
          Ticketnummer
        </p>
        <p class="font-mono text-lg font-semibold text-highlighted">
          {{ result.ticketId }}
        </p>
      </div>
      <div class="mt-2 flex w-full flex-col gap-2">
        <UButton
          v-if="result.ticketUrl && !result.spam"
          :to="result.ticketUrl"
          label="Ticket öffnen und Nachricht hinzufügen"
          icon="i-lucide-external-link"
          size="lg"
          block
        />
        <UButton
          label="Weitere Anfrage senden"
          color="neutral"
          variant="ghost"
          block
          @click="reset"
        />
      </div>
    </UPageCard>
  </UContainer>
</template>
