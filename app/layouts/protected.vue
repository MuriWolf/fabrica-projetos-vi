<template>
  <app-sidebar>
    <div class="flex-1 p-4">
      <div class="max-w-7xl mx-auto">
        <!-- Card que envolve TODO o conteúdo -->
        <UCard
          class="bg-white min-h-[calc(100vh-40px)] sm:min-h-[calc(100vh-120px)] border-0"
        >
          <slot />
        </UCard>
      </div>
    </div>
  </app-sidebar>
</template>

<script setup lang="ts">
import AppSidebar from "~/components/AppSidebar.vue";
import authGlobal from "~/middleware/auth.global";

definePageMeta({
  middleware: authGlobal,
});
</script>
