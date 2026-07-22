// Tiny pub-sub so axios.ts (which owns token refresh) and authStore.ts (which owns auth state)
// don't have to import each other - axios.ts -> store/authStore.ts -> api/index.ts -> axios.ts
// would be a circular import. Both depend on this leaf module instead.
type Listener = () => void

let listeners: Listener[] = []

export const onSessionExpired = (listener: Listener): (() => void) => {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export const emitSessionExpired = (): void => {
  listeners.forEach((listener) => listener())
}
