<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>(), {
  variant: 'default',
  size: 'default',
  type: 'button',
  disabled: false,
})
</script>

<template>
  <button class="ui-button" :class="[`ui-button-${variant}`, `ui-button-${size}`]" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.ui-button { display: inline-flex; min-height: 36px; align-items: center; justify-content: center; gap: 8px; padding: 0 12px; border: 1px solid #2879df; border-radius: 6px; color: #fff; font: inherit; font-size: 11px; font-weight: 600; background: #2879df; cursor: pointer; }
.ui-button:hover:not(:disabled) { background: #1766c7; }
.ui-button-outline { border-color: #dce4ec; color: #40566c; background: #fff; }
.ui-button-outline:hover:not(:disabled), .ui-button-ghost:hover:not(:disabled) { background: #f2f5f8; }
.ui-button-ghost { border-color: transparent; color: #52677c; background: transparent; }
.ui-button-sm { min-height: 30px; padding: 0 9px; font-size: 10px; }
.ui-button:disabled { cursor: not-allowed; opacity: .55; }
</style>
