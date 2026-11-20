<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Registrieren · MezoHelpdesk' })

const route = useRoute()
const { register, registrationOpen, hasUsers } = useAuth()
const form = reactive({ name: '', email: '', password: '', passwordRepeat: '' })
const error = shallowRef('')
const pending = shallowRef(false)

async function submit() {
  error.value = ''
  if (form.password.length < 10) { error.value = 'Das Passwort muss mindestens 10 Zeichen lang sein.'; return }
  if (form.password !== form.passwordRepeat) { error.value = 'Die Passwörter stimmen nicht überein.'; return }
  pending.value = true
  try {
    await register({ name: form.name, email: form.email, password: form.password })
    await navigateTo(safeRedirect(route.query.redirect), { replace: true })
  } catch (err) {
    error.value = errorMessage(err, 'Die Registrierung ist fehlgeschlagen.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <h1>Konto erstellen</h1>
    <p class="auth-lead">{{ hasUsers ? 'Lege dein Team-Konto an.' : 'Lege das erste Konto an. Es erhält Administratorrechte.' }}</p>
    <template v-if="registrationOpen">
      <form class="staff-ticket-form auth-form" @submit.prevent="submit">
        <label for="register-name">Name<input id="register-name" v-model="form.name" autocomplete="name" required minlength="2" maxlength="120"></label>
        <label for="register-email">E-Mail-Adresse<input id="register-email" v-model="form.email" type="email" autocomplete="email" required></label>
        <label for="register-password">Passwort<input id="register-password" v-model="form.password" type="password" autocomplete="new-password" required minlength="10"><small class="field-hint">Mindestens 10 Zeichen.</small></label>
        <label for="register-password-repeat">Passwort wiederholen<input id="register-password-repeat" v-model="form.passwordRepeat" type="password" autocomplete="new-password" required></label>
        <p v-if="error" class="form-error" role="alert"><Icon name="lucide:circle-alert" />{{ error }}</p>
        <button class="primary-button auth-submit" type="submit" :disabled="pending"><Icon name="lucide:user-plus" />{{ pending ? 'Wird erstellt …' : 'Registrieren' }}</button>
      </form>
    </template>
    <p v-else class="auth-hint"><Icon name="lucide:lock" />Die Registrierung ist deaktiviert. Bitte wende dich an eine Administratorin oder einen Administrator.</p>
    <div v-if="hasUsers" class="auth-switch">
      <span>Schon ein Konto?</span>
      <NuxtLink class="secondary-button" :to="{ path: '/login', query: route.query }"><Icon name="lucide:log-in" />Anmelden</NuxtLink>
    </div>
  </div>
</template>
