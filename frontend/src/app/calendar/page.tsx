"use client"

import * as React from "react"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"

type CalendarEvent = {
  id?: string
  summary?: string
  description?: string
  htmlLink?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [loading, setLoading] = React.useState(true)

  const loadEvents = async () => {
    if (!authStorage.getToken()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get("/calendar/events", { params: { maxResults: 20 } })
      setEvents(response.data?.data ?? [])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to load calendar events."))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadEvents()
  }, [])

  React.useEffect(() => {
    const handleAuth = () => loadEvents()
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
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
        window.open(url, "_blank", "noopener,noreferrer")
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to start Google OAuth."))
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
        toast.success("Event created in Google Calendar.")
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleConnect}>
            Connect Google
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>New calendar event</DialogTitle>
                <DialogDescription>Sync it straight to Google Calendar.</DialogDescription>
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
                        <div className="font-semibold">{event.summary ?? "Untitled event"}</div>
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
