import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Hello, shadcn/ui + Tailwind</h1>
        <Button>Click me</Button>
      </Card>
    </main>
  )
}
