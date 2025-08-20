import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export interface Campaign {
  id: string
  title: string
  short_description: string
  cover_url?: string | null
  tags?: string[]
  duration_hours?: number | null
  players_min?: number | null
  players_max?: number | null
  age?: string | null
  status?: string | null
  votes30d?: number
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-lg focus-within:ring-2">
      <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl bg-muted">
        {campaign.cover_url && (
          <Image
            src={campaign.cover_url}
            alt=""
            fill
            className="object-cover"
          />
        )}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">{campaign.title}</h3>
      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
        {campaign.short_description}
      </p>
      {campaign.tags && (
        <div className="mb-2 flex flex-wrap gap-1">
          {campaign.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {campaign.players_min && campaign.players_max && (
          <span>
            {campaign.players_min}-{campaign.players_max} игроков
          </span>
        )}
        {campaign.duration_hours && <span>{campaign.duration_hours} ч.</span>}
        {campaign.age && <span>{campaign.age}</span>}
        {campaign.status && <span>{campaign.status}</span>}
        {typeof campaign.votes30d === "number" && (
          <span>голосов: {campaign.votes30d}</span>
        )}
      </div>
    </div>
  )
}
