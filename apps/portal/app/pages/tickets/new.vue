<script setup lang="ts">
const router = useRouter()
const { createTicket } = await useTickets()
const form = reactive({ name: '', email: '', category: '', subject: '', message: '' })
const error = shallowRef('')

async function submitTicket() {
  error.value = ''
  if (!form.name.trim() || !form.email.trim() || !form.category || !form.subject.trim() || !form.message.trim()) {
    error.value = 'Bitte fülle alle Pflichtfelder aus.'
    return
  }
  try {
    const id = await createTicket({ ...form })
    await router.push(`/tickets/${id}`)
  } catch {
    error.value = 'Das Ticket konnte nicht gespeichert werden.'
  }
}
</script>

<template>
  <section class="new-ticket-page">
    <NuxtLink to="/" class="back-link"><Icon name="lucide:arrow-left" /> Zurück zum Posteingang</NuxtLink>
    <div class="new-ticket-card">
      <div class="new-ticket-heading"><span class="new-ticket-icon"><Icon name="lucide:ticket-plus" /></span><div><h1>Ticket erstellen</h1><p>Erfasse eine Anfrage für dein Support-Team.</p></div></div>
      <form class="staff-ticket-form" @submit.prevent="submitTicket">
        <div class="form-row"><label for="customer-name">Name der anfragenden Person <span>*</span><input id="customer-name" v-model="form.name" required placeholder="Name"></label><label for="customer-email">E-Mail-Adresse <span>*</span><input id="customer-email" v-model="form.email" type="email" required></label></div>
        <label for="ticket-category">Kategorie <span>*</span><select id="ticket-category" v-model="form.category" required><option value="" disabled>Kategorie auswählen</option><option>Abrechnung</option><option>Konto &amp; Team</option><option>Produktfrage</option><option>Technischer Fehler</option><option>Sonstiges</option></select></label>
        <label for="ticket-subject">Betreff <span>*</span><input id="ticket-subject" v-model="form.subject" required maxlength="180" placeholder="Kurze Zusammenfassung"></label>
        <label for="ticket-message">Nachricht <span>*</span><textarea id="ticket-message" v-model="form.message" required maxlength="10000" rows="5" placeholder="Beschreibung der Anfrage …" /></label>
        <p v-if="error" class="form-error" role="alert"><Icon name="lucide:circle-alert" />{{ error }}</p>
        <div class="new-ticket-actions"><NuxtLink to="/" class="cancel-link">Abbrechen</NuxtLink><button class="primary-button" type="submit"><Icon name="lucide:plus" /> Ticket anlegen</button></div>
      </form>
    </div>
  </section>
</template>
