"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Trash2 } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type CaptureDetail = {
  id: string
  type: string
  content: string
  userInput?: string | null
  processingStatus: string
  createdAt: string
  metadata?: Record<string, unknown>
  tags?: { tag: { name: string } }[]
}

export default function CaptureDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [capture, setCapture] = useState<CaptureDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCapture = async () => {
      if (!authStorage.getToken()) {
        setLoading(false)
        return
      }
      try {
        const response = await api.get(`/captures/${params.id}`)
        setCapture(response.data?.data ?? null)
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to load capture."))
      } finally {
        setLoading(false)
      }
    }

    loadCapture()
  }, [params.id])

  const handleDelete = async () => {
    if (!capture) return
    try {
      await api.delete(`/captures/${capture.id}`)
      toast.success("Capture deleted.")
      router.push("/captures")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete capture."))
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading capture...</div>
  }

  if (!authStorage.getToken()) {
    return <div className="text-sm text-muted-foreground">Connect your account to view captures.</div>
  }

  if (!capture) {
    return <div className="text-sm text-muted-foreground">Capture not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => router.push("/captures")}>
          <ArrowLeft className="h-4 w-4" />
          Back to captures
        </Button>
        <Button variant="destructive" className="gap-2" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">{capture.metadata?.title ?? capture.content}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{capture.type}</Badge>
            <Badge variant="secondary">{capture.processingStatus.toLowerCase()}</Badge>
            <span>Created {format(new Date(capture.createdAt), "PPP p")}</span>
          </div>
          {capture.userInput ? (
            <div>
              <p className="text-sm font-semibold">Context</p>
              <p className="text-sm text-muted-foreground">{capture.userInput}</p>
            </div>
          ) : null}
          {capture.metadata ? (
            <div>
              <p className="text-sm font-semibold">Metadata</p>
              <pre className="mt-2 rounded-lg border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground overflow-auto">
                {JSON.stringify(capture.metadata, null, 2)}
              </pre>
            </div>
          ) : null}
          {capture.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {capture.tags.map((tag) => (
                <Badge key={tag.tag.name} variant="outline">
                  {tag.tag.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
