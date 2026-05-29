export function useDirtyForm<T>(initial: T, current: T): boolean {
  return JSON.stringify(initial) !== JSON.stringify(current)
}
