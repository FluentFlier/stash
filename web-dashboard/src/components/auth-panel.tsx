"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, LogIn, LogOut, UserRound } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AuthUser = { id: string; email: string; name?: string | null }

export function AuthPanel() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")

  useEffect(() => {
    const cachedUser = authStorage.getUser()
    const token = authStorage.getToken()
    if (cachedUser) {
      setUser(cachedUser)
    }
    if (token) {
      api
        .get("/auth/me")
        .then((response) => {
          if (response.data?.data) {
            authStorage.setUser(response.data.data)
            setUser(response.data.data)
          }
        })
        .catch(() => {
          authStorage.clearToken()
          authStorage.clearUser()
          setUser(null)
        })
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("stash:open-auth", handleOpen)
    return () => window.removeEventListener("stash:open-auth", handleOpen)
  }, [])

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return
    setLoading(true)
    try {
      const response = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      })
      const data = response.data?.data
      if (data?.token) {
        authStorage.setToken(data.token)
        authStorage.setUser(data.user)
        setUser(data.user)
        setOpen(false)
        toast.success("Signed in successfully.")
        window.dispatchEvent(new Event("stash:auth-updated"))
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Sign in failed."))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword || !registerName) return
    setLoading(true)
    try {
      const response = await api.post("/auth/register", {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      })
      const data = response.data?.data
      if (data?.token) {
        authStorage.setToken(data.token)
        authStorage.setUser(data.user)
        setUser(data.user)
        setOpen(false)
        toast.success("Account created.")
        window.dispatchEvent(new Event("stash:auth-updated"))
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Registration failed."))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    authStorage.clearToken()
    authStorage.clearUser()
    setUser(null)
    toast.info("Signed out.")
    window.dispatchEvent(new Event("stash:auth-updated"))
  }

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="hidden items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur md:flex">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <span className="truncate max-w-[140px]">{user.name || user.email}</span>
        </div>
      ) : null}
      {user ? (
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
              <LogIn className="h-4 w-4" />
              Connect
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserRound className="h-5 w-5 text-primary" />
                Stash Access
              </DialogTitle>
              <DialogDescription>
                Sign in or create an account to sync your captures and agents.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="you@stash.ai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button className="w-full" onClick={handleLogin} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </TabsContent>
              <TabsContent value="register" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    value={registerName}
                    onChange={(event) => setRegisterName(event.target.value)}
                    placeholder="Jane Creator"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="you@stash.ai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    placeholder="Create a strong password"
                  />
                </div>
                <Button className="w-full" onClick={handleRegister} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
