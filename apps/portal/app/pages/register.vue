<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Registrieren' })

const route = useRoute()
const { register, registrationOpen, hasUsers } = useAuth()
const error = ref('')
const loading = ref(false)

const fields: AuthFormField[] = [{
  name: 'name',
  type: 'text',
  label: 'Name',
  autocomplete: 'name',
  required: true
}, {
  name: 'email',
  type: 'email',
  label: 'E-Mail-Adresse',
  autocomplete: 'email',
  required: true
}, {
  name: 'password',
  type: 'password',
  label: 'Passwort',
  description: 'Mindestens 10 Zeichen.',
  autocomplete: 'new-password',
  required: true
}, {
  name: 'passwordRepeat',
  type: 'password',
  label: 'Passwort wiederholen',
  autocomplete: 'new-password',
  required: true
}]

const schema = z.object({
  name: z.string().trim().min(2, 'Bitte gib deinen Namen ein.').max(120),
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z.string().min(10, 'Mindestens 10 Zeichen.'),
  passwordRepeat: z.string()
}).refine(data => data.password === data.passwordRepeat, { message: 'Die Passwörter stimmen nicht überein.', path: ['passwordRepeat'] })

async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
  error.value = ''
  loading.value = true
  try {
    await register({ name: event.data.name, email: event.data.email, password: event.data.password })
    await navigateTo(safeRedirect(route.query.redirect), { replace: true })
  } catch (err) {
    error.value = errorMessage(err, 'Die Registrierung ist fehlgeschlagen.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UAuthForm
    v-if="registrationOpen"
    :fields="fields"
    :schema="schema"
    :loading="loading"
    :submit="{ label: 'Registrieren', block: true }"
    title="Konto erstellen"
    :description="hasUsers ? 'Lege dein Team-Konto an.' : 'Lege das erste Konto an. Es erhält Admin-Rechte.'"
    icon="i-lucide-user-plus"
    @submit="onSubmit"
  >
    <template #validation>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="error"
      />
    </template>
    <template v-if="hasUsers" #footer>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-muted">Schon ein Konto?</span>
        <UButton
          :to="{ path: '/login', query: route.query }"
          label="Anmelden"
          icon="i-lucide-log-in"
          color="neutral"
          variant="outline"
        />
      </div>
    </template>
  </UAuthForm>
  <div v-else class="flex flex-col gap-4 text-center">
    <UIcon name="i-lucide-lock" class="mx-auto size-8 text-muted" />
    <div>
      <h1 class="text-xl font-semibold text-highlighted">
        Registrierung deaktiviert
      </h1>
      <p class="mt-1 text-sm text-muted">
        Bitte wende dich an eine Administratorin oder einen Administrator.
      </p>
    </div>
    <UButton
      to="/login"
      label="Zur Anmeldung"
      icon="i-lucide-log-in"
      color="neutral"
      variant="outline"
      block
    />
  </div>
</template>
