"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  value: string
  onChange: (value: string) => void
}

const options = [
  { value: "popular", label: "Популярные" },
  { value: "new", label: "Новые" },
  { value: "title", label: "Название" },
  { value: "duration", label: "Длительность" },
  { value: "players", label: "Игроки" },
  { value: "age", label: "Возраст" },
]

export function SortDropdown({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
