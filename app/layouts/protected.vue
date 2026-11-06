<template>
  <AppSidebar>
    <div class="flex-1 p-4">
      <div class="max-w-7xl mx-auto">
        <!-- Card que envolve TODO o conteúdo -->
        <UCard
          class="bg-white min-h-[calc(100vh-40px)] sm:h-[calc(100vh-120px)] border-0 overflow-auto"
        >
          <slot />
        </UCard>
      </div>
    </div>
  </AppSidebar>
</template>
