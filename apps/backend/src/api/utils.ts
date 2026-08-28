import type { ApiResponse, ErrorResponse } from "./types";

export function formatError(
  options: ErrorResponse["error"],
): ApiResponse<never> {
  return {
    success: false,
    error: options,
    timestamp: new Date().toISOString(),
  };
}

export function formatSuccess<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data,
  };
}
