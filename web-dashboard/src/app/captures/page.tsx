"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Capture, columns } from "./columns"
import { DataTable } from "./data-table"
import { QuickCaptureDialog } from "@/components/quick-capture-dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

type CaptureApi = {
  id: string
  type: Capture["type"]
  content: string
  metadata?: { title?: string }
  processingStatus: Capture["status"]
  createdAt: string
}

export default function CapturesPage() {
  const [captures, setCaptures] = useState<CaptureApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCaptures = async () => {
    if (!authStorage.getToken()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await api.get("/captures", { params: { limit: 50, offset: 0 } })
      setCaptures(response.data?.data ?? [])
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load captures."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCaptures()
  }, [])

  useEffect(() => {
    const handleAuth = () => loadCaptures()
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  const tableData: Capture[] = useMemo(
    () =>
      captures.map((capture) => ({
        id: capture.id,
        content: capture.metadata?.title ?? capture.content,
        type: capture.type,
        status: capture.processingStatus,
        date: format(new Date(capture.createdAt), "MMM d, yyyy"),
      })),
    [captures]
  )

  const handleDelete = async (captureId: string) => {
    try {
      await api.delete(`/captures/${captureId}`)
      setCaptures((prev) => prev.filter((capture) => capture.id !== captureId))
      toast.success("Capture deleted.")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete capture."))
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#1c2433]">Captures</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCaptures}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#55607a] hover:bg-[#f1f5fb] rounded-xl transition-colors border border-[#e6ebf4]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <QuickCaptureDialog onCreated={loadCaptures} triggerLabel="Add Capture" />
        </div>
      </div>
      {!authStorage.getToken() ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          Connect your account to view captures.
        </div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Loading captures...</div>
      ) : error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : (
        <div className="flex-1">
          <DataTable columns={columns(handleDelete)} data={tableData} />
        </div>
      )}
    </div>
  )
}
