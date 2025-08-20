export function useToast() {
  return {
    toast: ({ title, description }: { title?: string; description?: string }) => {
      console.error(title, description)
    },
  }
}
