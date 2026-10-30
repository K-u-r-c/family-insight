import {
  Armchair,
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  Church,
  ClipboardList,
  Cross,
  Droplet,
  Droplets,
  Flag,
  Flame,
  GraduationCap,
  House,
  PlaneLanding,
  PlaneTakeoff,
  Shield,
  Sparkle,
  Wine,
  type LucideIcon
} from 'lucide-react'
import type { EventType, PersonEvent } from '@core/model/types'

/** Icon of each life event type (editor, details and timeline). */
export const EVENT_ICONS: Record<EventType, LucideIcon> = {
  baptism: Droplets,
  christening: Droplet,
  confirmation: Sparkle,
  'first-communion': Wine,
  religion: Church,
  burial: Cross,
  cremation: Flame,
  emigration: PlaneTakeoff,
  immigration: PlaneLanding,
  naturalization: Flag,
  residence: House,
  occupation: Briefcase,
  education: BookOpen,
  graduation: GraduationCap,
  'military-service': Shield,
  census: ClipboardList,
  retirement: Armchair,
  award: Award,
  custom: CalendarDays
}

/** Event types grouped for the "Add event" menu, in display order. */
export const EVENT_CATEGORIES: { key: string; types: EventType[] }[] = [
  {
    key: 'religious',
    types: ['baptism', 'christening', 'confirmation', 'first-communion', 'religion']
  },
  {
    key: 'work',
    types: ['occupation', 'education', 'graduation', 'military-service', 'retirement']
  },
  { key: 'places', types: ['residence', 'emigration', 'immigration', 'naturalization', 'census'] },
  { key: 'other', types: ['burial', 'cremation', 'award', 'custom'] }
]

/** Translated name of an event: the custom name for `custom` events. */
export function eventName(
  event: Pick<PersonEvent, 'type' | 'customType'>,
  t: (key: string) => string
): string {
  return event.type === 'custom' && event.customType?.trim()
    ? event.customType.trim()
    : t(`events.type.${event.type}`)
}
