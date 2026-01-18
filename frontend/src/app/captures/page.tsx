import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Capture, columns } from "./columns"
import { DataTable } from "./data-table"

const captures: Capture[] = [
  {
    id: "1",
    content: "The Future of AI Agents",
    type: "LINK",
    status: "PROCESSED",
    date: "2023-10-25",
  },
  {
    id: "2",
    content: "Meeting notes - Project X",
    type: "TEXT",
    status: "PROCESSING",
    date: "2023-10-26",
  },
  {
    id: "3",
    content: "Invoice_INV-2023-001.pdf",
    type: "FILE",
    status: "PROCESSED",
    date: "2023-10-24",
  },
  {
    id: "4",
    content: "Screenshot of Dashboard Design",
    type: "IMAGE",
    status: "PROCESSED",
    date: "2023-10-23",
  },
  {
    id: "5",
    content: "Voice Note: Idea for new feature",
    type: "AUDIO",
    status: "FAILED",
    date: "2023-10-22",
  },
   {
    id: "6",
    content: "React Server Components Guide",
    type: "LINK",
    status: "PROCESSED",
    date: "2023-10-21",
  },
]

export default function CapturesPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Captures</h2>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Capture
        </Button>
      </div>
      <div className="flex-1">
        <DataTable columns={columns} data={captures} />
      </div>
    </div>
  )
}