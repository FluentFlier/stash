import { isAxiosError } from "axios"

type ApiErrorPayload = { error?: string }

export function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ApiErrorPayload>(error)) {
    return error.response?.data?.error ?? fallback
  }
  if (error instanceof Error) {
    return error.message || fallback
  }
  return fallback
}
