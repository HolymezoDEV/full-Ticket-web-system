<script setup lang="ts">
defineProps<{ name: string, align?: 'start' | 'end' }>()
</script>

<template>
  <div
    class="flex items-end gap-3"
    :class="align === 'end' && 'flex-row-reverse'"
    role="status"
    :aria-label="`${name} schreibt gerade`"
  >
    <UAvatar :text="initials(name)" size="sm" />
    <div>
      <p class="mb-1 text-xs text-muted" :class="align === 'end' && 'text-right'">
        {{ name }} schreibt …
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
</template>
