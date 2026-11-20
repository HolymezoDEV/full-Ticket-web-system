export function errorMessage(error: unknown, fallback: string) {
  const data = (error as { data?: { statusMessage?: string, message?: string } })?.data
  return data?.statusMessage || data?.message || fallback
}
