import { CatalogClient } from "@/components/catalog-client"

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return <CatalogClient initialSearchParams={searchParams} />
}
