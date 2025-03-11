import { ref, onMounted, onUnmounted } from 'vue';

export function useTabVisibilityRefetch(refetchCallback: () => void) {
  const isVisible = ref(document.visibilityState === 'visible');

  const handleVisibilityChange = () => {
    isVisible.value = document.visibilityState === 'visible';
    if (isVisible.value) {
      refetchCallback();
    }
  };

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return { isVisible };
}
