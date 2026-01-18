"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Bell, Calendar as CalendarIcon, Trash2 } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Reminder = {
  id: string
  message: string
  scheduledAt: string
  status: "PENDING" | "SENT" | "COMPLETED" | "CANCELLED" | "SNOOZED"
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [loading, setLoading] = useState(true)

  const loadReminders = async () => {
    if (!authStorage.getToken()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get("/reminders", { params: { limit: 50, offset: 0 } })
      setReminders(response.data?.data ?? [])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load reminders."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()
  }, [])

  useEffect(() => {
    const handleAuth = () => loadReminders()
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  const handleCreate = async () => {
    if (!authStorage.getToken()) {
      toast.info("Connect your account to create reminders.")
      return
    }
    if (!message.trim() || !scheduledAt) return
    try {
      const response = await api.post("/reminders", {
        message,
        scheduledAt,
      })
      setReminders((prev) => [response.data?.data, ...prev].filter(Boolean))
      setOpen(false)
      setMessage("")
      setScheduledAt("")
      toast.success("Reminder scheduled.")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create reminder."))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/reminders/${id}`)
      setReminders((prev) => prev.filter((reminder) => reminder.id !== id))
      toast.success("Reminder deleted.")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete reminder."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[#1c2433]">Reminders</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#000000] text-white text-sm font-medium rounded-xl hover:bg-[#1c2433] transition-colors shadow-sm">
              <Bell className="h-4 w-4" /> Add Reminder
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Create reminder</DialogTitle>
              <DialogDescription>Schedule a follow-up on your capture.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reminder-message">Message</Label>
                <Input
                  id="reminder-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Review the quarterly report"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reminder-time">When</Label>
                <Input
                  id="reminder-time"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!message.trim() || !scheduledAt}
                className="w-full py-2.5 bg-[#000000] text-white text-sm font-medium rounded-lg hover:bg-[#1c2433] transition-colors disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!authStorage.getToken() ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
          Connect your account to manage reminders.
        </div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Loading reminders...</div>
      ) : reminders.length ? (
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="border-border/60 bg-card/60 backdrop-blur">
              <CardContent className="flex items-center gap-4 p-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="font-semibold">{reminder.message}</h4>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(new Date(reminder.scheduledAt), "PPP p")}
                  </div>
                </div>
                <Badge variant={reminder.status === "PENDING" ? "secondary" : "outline"}>
                  {reminder.status.toLowerCase()}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(reminder.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
          No reminders scheduled yet.
        </div>
      )}
    </div>
  )
}
