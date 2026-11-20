<script setup lang="ts">
type PublicTicket = {
  id: string
  subject: string
  status: string
  messages: { id: string, author: string, role: 'Team' | 'Kunde', text: string, createdAt: string }[]
}

useSeoMeta({ title: 'Ticketverlauf', referrer: 'no-referrer' })

const route = useRoute()
const toast = useToast()
const id = computed(() => String(route.params.id))
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')

const { data: ticket, error: loadError, refresh } = await useAsyncData(
  () => `public-ticket-${id.value}`,
  () => $fetch<PublicTicket>(`/api/tickets/${encodeURIComponent(id.value)}`, { query: { token: token.value } }),
  { watch: [token] }
)

const date = (value: string) => new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('') || '?'
const statusColor = (status: string) => ({ 'Offen': 'info', 'In Bearbeitung': 'warning', 'Wartet auf Kunde': 'neutral', 'Gelöst': 'success' } as const)[status] ?? 'neutral'

// Live updates: new replies and status changes appear without reloading.
const supportTyping = ref(false)
const sounds = useSounds()
const onKeydown = sendOnEnter(() => send())
let typingTimer: ReturnType<typeof setTimeout> | undefined
let source: EventSource | undefined

onMounted(() => {
  if (!token.value) return
  source = new EventSource(`/api/tickets/${encodeURIComponent(id.value)}/live?token=${encodeURIComponent(token.value)}`)
  source.addEventListener('ticket', (event) => {
    const data = JSON.parse((event as MessageEvent).data) as { action: string, by?: string }
    if (data.action === 'message') supportTyping.value = false
    if (data.action === 'message' && data.by === 'Team') sounds.play('message')
    refresh()
  })
  source.addEventListener('typing', () => {
    supportTyping.value = true
    clearTimeout(typingTimer)
    typingTimer = setTimeout(() => {
      supportTyping.value = false
    }, 4500)
  })
})
onBeforeUnmount(() => {
  source?.close()
  clearTimeout(typingTimer)
})

let lastTypingPing = 0
function onTyping() {
  if (Date.now() - lastTypingPing < 2500) return
  lastTypingPing = Date.now()
  $fetch(`/api/tickets/${encodeURIComponent(id.value)}/typing`, { method: 'POST', body: { token: token.value } }).catch(() => {})
}

const text = ref('')
const sending = ref(false)

async function send() {
  if (!text.value.trim()) return
  sending.value = true
  try {
    await $fetch(`/api/tickets/${encodeURIComponent(id.value)}/messages`, { method: 'POST', body: { token: token.value, text: text.value } })
    text.value = ''
    sounds.play('send')
    await refresh()
  } catch (err) {
    toast.add({ title: 'Nicht gesendet', description: errorMessage(err, 'Die Nachricht konnte nicht hinzugefügt werden.'), color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 sm:py-14">
    <div class="mx-auto max-w-3xl">
      <UButton
        to="/"
        label="Neue Anfrage"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        class="-ms-2.5 mb-4"
      />

      <UPageCard
        v-if="ticket"
        variant="outline"
        class="bg-default"
        :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch' }"
      >
        <div class="border-b border-default p-5 sm:p-6">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              :label="ticket.id"
              color="neutral"
              variant="outline"
              class="font-mono"
            />
            <UBadge :label="ticket.status" :color="statusColor(ticket.status)" variant="subtle" />
            <ClientOnly>
              <UTooltip :text="sounds.enabled.value ? 'Töne ausschalten' : 'Töne einschalten'">
                <UButton
                  :icon="sounds.enabled.value ? 'i-lucide-volume-2' : 'i-lucide-volume-x'"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="ms-auto"
                  :aria-label="sounds.enabled.value ? 'Töne ausschalten' : 'Töne einschalten'"
                  :aria-pressed="sounds.enabled.value"
                  @click="sounds.toggle()"
                />
              </UTooltip>
            </ClientOnly>
          </div>
          <h1 class="mt-3 text-2xl font-semibold text-highlighted">
            {{ ticket.subject }}
          </h1>
        </div>

        <div class="flex flex-col gap-5 p-5 sm:p-6">
          <div
            v-for="message in ticket.messages"
            :key="message.id"
            class="flex gap-3"
            :class="message.role === 'Kunde' && 'flex-row-reverse'"
          >
            <UAvatar :text="message.role === 'Team' ? 'H' : initials(message.author)" size="sm" />
            <div class="min-w-0 max-w-[85%]">
              <div class="mb-1 flex items-center gap-2 text-xs text-muted" :class="message.role === 'Kunde' && 'justify-end'">
                <span class="font-medium text-toned">{{ message.role === 'Team' ? `${message.author} · Support` : 'Du' }}</span>
                <span>{{ date(message.createdAt) }}</span>
              </div>
              <div
                class="whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm"
                :class="message.role === 'Kunde' ? 'bg-primary/10 text-highlighted' : 'bg-elevated text-default'"
              >
                {{ message.text }}
              </div>
            </div>
          </div>
          <div
            v-if="supportTyping"
            class="flex items-end gap-3"
            role="status"
            aria-label="Der Support schreibt gerade"
          >
            <UAvatar text="H" size="sm" />
            <div>
              <p class="mb-1 text-xs text-muted">
                Holymezo Support schreibt …
              </p>
              <div class="inline-flex items-center gap-1 rounded-lg bg-elevated px-3.5 py-3">
                <span
                  v-for="index in 3"
                  :key="index"
                  class="size-1.5 rounded-full bg-(--ui-text-muted) motion-safe:animate-bounce"
                  :style="{ animationDelay: `${(index - 1) * 150}ms` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-default p-5 sm:p-6">
          <form class="flex flex-col gap-3" @submit.prevent="send">
            <UFormField label="Nachricht hinzufügen" name="follow-up" help="Enter zum Senden, Shift + Enter für eine neue Zeile.">
              <UTextarea
                v-model="text"
                :rows="4"
                autoresize
                :maxlength="10000"
                placeholder="Schreibe eine Nachricht an das Support-Team …"
                class="w-full"
                @input="onTyping"
                @keydown="onKeydown"
              />
            </UFormField>
            <UButton
              type="submit"
              label="Nachricht senden"
              icon="i-lucide-send"
              :loading="sending"
              :disabled="!text.trim()"
              class="self-end"
            />
          </form>
        </div>
      </UPageCard>

      <UPageCard
        v-else
        variant="outline"
        class="bg-default text-center"
        :ui="{ container: 'sm:p-10 items-center' }"
      >
        <UIcon name="i-lucide-link-2-off" class="mx-auto size-10 text-muted" />
        <h1 class="text-xl font-semibold text-highlighted">
          Ticket nicht verfügbar
        </h1>
        <p class="text-muted">
          {{ loadError ? 'Der Link ist ungültig oder abgelaufen. Öffne den persönlichen Link aus deiner Ticket-E-Mail.' : 'Ticket wird geladen …' }}
        </p>
        <UButton
          to="/"
          label="Zur Supportseite"
          color="neutral"
          variant="outline"
          class="mx-auto mt-2"
        />
      </UPageCard>
    </div>
  </UContainer>
</template>
