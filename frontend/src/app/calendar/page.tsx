"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
      
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
                <div className="space-y-4">
                    {/* Mock events */}
                    <div className="border-l-4 border-primary pl-4 py-2">
                        <div className="font-semibold">Team Sync</div>
                        <div className="text-sm text-muted-foreground">10:00 AM - 11:00 AM</div>
                    </div>
                     <div className="border-l-4 border-muted pl-4 py-2">
                        <div className="font-semibold">Project Review</div>
                        <div className="text-sm text-muted-foreground">2:00 PM - 3:00 PM</div>
                    </div>
                    
                    {date?.getDate() === 25 && (
                         <div className="border-l-4 border-green-500 pl-4 py-2">
                            <div className="font-semibold">Payday</div>
                            <div className="text-sm text-muted-foreground">All Day</div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
