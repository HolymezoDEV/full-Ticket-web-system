<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

useSeoMeta({ title: 'Profil' })

const toast = useToast()
const { user } = useAuth()

const schema = z.object({
  name: z.string().trim().min(2, 'Bitte gib deinen Namen ein.').max(120),
  email: z.email('Bitte gib eine gültige E-Mail-Adresse ein.')
})
type Schema = z.output<typeof schema>

const state = reactive<Schema>({ name: user.value?.name ?? '', email: user.value?.email ?? '' })
const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    user.value = await $fetch<AuthUser>('/api/auth/profile', { method: 'PATCH', body: event.data })
    toast.add({ title: 'Profil gespeichert', icon: 'i-lucide-check', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Profil nicht gespeichert', description: errorMessage(err, 'Bitte versuche es erneut.'), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm
    id="profile"
    :schema="schema"
    :state="state"
    @submit="onSubmit"
  >
    <UPageCard
      title="Profil"
      description="Dein Name steht unter deinen Antworten an Kund:innen."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="profile"
        label="Speichern"
        type="submit"
        :loading="loading"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Wird in Ticketantworten angezeigt."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="state.name" autocomplete="name" />
      </UFormField>
      <USeparator />
      <UFormField
        name="email"
        label="E-Mail-Adresse"
        description="Damit meldest du dich an. Testmails gehen an diese Adresse."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="state.email" type="email" autocomplete="email" />
      </UFormField>
      <USeparator />
      <UFormField label="Rolle" :description="`${user?.permissions.length ?? 0} Berechtigungen. Deine Rolle legt fest, was du im Portal darfst.`" class="flex max-sm:flex-col justify-between items-start gap-4">
        <UBadge
          :label="user?.roleName"
          :color="user?.roleId === 'admin' ? 'primary' : 'neutral'"
          variant="subtle"
          size="lg"
        />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
