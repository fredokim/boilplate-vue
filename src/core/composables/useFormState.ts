import { computed, ref } from "vue";

export function useFormState() {
  const isSubmitting = ref(false);
  const submitCount = ref(0);

  const canSubmit = computed(() => !isSubmitting.value);

  async function submit(action: () => Promise<boolean> | boolean) {
    if (isSubmitting.value) {
      return false;
    }

    isSubmitting.value = true;
    submitCount.value += 1;

    try {
      return await action();
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    canSubmit,
    isSubmitting,
    submit,
    submitCount,
  };
}

