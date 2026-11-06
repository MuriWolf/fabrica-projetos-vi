<template>
  <div class="w-full space-y-3" aria-hidden="true">
    <div class="flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-3">
      <USkeleton
        v-for="column in columns"
        :key="`head-${column}`"
        class="h-4"
        :class="column === 1 ? 'flex-[2]' : 'flex-1'"
      />
    </div>

    <div
      v-for="row in rows"
      :key="row"
      class="flex items-center gap-4 px-4 py-3"
    >
      <USkeleton
        v-for="column in columns"
        :key="`cell-${row}-${column}`"
        class="h-4"
        :class="column === 1 ? 'flex-[2]' : 'flex-1'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    columns?: number
  }>(),
  {
    rows: 6,
    columns: 5
  }
)
</script>
