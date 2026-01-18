"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type CaptureType = "LINK" | "TEXT" | "FILE" | "IMAGE" | "AUDIO"

type QuickCaptureDialogProps = {
  onCreated?: () => void
  triggerLabel?: string
}

export function QuickCaptureDialog({ onCreated, triggerLabel = "New Capture" }: QuickCaptureDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<CaptureType>("LINK")
  const [content, setContent] = useState("")
  const [note, setNote] = useState("")

  const handleSubmit = async () => {
    if (!authStorage.getToken()) {
      toast.info("Connect your account to create captures.")
      return
    }
    if (!content.trim()) return
    setLoading(true)
    try {
      await api.post("/captures", {
        type,
        content,
        userInput: note || undefined,
      })
      toast.success("Capture queued for processing.")
      setOpen(false)
      setContent("")
      setNote("")
      setType("LINK")
      onCreated?.()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create capture."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Sparkles className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Queue a capture</DialogTitle>
          <DialogDescription>
            Drop in a link, note, or reference. Stash will analyze and organize it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="capture-type">Type</Label>
            <select
              id="capture-type"
              value={type}
              onChange={(event) => setType(event.target.value as CaptureType)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="LINK">Link</option>
              <option value="TEXT">Text</option>
              <option value="FILE">File</option>
              <option value="IMAGE">Image</option>
              <option value="AUDIO">Audio</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capture-content">Content</Label>
            <Textarea
              id="capture-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste a link or write a note..."
              className="min-h-[120px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="capture-note">Context (optional)</Label>
            <Input
              id="capture-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Why is this important?"
            />
          </div>
          <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to Stash"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
