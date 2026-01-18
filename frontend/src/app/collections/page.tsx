import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, Plus } from "lucide-react"

const collections = [
    { title: "Work Projects", count: 12, date: "2 days ago" },
    { title: "Reading List", count: 5, date: "1 week ago" },
    { title: "Travel Plans", count: 8, date: "3 days ago" },
    { title: "Recipes", count: 24, date: "1 month ago" },
]

export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Collection
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {collections.map((collection) => (
            <Card key={collection.title} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">{collection.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        {collection.count} items
                    </div>
                     <div className="text-xs text-muted-foreground mt-2">
                        Updated {collection.date}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  )
}
