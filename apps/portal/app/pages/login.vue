<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Anmelden' })

const route = useRoute()
const { login, registrationOpen, hasUsers } = useAuth()
const error = ref('')
const loading = ref(false)

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'E-Mail-Adresse',
  autocomplete: 'username',
  required: true
}, {
  name: 'password',
  type: 'password',
  label: 'Passwort',
  autocomplete: 'current-password',
  required: true
}]

const schema = z.object({
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z.string().min(1, 'Bitte gib dein Passwort ein.')
})

async function onSubmit(event: FormSubmitEvent<z.output<typeof schema>>) {
  error.value = ''
  loading.value = true
  try {
    await login(event.data.email, event.data.password)
    await navigateTo(safeRedirect(route.query.redirect), { replace: true })
  } catch (err) {
    error.value = errorMessage(err, 'Die Anmeldung ist fehlgeschlagen.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :loading="loading"
    :submit="{ label: 'Anmelden', block: true }"
    title="Anmelden"
    description="Melde dich mit deinem Team-Konto an."
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template v-if="!hasUsers" #description>
      Es gibt noch kein Konto. Das erste registrierte Konto wird Admin.
    </template>
    <template #validation>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :title="error"
      />
    </template>
    <template v-if="registrationOpen" #footer>
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-muted">Noch kein Konto?</span>
        <UButton
          :to="{ path: '/register', query: route.query }"
          label="Registrieren"
          icon="i-lucide-user-plus"
          color="neutral"
          variant="outline"
        />
      </div>
    </template>
  </UAuthForm>
</template>
