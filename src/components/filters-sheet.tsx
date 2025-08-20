"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FiltersBar, Filters } from "./filters-bar"

interface Props {
  facets: React.ComponentProps<typeof FiltersBar>["facets"]
  values: Filters
  onChange: (val: Filters) => void
}

export function FiltersSheet({ facets, values, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  const [local, setLocal] = React.useState(values)

  React.useEffect(() => setLocal(values), [values])

  const apply = () => {
    onChange(local)
    setOpen(false)
  }

  const reset = () => {
    const empty: Filters = { tags: [], statuses: [] }
    setLocal(empty)
    onChange(empty)
    setOpen(false)
  }

  return (
    <div className="sm:hidden">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Фильтры
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <FiltersBar facets={facets} values={local} onChange={setLocal} />
            <div className="mt-4 flex justify-between">
              <Button variant="ghost" onClick={reset}>
                Reset
              </Button>
              <Button onClick={apply}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
