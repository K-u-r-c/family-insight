/** Stable error codes; the UI maps them to translations under `errors.model.<code>`. */
export const MODEL_ERROR_CODES = [
  'person-not-found',
  'event-not-found',
  'source-not-found',
  'repository-not-found',
  'citation-not-found',
  'media-not-found',
  'relationship-not-found',
  'self-relationship',
  'duplicate-relationship',
  'duplicate-id',
  'ancestry-cycle',
  'too-many-biological-parents'
] as const

export type ModelErrorCode = (typeof MODEL_ERROR_CODES)[number]

export class ModelError extends Error {
  readonly code: ModelErrorCode
  readonly params: Record<string, string>

  constructor(code: ModelErrorCode, params: Record<string, string> = {}) {
    super(`${code}${Object.keys(params).length ? ` ${JSON.stringify(params)}` : ''}`)
    this.name = 'ModelError'
    this.code = code
    this.params = params
  }
}

export function isModelError(error: unknown): error is ModelError {
  return error instanceof ModelError
}
