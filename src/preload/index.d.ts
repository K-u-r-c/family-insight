import type { OharaApi } from '../shared/ipc'

declare global {
  interface Window {
    ohara: OharaApi
  }
}

export {}
