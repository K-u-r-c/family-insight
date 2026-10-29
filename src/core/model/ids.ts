/** Generates a new opaque identifier for persons and relationships. */
export function newId(): string {
  return globalThis.crypto.randomUUID()
}
