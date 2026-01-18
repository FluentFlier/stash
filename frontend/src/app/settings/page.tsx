"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Copy, LogOut } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UserProfile = { id: string; email: string; name?: string | null }

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(authStorage.getUser())
  const [fcmToken, setFcmToken] = useState("")

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) return
    api
      .get("/auth/me")
      .then((response) => {
        if (response.data?.data) {
          authStorage.setUser(response.data.data)
          setUser(response.data.data)
        }
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    const handleAuth = () => setUser(authStorage.getUser())
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  const handleCopyToken = () => {
    const token = authStorage.getToken()
    if (!token) return
    navigator.clipboard.writeText(token)
    toast.success("Token copied.")
  }

  const handleSignOut = () => {
    authStorage.clearToken()
    authStorage.clearUser()
    setUser(null)
    toast.info("Signed out.")
  }

  const handleUpdateFcm = async () => {
    if (!authStorage.getToken()) {
      toast.info("Connect your account to update FCM tokens.")
      return
    }
    if (!fcmToken.trim()) return
    try {
      await api.post("/auth/fcm-token", { fcmToken })
      toast.success("FCM token updated.")
      setFcmToken("")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update FCM token."))
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your session and access details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user ? (
            <>
              <div className="text-sm text-muted-foreground">Signed in as</div>
              <div className="text-lg font-semibold">{user.name || user.email}</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyToken}>
                  <Copy className="h-4 w-4" />
                  Copy token
                </Button>
                <Button variant="ghost" size="sm" className="gap-2" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Connect your account to manage settings.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Update your Firebase Cloud Messaging token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="fcm-token">FCM Token</Label>
            <Input
              id="fcm-token"
              value={fcmToken}
              onChange={(event) => setFcmToken(event.target.value)}
              placeholder="Paste your FCM token"
            />
          </div>
          <Button onClick={handleUpdateFcm} disabled={!fcmToken.trim()}>
            Update token
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
