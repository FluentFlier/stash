"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar as CalendarIcon,
  Clock, ExternalLink
} from "lucide-react"
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Event colors for variety
const EVENT_COLORS = [
  { bg: '#4285f4', text: '#ffffff' }, // Google Blue
  { bg: '#0f9d58', text: '#ffffff' }, // Green
  { bg: '#f4b400', text: '#000000' }, // Yellow
  { bg: '#db4437', text: '#ffffff' }, // Red
  { bg: '#673ab7', text: '#ffffff' }, // Purple
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date())
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
      const response = await api.get("/calendar/events", { params: { maxResults: 50 } })
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

  // Navigation
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Calendar grid generation
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date || "")
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString()
  }

  const days = getDaysInMonth(currentDate)
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        className="flex flex-wrap items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-[#1c2433]">Calendar</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-[#f1f5fb] rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-[#55607a]" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-[#f1f5fb] rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-[#55607a]" />
            </button>
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1.5 text-sm font-medium text-[#1c2433] hover:bg-[#f1f5fb] rounded-lg transition-colors border border-[#e6ebf4]"
            >
              Today
            </button>
          </div>
          <span className="text-xl font-semibold text-[#1c2433]">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium text-[#55607a] hover:bg-[#f1f5fb] rounded-lg transition-colors border border-[#e6ebf4]"
          >
            Connect Google
          </button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#000000] text-white text-sm font-medium rounded-lg hover:bg-[#1c2433] transition-colors">
                <Plus className="h-4 w-4" />
                Create Event
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-[#f8faff] rounded-2xl border border-[#e6ebf4]">
              <DialogTitle className="sr-only">Create New Event</DialogTitle>
              {/* Header with black accent */}
              <div className="bg-[#000000] p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">New Event</h3>
                    <p className="text-sm text-white/70">Sync to Google Calendar</p>
                  </div>
                </div>
              </div>

              {/* Form content */}
              <div className="p-5 space-y-4">
                {/* Title field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1c2433]">Event Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Team sync, Project review..."
                    className="w-full px-4 py-3 bg-[#f1f5fb] border border-[#e6ebf4] rounded-xl text-[#1c2433] placeholder:text-[#7b879f] focus:outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]/10 transition-all"
                  />
                </div>

                {/* Time fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1c2433] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#22c55e]" />
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f1f5fb] border border-[#e6ebf4] rounded-xl text-[#1c2433] text-sm focus:outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1c2433] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#f59e0b]" />
                      End
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="w-full px-3 py-2.5 bg-[#f1f5fb] border border-[#e6ebf4] rounded-xl text-[#1c2433] text-sm focus:outline-none focus:border-[#000000] focus:ring-1 focus:ring-[#000000]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-[#55607a] hover:bg-[#e6ebf4] rounded-xl transition-colors border border-[#e6ebf4]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEvent}
                    disabled={!title.trim() || !startTime || !endTime}
                    className="flex-1 py-2.5 bg-[#000000] text-white text-sm font-semibold rounded-xl hover:bg-[#1c2433] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <button
            onClick={loadEvents}
            className="p-2 hover:bg-[#f1f5fb] rounded-lg transition-colors border border-[#e6ebf4]"
          >
            <RefreshCw className="h-5 w-5 text-[#55607a]" />
          </button>
        </div>
      </motion.div>

      {/* Main Grid: Calendar + Events Sidebar */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar Grid */}
        <motion.div
          className="bg-white rounded-2xl border border-[#e6ebf4] shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-[#e6ebf4]">
            {DAYS.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold text-[#55607a] uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r border-[#e6ebf4] bg-[#fafbfc]" />
              }

              const dayEvents = getEventsForDate(date)
              const today = isToday(date)
              const selected = isSelected(date)

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    min-h-[100px] p-2 border-b border-r border-[#e6ebf4] cursor-pointer transition-colors
                    ${selected ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8faff]'}
                  `}
                >
                  <div className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1
                    ${today ? 'bg-[#4285f4] text-white' : 'text-[#1c2433]'}
                  `}>
                    {date.getDate()}
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, i) => {
                      const color = EVENT_COLORS[i % EVENT_COLORS.length]
                      return (
                        <div
                          key={event.id}
                          className="text-xs px-1.5 py-0.5 rounded truncate font-medium"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {event.summary || 'Untitled'}
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-[#55607a] font-medium px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Events Sidebar */}
        <motion.div
          className="bg-white rounded-2xl border border-[#e6ebf4] shadow-sm p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="h-5 w-5 text-[#4285f4]" />
            <h3 className="text-lg font-semibold text-[#1c2433]">
              {selectedDate ? (
                <>
                  {MONTHS[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                </>
              ) : 'Select a date'}
            </h3>
          </div>

          {!authStorage.getToken() ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[#f1f5fb] rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="h-6 w-6 text-[#7b879f]" />
              </div>
              <p className="text-sm text-[#55607a] mb-3">Connect your Google account to sync events</p>
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-[#4285f4] text-white text-sm font-medium rounded-lg hover:bg-[#3367d6] transition-colors"
              >
                Connect Google Calendar
              </button>
            </div>
          ) : loading ? (
            <div className="text-sm text-[#7b879f] py-4">Loading events...</div>
          ) : selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event, i) => {
                const color = EVENT_COLORS[i % EVENT_COLORS.length]
                const start = new Date(event.start?.dateTime || event.start?.date || "")
                const end = new Date(event.end?.dateTime || event.end?.date || "")

                return (
                  <div
                    key={event.id}
                    className="p-3 rounded-xl border-l-4"
                    style={{ borderColor: color.bg, backgroundColor: `${color.bg}10` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1c2433] truncate">{event.summary || 'Untitled event'}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-[#55607a]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {isNaN(start.getTime())
                              ? "All day"
                              : `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                        </div>
                      </div>
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-white rounded-md transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-[#7b879f]" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[#f1f5fb] rounded-full flex items-center justify-center mx-auto mb-3">
                <CalendarIcon className="h-6 w-6 text-[#7b879f]" />
              </div>
              <p className="text-sm text-[#55607a]">No events for this day</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
