"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Folder, Sparkles, Trash2 } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Collection = {
  id: string
  name: string
  description?: string | null
  type: "MANUAL" | "SMART"
  createdAt: string
  _count?: { captures: number }
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<Collection["type"]>("MANUAL")
  const [loading, setLoading] = useState(true)

  const loadCollections = async () => {
    if (!authStorage.getToken()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await api.get("/collections")
      setCollections(response.data?.data ?? [])
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load collections."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollections()
  }, [])

  useEffect(() => {
    const handleAuth = () => loadCollections()
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  const handleCreate = async () => {
    if (!authStorage.getToken()) {
      toast.info("Connect your account to create collections.")
      return
    }
    if (!name.trim()) return
    try {
      const response = await api.post("/collections", {
        name,
        description: description || undefined,
        type,
      })
      setCollections((prev) => [response.data?.data, ...prev].filter(Boolean))
      setName("")
      setDescription("")
      setType("MANUAL")
      setOpen(false)
      toast.success("Collection created.")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create collection."))
    }
  }

  const handleDelete = async (collectionId: string) => {
    if (!authStorage.getToken()) return
    try {
      await api.delete(`/collections/${collectionId}`)
      setCollections((prev) => prev.filter((collection) => collection.id !== collectionId))
      toast.success("Collection deleted.")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete collection."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" /> Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>New collection</DialogTitle>
              <DialogDescription>Organize captures into thematic vaults.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="collection-name">Name</Label>
                <Input
                  id="collection-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Product strategy"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collection-desc">Description</Label>
                <Textarea
                  id="collection-desc"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Notes and research for the next release."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="collection-type">Type</Label>
                <select
                  id="collection-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as Collection["type"])}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="SMART">Smart</option>
                </select>
              </div>
              <Button onClick={handleCreate} disabled={!name.trim()}>
                Create collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {!authStorage.getToken() ? (
        <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
          Connect your account to view collections.
        </div>
      ) : loading ? (
        <div className="text-sm text-muted-foreground">Loading collections...</div>
      ) : collections.length ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {collections.map((collection) => (
            <Card key={collection.id} className="group hover:bg-accent/40 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{collection.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {collection._count?.captures ?? 0} items
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(collection.createdAt), { addSuffix: true })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 hidden w-full justify-between text-xs group-hover:flex"
                  onClick={() => handleDelete(collection.id)}
                >
                  Delete
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
          No collections yet. Create one to organize your captures.
        </div>
      )}
    </div>
  )
}
