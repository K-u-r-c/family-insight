import type { FamilyInsightApi } from '../shared/ipc'

declare global {
  interface Window {
    familyInsight: FamilyInsightApi
  }
}

export {}
