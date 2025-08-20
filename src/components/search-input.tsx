"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Props {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: Props) {
  const [inner, setInner] = React.useState(value)

  React.useEffect(() => {
    setInner(value)
  }, [value])

  React.useEffect(() => {
    const id = setTimeout(() => onChange(inner), 300)
    return () => clearTimeout(id)
  }, [inner, onChange])

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={inner}
        onChange={(e) => setInner(e.target.value)}
        placeholder="Поиск кампаний"
        className="pl-8"
      />
    </div>
  )
}
