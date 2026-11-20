<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

useSeoMeta({ title: 'Sicherheit' })

const toast = useToast()
const { logout } = useAuth()

const schema = z.object({
  current: z.string().min(1, 'Bitte gib dein aktuelles Passwort ein.'),
  next: z.string().min(10, 'Mindestens 10 Zeichen.'),
  repeat: z.string()
}).refine(data => data.next === data.repeat, { message: 'Die Passwörter stimmen nicht überein.', path: ['repeat'] })
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ current: '', next: '', repeat: '' })
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await $fetch('/api/auth/password', { method: 'POST', body: { current: event.data.current, next: event.data.next } })
    Object.assign(state, { current: '', next: '', repeat: '' })
    toast.add({ title: 'Passwort geändert', icon: 'i-lucide-check', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Passwort nicht geändert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UPageCard title="Passwort" description="Gib dein aktuelles Passwort ein, um ein neues festzulegen." variant="subtle">
    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4 max-w-xs"
      @submit="onSubmit"
    >
      <UFormField name="current">
        <UInput
          v-model="state.current"
          type="password"
          placeholder="Aktuelles Passwort"
          autocomplete="current-password"
          class="w-full"
        />
      </UFormField>
      <UFormField name="next">
        <UInput
          v-model="state.next"
          type="password"
          placeholder="Neues Passwort"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UFormField name="repeat">
        <UInput
          v-model="state.repeat"
          type="password"
          placeholder="Neues Passwort wiederholen"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UButton
        label="Passwort ändern"
        type="submit"
        :loading="loading"
        class="w-fit"
      />
    </UForm>
  </UPageCard>

  <UPageCard
    title="Sitzung"
    description="Meldet dich auf diesem Gerät ab."
    variant="subtle"
    orientation="horizontal"
  >
    <UButton
      label="Abmelden"
      icon="i-lucide-log-out"
      color="error"
      variant="subtle"
      class="w-fit lg:ms-auto"
      @click="logout()"
    />
  </UPageCard>
</template>
