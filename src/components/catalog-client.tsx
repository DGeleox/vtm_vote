"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchInput } from "./search-input"
import { SortDropdown } from "./sort-dropdown"
import { FiltersBar, Filters } from "./filters-bar"
import { FiltersSheet } from "./filters-sheet"
import { CardsGrid } from "./cards-grid"
import { CampaignCard, Campaign } from "./campaign-card"
import { CardSkeleton } from "./card-skeleton"
import { EmptyState } from "./empty-state"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface Facets {
  tags: string[]
  statuses: string[]
  ages: string[]
  duration: { min: number; max: number }
  players: { min: number; max: number }
}

interface ResponseData {
  items: Campaign[]
  total: number
  page: number
  pageSize: number
  facets: Facets
}

export function CatalogClient({
  initialSearchParams,
}: {
  initialSearchParams: Record<string, string | string[] | undefined>
}) {
  const router = useRouter()
  const { toast } = useToast()

  const [query, setQuery] = React.useState(
    (initialSearchParams.query as string) || "",
  )
  const [sort, setSort] = React.useState(
    (initialSearchParams.sort as string) || "popular",
  )
  const [filters, setFilters] = React.useState<Filters>({
    tags: initialSearchParams.tags
      ? String(initialSearchParams.tags)
          .split(",")
          .filter(Boolean)
      : [],
    durationMin: initialSearchParams.durationMin
      ? Number(initialSearchParams.durationMin)
      : undefined,
    durationMax: initialSearchParams.durationMax
      ? Number(initialSearchParams.durationMax)
      : undefined,
    playersMin: initialSearchParams.playersMin
      ? Number(initialSearchParams.playersMin)
      : undefined,
    playersMax: initialSearchParams.playersMax
      ? Number(initialSearchParams.playersMax)
      : undefined,
    age: (initialSearchParams.age as string) || undefined,
    statuses: initialSearchParams.statuses
      ? String(initialSearchParams.statuses)
          .split(",")
          .filter(Boolean)
      : [],
  })

  const [facets, setFacets] = React.useState<Facets>()
  const [items, setItems] = React.useState<Campaign[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(false)

  const buildQuery = React.useCallback(
      (extra?: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams()
      if (query) params.set("query", query)
      if (sort && sort !== "popular") params.set("sort", sort)
      if (filters.tags.length) params.set("tags", filters.tags.join(","))
      if (filters.durationMin !== undefined)
        params.set("durationMin", String(filters.durationMin))
      if (filters.durationMax !== undefined)
        params.set("durationMax", String(filters.durationMax))
      if (filters.playersMin !== undefined)
        params.set("playersMin", String(filters.playersMin))
      if (filters.playersMax !== undefined)
        params.set("playersMax", String(filters.playersMax))
      if (filters.age) params.set("age", filters.age)
      if (filters.statuses.length)
        params.set("statuses", filters.statuses.join(","))
      if (extra?.page) params.set("page", String(extra.page))
      return params.toString()
    },
    [query, sort, filters],
  )

  React.useEffect(() => {
    const qs = buildQuery()
    const url = qs ? `/?${qs}` : "/"
    const current =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : ""
    if (url !== current) {
      router.replace(url, { scroll: false })
    }
  }, [buildQuery, router])

  const fetchData = React.useCallback(
    async (
      p: number,
      replaceItems: boolean,
      signal?: AbortSignal,
    ) => {
      setLoading(true)
      try {
        const qs = buildQuery({ page: p })
        const res = await fetch(`/api/campaigns?${qs}`, { signal })
        if (!res.ok) throw new Error("Ошибка загрузки")
        const data: ResponseData = await res.json()
        setFacets(data.facets)
        setTotal(data.total)
        setPage(data.page)
        setItems((prev) => (replaceItems ? data.items : [...prev, ...data.items]))
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") {
          console.log("Запрос отменён клиентом")
        } else {
          const message = e instanceof Error ? e.message : String(e)
          toast({ title: "Ошибка", description: message })
        }
      } finally {
        setLoading(false)
      }
    },
    [buildQuery, toast],
  )

  React.useEffect(() => {
    const controller = new AbortController()
    fetchData(1, true, controller.signal)
    return () => {
      controller.abort()
    }
  }, [fetchData])

  const loadMore = () => fetchData(page + 1, false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} />
        <SortDropdown value={sort} onChange={setSort} />
        {facets && (
          <FiltersSheet facets={facets} values={filters} onChange={setFilters} />
        )}
      </div>
      {facets && (
        <div className="hidden sm:block">
          <FiltersBar facets={facets} values={filters} onChange={setFilters} />
        </div>
      )}
      {loading && page === 1 ? (
        <CardsGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </CardsGrid>
      ) : items.length ? (
        <CardsGrid>
          {items.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </CardsGrid>
      ) : (
        <EmptyState />
      )}
      {items.length < total && (
        <div className="flex justify-center">
          <Button onClick={loadMore} disabled={loading}>
            Загрузить ещё
          </Button>
        </div>
      )}
    </div>
  )
}
