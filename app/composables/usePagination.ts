import type { Ref } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize = 10) {
  const page = ref(1)

  const pageCount = computed(() => {
    return Math.max(1, Math.ceil(items.value.length / pageSize))
  })

  const from = computed(() => {
    if (items.value.length === 0) return 0
    return (page.value - 1) * pageSize + 1
  })

  const to = computed(() => {
    return Math.min(page.value * pageSize, items.value.length)
  })

  const paginated = computed(() => {
    const start = (page.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
  })

  watch(items, () => {
    if (page.value > pageCount.value) page.value = pageCount.value
  })

  return {
    page,
    pageSize,
    pageCount,
    from,
    to,
    paginated
  }
}
