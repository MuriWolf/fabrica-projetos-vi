<template>
  <slot />
</template>

<script setup lang="ts">
import authGlobal from '~/middleware/auth.global';

definePageMeta({
  middleware: authGlobal 
})
</script>