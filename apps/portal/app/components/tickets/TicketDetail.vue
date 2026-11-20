<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{ ticket: Ticket }>()
const emit = defineEmits<{ close: [] }>()

const toast = useToast()
const { user, can } = useAuth()
const { updateStatus, addReply, assign, remove } = await useTickets()

const reply = ref('')
const notify = ref(false)
const sending = ref(false)
const updating = ref(false)
const assigning = ref(false)
const confirmDelete = ref(false)
const deleting = ref(false)
const thread = useTemplateRef('thread')
const { typing, notifyTyping } = useLive()
const sounds = useSounds()
const onReplyKeydown = sendOnEnter(() => onSubmit())
const typingNow = computed(() => typing.value[props.ticket.id])
const scrollToEnd = () => nextTick(() => thread.value?.scrollTo({ top: thread.value.scrollHeight, behavior: 'smooth' }))
watch(typingNow, (value) => {
  if (value) scrollToEnd()
})

watch(() => props.ticket.id, () => {
  reply.value = ''
  notify.value = false
})
watch(() => props.ticket.messages.length, () => nextTick(() => thread.value?.scrollTo({ top: thread.value.scrollHeight })), { immediate: true })

const isMine = computed(() => props.ticket.assigneeId === user.value?.id)

const mailToast = (sent: boolean | undefined, okText: string) => sent
  ? { description: okText, color: 'success' as const, icon: 'i-lucide-mail-check' }
  : { description: 'Die E-Mail konnte nicht versendet werden. Prüfe die Mailserver-Einstellungen.', color: 'warning' as const, icon: 'i-lucide-mail-warning' }

