"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Facets {
  tags: string[]
  statuses: string[]
  ages: string[]
  duration: { min: number; max: number }
  players: { min: number; max: number }
}

export interface Filters {
  tags: string[]
  durationMin?: number
  durationMax?: number
  playersMin?: number
  playersMax?: number
  age?: string
  statuses: string[]
}

interface Props {
  facets: Facets
  values: Filters
  onChange: (val: Filters) => void
  onReset?: () => void
}

export function FiltersBar({ facets, values, onChange, onReset }: Props) {
  const toggleTag = (tag: string) => {
    const exists = values.tags.includes(tag)
    const next = exists
      ? values.tags.filter((t) => t !== tag)
      : [...values.tags, tag]
    onChange({ ...values, tags: next })
  }

  const toggleStatus = (status: string, checked: boolean) => {
    const next = checked
      ? [...values.statuses, status]
      : values.statuses.filter((s) => s !== status)
    onChange({ ...values, statuses: next })
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {facets.tags.map((tag) => (
          <Badge
            key={tag}
            variant={values.tags.includes(tag) ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={values.durationMin ?? ""}
          onChange={(e) =>
            onChange({ ...values, durationMin: Number(e.target.value) || undefined })
          }
          placeholder={`${facets.duration.min}`}
          className="w-16"
        />
        <span>-</span>
        <Input
          type="number"
          value={values.durationMax ?? ""}
          onChange={(e) =>
            onChange({ ...values, durationMax: Number(e.target.value) || undefined })
          }
          placeholder={`${facets.duration.max}`}
          className="w-16"
        />
      </div>

      {/* Players */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={values.playersMin ?? ""}
          onChange={(e) =>
            onChange({ ...values, playersMin: Number(e.target.value) || undefined })
          }
          placeholder={`${facets.players.min}`}
          className="w-16"
        />
        <span>-</span>
        <Input
          type="number"
          value={values.playersMax ?? ""}
          onChange={(e) =>
            onChange({ ...values, playersMax: Number(e.target.value) || undefined })
          }
          placeholder={`${facets.players.max}`}
          className="w-16"
        />
      </div>

      {/* Age */}
      <Select
        value={values.age}
        onValueChange={(v) => onChange({ ...values, age: v })}
      >
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="Возраст" />
        </SelectTrigger>
        <SelectContent>
          {facets.ages.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <div className="flex items-center gap-2">
        {facets.statuses.map((s) => (
          <label key={s} className="flex items-center gap-1 text-sm">
            <Checkbox
              checked={values.statuses.includes(s)}
              onCheckedChange={(c) => toggleStatus(s, Boolean(c))}
            />
            {s}
          </label>
        ))}
      </div>

      {onReset && (
        <Button variant="ghost" onClick={onReset} className="ml-auto">
          Reset
        </Button>
      )}
    </div>
  )
}
