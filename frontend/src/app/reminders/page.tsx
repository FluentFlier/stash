import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, Calendar as CalendarIcon } from "lucide-react"

const reminders = [
    { id: 1, title: "Review quarterly report", due: "Today, 2:00 PM", priority: "high" },
    { id: 2, title: "Call John about the API", due: "Tomorrow, 10:00 AM", priority: "medium" },
    { id: 3, title: "Update subscription", due: "Oct 30, 2023", priority: "low" },
]

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reminders</h2>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Reminder
        </Button>
      </div>
      
      <div className="space-y-4">
        {reminders.map((reminder) => (
            <Card key={reminder.id}>
                <CardContent className="flex items-center p-4">
                    <Bell className="h-5 w-5 text-muted-foreground mr-4" />
                    <div className="flex-1">
                        <h4 className="font-semibold">{reminder.title}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {reminder.due}
                        </div>
                    </div>
                    <div>
                        <Badge variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}>
                            {reminder.priority}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  )
}