async function changeStatus(status: TicketStatus) {
  if (status === props.ticket.status) return
  updating.value = true
  try {
    const result = await updateStatus(props.ticket.id, status)
    toast.add(status === 'Gelöst'
      ? { title: 'Ticket abgeschlossen', ...mailToast(result.emailSent, `Abschlussmail mit Transkript an ${props.ticket.email} gesendet.`) }
      : { title: `Status: ${status}`, color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: 'Status nicht geändert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    updating.value = false
  }
}

async function takeOver() {
  assigning.value = true
  try {
    const firstTakeover = !props.ticket.assigneeId
    const result = await assign(props.ticket.id)
    toast.add(firstTakeover
      ? { title: 'Ticket übernommen', ...mailToast(result.emailSent, `${props.ticket.customer} wurde per E-Mail informiert.`) }
      : { title: 'Ticket übernommen', description: 'Es ist jetzt dir zugewiesen.', color: 'success', icon: 'i-lucide-user-check' })
  } catch (err) {
    toast.add({ title: 'Nicht übernommen', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    assigning.value = false
  }
}

async function onSubmit() {
  if (!reply.value.trim()) return
  sending.value = true
  try {
    const result = await addReply(props.ticket.id, reply.value, notify.value)
    sounds.play('send')
    reply.value = ''
    notify.value = false
    toast.add(result.notified
      ? { title: 'Antwort gesendet', ...mailToast(result.emailSent, `Per E-Mail an ${props.ticket.email} verschickt.`) }
      : { title: 'Antwort gespeichert', description: 'Sichtbar über den Ticket-Link, ohne E-Mail.', color: 'success', icon: 'i-lucide-check' })
  } catch (err) {
    toast.add({ title: 'Antwort nicht gespeichert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    sending.value = false
  }
}

async function onDelete() {
  deleting.value = true
  try {
    await remove(props.ticket.id)
    toast.add({ title: `Ticket ${props.ticket.id} gelöscht`, color: 'success', icon: 'i-lucide-trash-2' })
    confirmDelete.value = false
    emit('close')
  } catch (err) {
    toast.add({ title: 'Nicht gelöscht', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    deleting.value = false
  }
}

const statusItems = ticketStatuses.map(status => ({ label: status, value: status }))

const menuItems = computed<DropdownMenuItem[][]>(() => [[
  { label: 'Ticketnummer kopieren', icon: 'i-lucide-copy', onSelect: () => navigator.clipboard.writeText(props.ticket.id) },
  { label: 'E-Mail-Adresse kopieren', icon: 'i-lucide-at-sign', onSelect: () => navigator.clipboard.writeText(props.ticket.email) }
], ...(can('tickets.delete') ? [[{ label: 'Ticket löschen', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: () => { confirmDelete.value = true } }]] : [])])
</script>

<template>
  <UDashboardPanel id="ticket-detail">
    <UDashboardNavbar :title="ticket.subject" :toggle="false">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          aria-label="Schließen"
          @click="emit('close')"
        />
      </template>
      <template #right>
        <UButton
          v-if="can('tickets.assign') && !isMine && ticket.status !== 'Gelöst'"
          :label="ticket.assigneeId ? 'Zu mir holen' : 'Übernehmen'"
          icon="i-lucide-hand"
          size="sm"
          :loading="assigning"
          @click="takeOver"
        />
        <USelect
          v-if="can('tickets.status')"
          :model-value="ticket.status"
          :items="statusItems"
          :loading="updating"
          size="sm"
          class="w-44 max-sm:hidden"
          aria-label="Status ändern"
          @update:model-value="changeStatus($event as TicketStatus)"
        />
        <UTooltip v-if="can('tickets.status') && ticket.status !== 'Gelöst'" text="Abschließen und Transkript senden">
          <UButton
            icon="i-lucide-circle-check"
            color="neutral"
            variant="ghost"
            aria-label="Abschließen"
            :loading="updating"
            @click="changeStatus('Gelöst')"
          />
        </UTooltip>
        <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            aria-label="Weitere Aktionen"
          />
        </UDropdownMenu>
      </template>
    </UDashboardNavbar>

    <div class="flex flex-col sm:flex-row justify-between gap-3 p-4 sm:px-6 border-b border-default">
      <div class="flex items-start gap-4 sm:my-1.5">
        <UAvatar :text="initials(ticket.customer)" size="3xl" />
        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ ticket.customer }}
          </p>
          <ULink :to="`mailto:${ticket.email}`" class="text-muted">{{ ticket.email }}</ULink>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <UBadge
              :label="ticket.id"
              color="neutral"
              variant="outline"
              size="sm"
            />
            <UBadge
              :label="ticket.category"
              color="neutral"
              variant="subtle"
              size="sm"
            />
            <UBadge
              :label="ticket.status"
              :color="statusColor[ticket.status]"
              variant="subtle"
              size="sm"
            />
          </div>
        </div>
      </div>
      <div class="max-sm:pl-16 text-sm sm:mt-2 sm:text-right">
        <p class="text-muted">
          Erstellt {{ longDate(ticket.createdAt) }}
        </p>
        <p class="mt-1 flex items-center gap-1.5 sm:justify-end" :class="ticket.assigneeId ? 'text-toned' : 'text-dimmed'">
          <UIcon name="i-lucide-user-round" class="size-4" />
          {{ ticket.assigneeId ? (isMine ? 'Du bearbeitest dieses Ticket' : ticket.assignee) : 'Noch nicht übernommen' }}
        </p>
      </div>
    </div>

    <div ref="thread" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <div
        v-for="message in ticket.messages"
        :key="message.id"
        class="flex gap-3"
        :class="message.role === 'Team' && 'flex-row-reverse'"
      >
        <UAvatar :text="initials(message.author)" size="sm" />
        <div class="max-w-[85%] min-w-0">
          <div class="mb-1 flex items-center gap-2 text-xs text-muted" :class="message.role === 'Team' && 'justify-end'">
            <span class="font-medium text-toned">{{ message.author }}</span>
            <span>{{ longDate(message.createdAt) }}</span>
          </div>
          <div
            class="rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words"
            :class="message.role === 'Team' ? 'bg-primary/10 text-highlighted' : 'bg-elevated text-default'"
          >
            {{ message.text }}
          </div>
        </div>
      </div>
      <TypingIndicator v-if="typingNow" :name="typingNow.name" :align="typingNow.who === 'Team' ? 'end' : 'start'" />
    </div>

    <div v-if="can('tickets.reply')" class="pb-4 px-4 sm:px-6 shrink-0">
      <UCard variant="subtle" :ui="{ header: 'flex items-center gap-1.5 text-dimmed' }">
        <template #header>
          <UIcon name="i-lucide-reply" class="size-5" />
          <span class="text-sm truncate">Antwort an {{ ticket.customer }}</span>
        </template>
        <form @submit.prevent="onSubmit">
          <UTextarea
            v-model="reply"
            color="neutral"
            variant="none"
            required
            autoresize
            placeholder="Antwort schreiben … (Enter sendet, Shift + Enter für neue Zeile)"
            :rows="4"
            :maxrows="12"
            :disabled="sending"
            class="w-full"
            :ui="{ base: 'p-0 resize-none' }"
            @input="notifyTyping(ticket.id)"
            @keydown="onReplyKeydown"
          />
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <UCheckbox
              v-model="notify"
              label="Kund:in per E-Mail benachrichtigen"
              :description="notify ? `Geht an ${ticket.email}` : 'Sonst nur über den Ticket-Link sichtbar'"
            />
            <UButton
              type="submit"
              :loading="sending"
              :disabled="!reply.trim()"
              :label="notify ? 'Senden' : 'Speichern'"
              :icon="notify ? 'i-lucide-send' : 'i-lucide-message-square-plus'"
              class="ms-auto"
            />
          </div>
        </form>
      </UCard>
    </div>
  </UDashboardPanel>

  <UModal
    v-model:open="confirmDelete"
    title="Ticket löschen?"
    :description="`${ticket.id} · ${ticket.subject} wird mit dem gesamten Verlauf endgültig entfernt. Das lässt sich nicht rückgängig machen.`"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Abbrechen"
          color="neutral"
          variant="ghost"
          @click="confirmDelete = false"
        />
        <UButton
          label="Endgültig löschen"
          color="error"
          icon="i-lucide-trash-2"
          :loading="deleting"
          @click="onDelete"
        />
      </div>
    </template>
  </UModal>
</template>
