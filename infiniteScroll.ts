import type { Ref } from 'vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface UseInfiniteScrollOptions<T> {
  /**
   * The callback function to fetch more items
   * @param page The page number to fetch
   * @returns Promise resolving to an array of items or null if no more items
   */
  fetchItems: (page: number) => Promise<T[] | null>

  /**
   * The threshold distance from the bottom to trigger loading more (in pixels)
   * @default 200
   */
  threshold?: number

  /**
   * Initial page number
   * @default 1
   */
  initialPage?: number

  /**
   * Whether to start loading immediately on mount
   * @default true
   */
  loadOnMount?: boolean
}

/**
 * A composable for implementing infinite scroll that fetches more items as the user scrolls
 * and returns a flattened array of all items loaded so far.
 */
export function useAsyncLoadInfiniteScroll<T>(
  targetRef: Ref<HTMLElement | null>,
  options: UseInfiniteScrollOptions<T>,
) {
  // Default options
  const {
    fetchItems,
    threshold = 200,
    initialPage = 1,
    loadOnMount = true,
  } = options

  // State
  const items = ref<T[]>([]) as Ref<T[]>
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(initialPage)

  // Function to check if we need to load more items
  const checkScroll = () => {
    if (!targetRef.value || isLoading.value || !hasMore.value)
      return

    const element = targetRef.value
    const { scrollTop, scrollHeight, clientHeight } = element

    // If we're close to the bottom, load more
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loadMore()
    }
  }

  // Throttle the scroll event to avoid performance issues
  const throttle = <F extends (...args: any[]) => any>(func: F, limit: number): F => {
    let lastFunc: number
    let lastRan: number

    return function (this: any, ...args: Parameters<F>) {
      if (!lastRan) {
        func.apply(this, args)
        lastRan = Date.now()
      }
      else {
        clearTimeout(lastFunc)
        lastFunc = window.setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args)
            lastRan = Date.now()
          }
        }, limit - (Date.now() - lastRan))
      }
    } as F
  }

  // Throttled check scroll function
  const throttledCheckScroll = throttle(checkScroll, 200)

  // Function to load more items
  const loadMore = async () => {
    if (isLoading.value || !hasMore.value)
      return

    try {
      isLoading.value = true
      error.value = null

      const newItems = await fetchItems(currentPage.value)

      if (!newItems || newItems.length === 0) {
        hasMore.value = false
      }
      else {
        items.value = [...items.value, ...newItems]
        currentPage.value++
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('An unknown error occurred')
      console.error('Error fetching more items:', error.value)
    }
    finally {
      isLoading.value = false
    }
  }

  // Reset the infinite scroll
  const reset = () => {
    items.value = []
    currentPage.value = initialPage
    hasMore.value = true
    error.value = null

    if (loadOnMount) {
      loadMore()
    }
  }

  /**
   * Refetch all items from the beginning up to the current page
   * @returns Promise that resolves when all items have been refetched
   */
  const refetchAll = async (): Promise<void> => {
    if (isLoading.value)
      return

    const targetPage = currentPage.value - 1 // Current page - 1 since it's the next page to fetch

    try {
      isLoading.value = true
      error.value = null
      items.value = []

      let allItems: T[] = []
      let page = initialPage

      // Fetch all pages up to the current page
      while (page <= targetPage) {
        const pageItems = await fetchItems(page)

        if (!pageItems || pageItems.length === 0) {
          hasMore.value = false
          break
        }

        allItems = [...allItems, ...pageItems]
        page++
      }

      // Update the items with the refetched data
      items.value = allItems
      currentPage.value = page

      // Check if we should reset hasMore flag
      if (!hasMore.value && page <= targetPage) {
        // We didn't reach the target page, which means there's no more data
        hasMore.value = false
      }
      else if (page > targetPage) {
        // We reached the target page, assume there might be more
        hasMore.value = true
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error('An error occurred while refetching items')
      console.error('Error refetching items:', error.value)
    }
    finally {
      isLoading.value = false
    }
  }

  // Setup scroll listener when target element is available
  watch(targetRef, (newTarget, oldTarget) => {
    if (oldTarget) {
      oldTarget.removeEventListener('scroll', throttledCheckScroll)
    }

    if (newTarget) {
      newTarget.addEventListener('scroll', throttledCheckScroll)
    }
  })

  // Setup on component mount
  onMounted(() => {
    if (targetRef.value) {
      targetRef.value.addEventListener('scroll', throttledCheckScroll)

      if (loadOnMount) {
        loadMore()
      }
    }
  })

  // Cleanup on component unmount
  onUnmounted(() => {
    if (targetRef.value) {
      targetRef.value.removeEventListener('scroll', throttledCheckScroll)
    }
  })

  return {
    items,
    isLoading,
    error,
    hasMore,
    currentPage,
    loadMore,
    reset,
    refetchAll,
  }
}
