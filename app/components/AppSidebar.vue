<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Bar Mobile -->
    <header
      class="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
    >
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"
          >
            <UIcon name="i-heroicons-pills" class="w-5 h-5 text-white" />
          </div>
          <span class="font-bold text-gray-900">Gestor de Medicamentos</span>
        </div>

        <!-- Menu Toggle -->
        <UButton
          color="gray"
          variant="ghost"
          :icon="isMobileMenuOpen ? 'i-heroicons-x-mark' : 'i-heroicons-menu'"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        />
      </div>

      <!-- Mobile Menu Dropdown -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-show="isMobileMenuOpen"
          class="border-t border-gray-100 bg-white"
        >
          <!-- Menu Items -->
          <nav class="px-2 py-2 space-y-1">
            <NuxtLink
              v-for="item in menuItems"
              :key="item.label"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
              :class="[
                currentPath === item.to
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100',
              ]"
              @click="isMobileMenuOpen = false"
            >
              <UIcon
                :name="currentPath === item.to ? item.activeIcon : item.icon"
                class="w-5 h-5"
              />
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- User Menu -->
          <div class="border-t border-gray-100 mt-2 pt-2 pb-2">
            <UDivider label="Usuário" class="text-xs text-gray-400" />

            <div class="px-3 py-2">
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center"
                >
                  <span class="text-white font-semibold text-sm">
                    {{ auth.user.value?.name?.charAt(0) || "U" }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">
                    {{ auth.user.value?.name || "Usuário" }}
                  </p>
                  <p class="text-sm text-gray-500 truncate">
                    {{ auth.user.value?.email }}
                  </p>
                </div>
              </div>

              <!-- User Menu Items -->
              <div class="space-y-1">
                <div v-for="item in userMenuItems" :key="item.label">
                  <NuxtLink
                    v-if="!item.click"
                    :to="item.to"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    :class="item.class"
                    @click="isMobileMenuOpen = false"
                  >
                    <UIcon :name="item.icon" class="w-5 h-5" />
                    {{ item.label }}
                  </NuxtLink>

                  <button
                    v-for="item in userMenuItems"
                    :key="item.label"
                    v-if="item.click"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    @click="
                      () => {
                        if (item.click) item.click();
                        isMobileMenuOpen = false;
                      }
                    "
                  >
                    <UIcon :name="item.icon" class="w-5 h-5" />
                    {{ item.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </header>

    <!-- Desktop Layout -->
    <div class="hidden lg:flex">
      <!-- Sidebar -->
      <aside
        class="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0"
      >
        <div class="flex flex-col h-full">
          <!-- Logo Area -->
          <div class="p-4 border-b border-gray-100">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg"
              >
                <UIcon name="i-heroicons-pills" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="font-bold text-gray-900">Gestor</h1>
                <p class="text-xs text-gray-500">Medicamentos</p>
              </div>
            </div>
          </div>

          <!-- Main Navigation -->
          <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
            <NuxtLink
              v-for="item in menuItems"
              :key="item.label"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
              :class="[
                currentPath === item.to
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100',
              ]"
            >
              <UIcon
                :name="currentPath === item.to ? item.activeIcon : item.icon"
                class="w-5 h-5"
              />
              <span class="font-medium">{{ item.label }}</span>
            </NuxtLink>
          </nav>

          <!-- User Section -->
          <div class="p-3 border-t border-gray-100">
            <div class="mb-3">
              <UDivider
                label="USUÁRIO"
                class="text-[10px] text-gray-400 uppercase tracking-wide"
              />
            </div>

            <div
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors mb-2"
            >
              <div
                class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"
              >
                <span class="text-white font-semibold text-sm">
                  {{ auth.user.value?.name?.charAt(0) || "U" }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">
                  {{ auth.user.value?.name || "Usuário" }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ auth.user.value?.email }}
                </p>
              </div>

              <UButton
                to="/profile"
                color="secondary"
                variant="ghost"
                size="xs"
                icon="i-heroicons-user-circle"
              />
            </div>

            <UButton
              block
              color="error"
              variant="outline"
              size="sm"
              icon="i-heroicons-arrow-left-on-rectangle"
              class="cursor-pointer"
              @click="handleLogout"
            >
              Sair
            </UButton>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 min-w-0">
        <slot />
      </main>
    </div>

    <!-- Mobile Content -->
    <main class="lg:hidden min-h-[calc(100vh-60px)]">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthMock();
const isMobileMenuOpen = ref(false);

const currentPath = computed(() => useRoute().path);

const menuItems = [
  {
    label: "Estoque",
    icon: "i-heroicons-home",
    to: "/",
    activeIcon: "i-heroicons-home-solid",
  },
  {
    label: "Meu Perfil",
    icon: "i-heroicons-user",
    to: "/profile",
    activeIcon: "i-heroicons-user-solid",
  },
];

async function handleLogout() {
  await auth.logout();
  navigateTo("/login");
}

// Menu dropdown do usuário
const userMenuItems = [
  {
    label: "Perfil",
    icon: "i-heroicons-user-circle",
    to: "/profile",
  },
  {
    label: "Sair",
    icon: "i-heroicons-arrow-left-on-rectangle",
    class: "text-red-600",
    click: handleLogout,
  },
];
</script>
