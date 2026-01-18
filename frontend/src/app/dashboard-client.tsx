"use client"

import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import {
  Inbox,
  ListTodo,
  Bell,
  Activity,
  Zap,
  Brain,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { OverviewChart } from "@/components/overview-chart"
import { GradientText } from "@/components/ui/gradient-text"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuickCaptureDialog } from "@/components/quick-capture-dialog"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { y: 18, opacity: 0 },
  show: { y: 0, opacity: 1 },
}

type CaptureItem = {
  id: string
  type: string
  content: string
  createdAt: string
  processingStatus: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED"
}

export function DashboardClient() {
  const [captures, setCaptures] = useState<CaptureItem[]>([])
  const [reminderTotal, setReminderTotal] = useState(0)
  const [collectionTotal, setCollectionTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    const token = authStorage.getToken()
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [captureResponse, reminderResponse, collectionResponse] = await Promise.all([
        api.get("/captures", { params: { limit: 50, offset: 0 } }),
        api.get("/reminders", { params: { limit: 1, offset: 0 } }),
        api.get("/collections"),
      ])
      const captureData = captureResponse.data?.data ?? []
      setCaptures(captureData)
      setReminderTotal(reminderResponse.data?.pagination?.total ?? 0)
      setCollectionTotal(collectionResponse.data?.data?.length ?? 0)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to load dashboard data."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    const handleAuth = () => loadDashboard()
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  const weeklyData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const counts = Array.from({ length: 7 }, () => 0)
    captures.forEach((capture) => {
      const date = new Date(capture.createdAt)
      const dayIndex = (date.getDay() + 6) % 7
      counts[dayIndex] += 1
    })
    return labels.map((label, index) => ({ name: label, total: counts[index] }))
  }, [captures])

  const pendingCount = captures.filter((capture) => capture.processingStatus !== "PROCESSED").length
  const processedCount = captures.filter((capture) => capture.processingStatus === "PROCESSED").length

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Mission Control</p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Welcome back, <GradientText>Creator</GradientText>
          </h2>
          <p className="text-muted-foreground text-lg">
            Your agent swarm is working through your latest ideas and plans.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <QuickCaptureDialog onCreated={loadDashboard} />
          <Button variant="outline" className="gap-2">
            <Brain className="h-4 w-4" />
            Launch Agent
          </Button>
        </div>
      </div>

      {!authStorage.getToken() && (
        <motion.div variants={item}>
          <Card className="border-dashed border-primary/40 bg-background/70 backdrop-blur">
            <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">No account connected.</p>
                <p className="text-lg font-semibold">Sign in to sync your captures, reminders, and agent output.</p>
              </div>
              <Button
                className="gap-2"
                onClick={() => window.dispatchEvent(new Event("stash:open-auth"))}
              >
                <Zap className="h-4 w-4" />
                Connect to Stash
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/70 backdrop-blur-sm shadow-xl shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Memories
                </CardTitle>
                <Inbox className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{captures.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="text-green-500 font-medium flex items-center mr-1">
                     <Zap className="h-3 w-3 mr-0.5" /> {processedCount} processed
                  </span>
                  in the last 50 captures
                </p>
            </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/70 backdrop-blur-sm shadow-xl shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Actions
                </CardTitle>
                <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                Waiting for agent processing
                </p>
            </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/70 backdrop-blur-sm shadow-xl shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reminders</CardTitle>
                <Bell className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{reminderTotal}</div>
                <p className="text-xs text-muted-foreground mt-1">
                Active reminders
                </p>
            </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/70 backdrop-blur-sm shadow-xl shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Collections
                </CardTitle>
                <ListTodo className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{collectionTotal}</div>
                <p className="text-xs text-muted-foreground mt-1">
                Active projects
                </p>
            </CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="h-full border-border/50 bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Neural Activity</CardTitle>
              <CardDescription>Weekly processing volume across all agents.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <OverviewChart data={weeklyData} />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item} className="col-span-3">
          <Card className="h-full border-border/50 bg-card/60 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Agent Log
                </CardTitle>
                <CardDescription>
                Latest autonomous actions performed.
                </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4 text-sm text-muted-foreground">Loading agent feed...</div>
              ) : captures.length ? (
                <div className="space-y-5">
                  {captures.slice(0, 4).map((capture) => (
                    <div
                      key={capture.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="h-10 w-10 rounded-full border border-border/60 bg-primary/10 text-primary flex items-center justify-center">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold leading-none">
                          {capture.content.slice(0, 48)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {capture.type} • {capture.processingStatus.toLowerCase()}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(capture.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  No captures yet. Queue your first memory to see agent activity.
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}
              <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground hover:text-primary">
                View Full Log <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </CardContent>
            </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
