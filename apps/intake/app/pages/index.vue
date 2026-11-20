<script setup lang="ts">
const form = reactive({ name: '', email: '', category: '', subject: '', message: '', website: '' })
const busy = shallowRef(false)
const error = shallowRef('')
const result = shallowRef<{ ticketId: string; emailSent: boolean; ticketUrl?: string; spam?: boolean }>()
useHead({ htmlAttrs: { lang: 'de' }, title: 'Support kontaktieren — Holymezo MezoHelpdesk' })

async function submit() {
  error.value = ''
  busy.value = true
  try {
    result.value = await $fetch('/api/tickets', { method: 'POST', body: { ...form } })
  } catch (cause: unknown) {
    const failure = cause as { data?: { statusMessage?: string }; statusMessage?: string }
    error.value = failure.data?.statusMessage || failure.statusMessage || 'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="site-shell">
    <header class="site-header"><a class="brand" href="/"><span class="brand-mark">H</span><span>Holymezo <b>MezoHelpdesk</b></span></a><a class="contact-link" href="mailto:support@holymezo.com">Support kontaktieren ↗</a></header>
    <main v-if="!result" class="main-content">
      <section class="intro"><span class="eyebrow">HOLYMEZO SUPPORT</span><h1>Wie können<br>wir helfen?</h1><p class="intro-copy">Beschreibe dein Anliegen. Deine Anfrage wird direkt an unser Support-Team übermittelt.</p><div class="promise"><span class="promise-icon">↗</span><span><strong>Persönliche Antwort</strong><small>Wir melden uns per E-Mail.</small></span></div></section>
      <section class="form-panel" aria-labelledby="form-title"><div class="form-heading"><div><span class="step-label">NEUE ANFRAGE</span><h2 id="form-title">Ticket erstellen</h2></div><span class="required-note"><i>*</i> Pflichtfeld</span></div>
        <form class="request-form" @submit.prevent="submit">
          <div class="field-grid"><label class="field"><span>Dein Name <i>*</i></span><input v-model="form.name" autocomplete="name" maxlength="120" required></label><label class="field"><span>E-Mail-Adresse <i>*</i></span><input v-model="form.email" autocomplete="email" type="email" maxlength="254" required></label></div>
          <label class="field"><span>Thema <i>*</i></span><select v-model="form.category" required><option value="" disabled>Wähle ein Thema aus</option><option>Abrechnung</option><option>Konto &amp; Team</option><option>Produktfrage</option><option>Technischer Fehler</option><option>Sonstiges</option></select></label>
          <label class="field"><span>Betreff <i>*</i></span><input v-model="form.subject" maxlength="180" required></label>
          <label class="field"><span>Deine Nachricht <i>*</i></span><textarea v-model="form.message" maxlength="10000" rows="5" required/><small>Bitte sende uns keine Passwörter oder Zahlungsdaten.</small></label>
          <label class="honeypot" aria-hidden="true">Website<input v-model="form.website" tabindex="-1" autocomplete="off"></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <div class="form-bottom"><span class="privacy-note">Deine Daten werden zur Bearbeitung der Anfrage verwendet.</span><button class="submit-button" type="submit" :disabled="busy"><span>{{ busy ? 'Wird gesendet …' : 'Anfrage senden' }}</span><span aria-hidden="true">→</span></button></div>
        </form>
      </section>
    </main>
    <main v-else class="submitted-wrap"><span class="submitted-icon">✓</span><span class="step-label">{{ result.spam ? 'ANFRAGE ERHALTEN' : 'ANFRAGE ÜBERMITTELT' }}</span><h1>Danke, {{ form.name.split(' ')[0] }}.</h1><p v-if="result.spam">Deine Anfrage wurde erhalten.</p><p v-else>Dein Ticket wurde gespeichert. <template v-if="result.emailSent">Eine Bestätigung mit deinem persönlichen Link zum Ticket wurde an <strong>{{ form.email }}</strong> gesendet.</template><template v-else>Eine E-Mail konnte noch nicht zugestellt werden. Nutze den persönlichen Link, um den Verlauf aufzurufen und Nachrichten hinzuzufügen.</template></p><div v-if="!result.spam" class="submitted-ticket"><span>Ticketnummer</span><strong>{{ result.ticketId }}</strong></div><a v-if="result.ticketUrl && !result.spam" class="primary-button" :href="result.ticketUrl">Ticket öffnen und Nachricht hinzufügen</a><a class="submitted-home" href="/">Weitere Anfrage senden</a></main>
    <footer class="site-footer"><span>© {{ new Date().getFullYear() }} Holymezo</span><span>Holymezo MezoHelpdesk</span><a href="mailto:support@holymezo.com">support@holymezo.com</a></footer>
  </div>
</template>
