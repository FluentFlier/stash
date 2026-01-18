"use client"

import * as React from "react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"

type CalendarEvent = {
  id?: string
  summary?: string
  description?: string
  htmlLink?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  syncStatus?: string
}

type ConnectionStatus = {
  connected: boolean
  provider?: string
}

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>({ connected: false })

  const loadConnectionStatus = async () => {
    if (!authStorage.getToken()) return
    try {
      const response = await api.get("/calendar/status")
      setConnectionStatus(response.data?.data ?? { connected: false })
    } catch (error: unknown) {
      console.error("Failed to load connection status:", error)
    }
  }

  const loadEvents = async () => {
    if (!authStorage.getToken()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get("/calendar/events", { params: { maxResults: 50 } })
      setEvents(response.data?.data ?? [])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to load calendar events."))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadConnectionStatus()
    loadEvents()
  }, [])

  React.useEffect(() => {
    const handleAuth = () => {
      loadConnectionStatus()
      loadEvents()
    }
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  // Handle message from OAuth popup
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_CALENDAR_CONNECTED") {
        toast.success("Google Calendar connected!")
        loadConnectionStatus()
        handleSync() // Sync immediately after connecting
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const handleConnect = async () => {
    if (!authStorage.getToken()) {
      toast.info("Connect your account to start Google OAuth.")
      return
    }
    try {
      const response = await api.get("/calendar/auth/url")
      const url = response.data?.authUrl
      if (url) {
        window.open(url, "google-oauth", "width=500,height=600,noopener")
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to start Google OAuth."))
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.delete("/calendar/disconnect")
      setConnectionStatus({ connected: false })
      toast.success("Google Calendar disconnected.")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to disconnect Google Calendar."))
    }
  }

  const handleSync = async () => {
    if (!connectionStatus.connected) {
      toast.info("Connect Google Calendar first to sync.")
      return
    }
    setSyncing(true)
    try {
      const response = await api.post("/calendar/sync")
      const data = response.data?.data
      if (data) {
        toast.success(`Synced: ${data.pushed} pushed, ${data.pulled.added} added, ${data.pulled.updated} updated`)
      }
      loadEvents()
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to sync calendar."))
    } finally {
      setSyncing(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!authStorage.getToken()) {
      toast.info("Connect your account to create events.")
      return
    }
    if (!title.trim() || !startTime || !endTime) return
    try {
      const response = await api.post("/calendar/events", {
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      })
      if (response.data?.data) {
        toast.success("Event created!")
        setOpen(false)
        setTitle("")
        setStartTime("")
        setEndTime("")
        loadEvents()
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create event."))
    }
  }

  const filteredEvents = events.filter((event) => {
    if (!date) return true
    const eventDate = new Date(event.start?.dateTime || event.start?.date || "")
    return eventDate.toDateString() === date.toDateString()
  })

  const getSyncBadge = (status?: string) => {
    switch (status) {
      case "synced":
        return <Badge variant="default" className="ml-2 text-xs bg-green-500">Synced</Badge>
      case "pending":
        return <Badge variant="secondary" className="ml-2 text-xs">Pending</Badge>
      case "error":
        return <Badge variant="destructive" className="ml-2 text-xs">Error</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
          {connectionStatus.connected ? (
            <Badge variant="default" className="bg-green-600">
              <span className="mr-1">●</span> Google Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not Connected
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {connectionStatus.connected ? (
            <>
              <Button variant="outline" onClick={handleSync} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button variant="ghost" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleConnect}>
              Connect Google
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>New calendar event</DialogTitle>
                <DialogDescription>
                  {connectionStatus.connected
                    ? "This event will sync to Google Calendar."
                    : "Connect Google Calendar to sync events."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="event-title">Title</Label>
                  <Input
                    id="event-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Team sync"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-start">Start</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-end">End</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
                <Button onClick={handleCreateEvent} disabled={!title.trim() || !startTime || !endTime}>
                  Create event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={loadEvents}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Events for {date?.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!authStorage.getToken() ? (
              <div className="text-sm text-muted-foreground">
                Connect your account to sync Google Calendar.
              </div>
            ) : loading ? (
              <div className="text-sm text-muted-foreground">Loading events...</div>
            ) : filteredEvents.length ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const start = new Date(event.start?.dateTime || event.start?.date || "")
                  const end = new Date(event.end?.dateTime || event.end?.date || "")
                  return (
                    <div key={event.id} className="border-l-4 border-primary pl-4 py-2">
                      <div className="flex items-center">
                        <span className="font-semibold">{event.summary ?? "Untitled event"}</span>
                        {getSyncBadge(event.syncStatus)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isNaN(start.getTime())
                          ? "Time TBD"
                          : `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No events for this day.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
