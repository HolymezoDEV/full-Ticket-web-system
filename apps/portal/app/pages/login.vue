<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Anmelden · MezoHelpdesk' })

const route = useRoute()
const { login, registrationOpen, hasUsers } = useAuth()
const form = reactive({ email: '', password: '' })
const error = shallowRef('')
const pending = shallowRef(false)

async function submit() {
  error.value = ''
  pending.value = true
  try {
    await login(form.email, form.password)
    await navigateTo(safeRedirect(route.query.redirect), { replace: true })
  } catch (err) {
    error.value = errorMessage(err, 'Die Anmeldung ist fehlgeschlagen.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <h1>Anmelden</h1>
    <p class="auth-lead">Melde dich mit deinem Team-Konto an.</p>
    <p v-if="!hasUsers" class="auth-hint"><Icon name="lucide:info" />Es gibt noch kein Konto. Das erste registrierte Konto wird Administrator.</p>
    <form class="staff-ticket-form auth-form" @submit.prevent="submit">
      <label for="login-email">E-Mail-Adresse<input id="login-email" v-model="form.email" type="email" autocomplete="username" required></label>
      <label for="login-password">Passwort<input id="login-password" v-model="form.password" type="password" autocomplete="current-password" required></label>
      <p v-if="error" class="form-error" role="alert"><Icon name="lucide:circle-alert" />{{ error }}</p>
      <button class="primary-button auth-submit" type="submit" :disabled="pending"><Icon name="lucide:log-in" />{{ pending ? 'Wird angemeldet …' : 'Anmelden' }}</button>
    </form>
    <div v-if="registrationOpen" class="auth-switch">
      <span>Noch kein Konto?</span>
      <NuxtLink class="secondary-button" :to="{ path: '/register', query: route.query }"><Icon name="lucide:user-plus" />Registrieren</NuxtLink>
    </div>
  </div>
</template>
