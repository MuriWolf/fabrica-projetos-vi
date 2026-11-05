<template>
  <AppSidebar>
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
  </AppSidebar>
</template>
