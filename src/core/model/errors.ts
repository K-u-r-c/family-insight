/** Stable error codes; the UI maps them to translations under `errors.model.<code>`. */
export type ModelErrorCode =
  | 'person-not-found'
  | 'relationship-not-found'
  | 'self-relationship'
  | 'duplicate-relationship'
  | 'duplicate-id'
  | 'ancestry-cycle'
  | 'too-many-biological-parents'

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
