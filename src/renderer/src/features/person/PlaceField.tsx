import { useId, useMemo } from 'react'
import { useDocument } from '@renderer/store/document'
import { useFormat } from '@renderer/i18n/format'
import { CommitTextField } from './CommitField'

/** All distinct places used in the tree (births, deaths, partnerships), sorted. */
function usePlaces(): string[] {
  const tree = useDocument((s) => s.tree)
  const { compare } = useFormat()
  return useMemo(() => {
    if (!tree) return []
    const set = new Set<string>()
    for (const p of Object.values(tree.persons)) {
      if (p.birth?.place) set.add(p.birth.place)
      if (p.death?.place) set.add(p.death.place)
    }
    for (const r of Object.values(tree.relationships)) {
      if (r.type === 'partnership') {
        if (r.start?.place) set.add(r.start.place)
        if (r.end?.place) set.add(r.end.place)
      }
    }
    return [...set].sort(compare)
  }, [tree, compare])
}

interface PlaceFieldProps {
  label: string
  value: string
  onCommit: (value: string) => void
  placeholder?: string
}

/** Place input with autocomplete from places already used in the tree. */
export function PlaceField({
  label,
  value,
  onCommit,
  placeholder
}: PlaceFieldProps): React.JSX.Element {
  const places = usePlaces()
  const listId = useId()
  return (
    <>
      <CommitTextField
        label={label}
        value={value}
        onCommit={onCommit}
        list={listId}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {places.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  )
}
