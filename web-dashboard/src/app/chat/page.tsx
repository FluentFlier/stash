"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Send, Sparkles, User, Copy, Trash2 } from "lucide-react"

import api, { authStorage } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { GradientText } from "@/components/ui/gradient-text"

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'code';
  language?: string;
}

type ChatHistoryItem = {
  id: string
  role: "USER" | "ASSISTANT"
  content: string
}
const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your Stash assistant. I can help you find saved content, summarize articles, and organize your collections. What should we do next?",
  type: "text",
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAuthed = Boolean(authStorage.getToken())

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  useEffect(() => {
    const loadHistory = async () => {
      const token = authStorage.getToken()
      if (!token) {
        setMessages([welcomeMessage])
        setLoadingHistory(false)
        return
      }
      try {
        const response = await api.get("/chat/history", { params: { limit: 50, offset: 0 } })
        const history = (response.data?.data ?? []) as ChatHistoryItem[]
        if (!history.length) {
          setMessages([welcomeMessage])
        } else {
          setMessages(
            history.map((message) => ({
              id: message.id,
              role: message.role === "USER" ? "user" : "assistant",
              content: message.content,
              type: "text",
            }))
          )
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to load history."))
        setMessages([welcomeMessage])
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [])

  useEffect(() => {
    const handleAuth = () => window.location.reload()
    window.addEventListener("stash:auth-updated", handleAuth)
    return () => window.removeEventListener("stash:auth-updated", handleAuth)
  }, [])

  const handleSend = () => {
    if (!inputValue.trim()) return
    if (!isAuthed) {
      toast.info("Connect your account to chat with the agent.")
      return
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      type: "text",
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setIsTyping(true)

    api
      .post("/chat", { message: newMessage.content })
      .then((response) => {
        const aiResponse: Message = {
          id: `${Date.now()}-ai`,
          role: "assistant",
          content: response.data?.message ?? "No response available yet.",
          type: "text",
        }
        setMessages((prev) => [...prev, aiResponse])
      })
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error, "Chat request failed."))
      })
      .finally(() => setIsTyping(false))
  }

  const handleClear = async () => {
    if (!isAuthed) return
    try {
      await api.delete("/chat/history")
      setMessages([welcomeMessage])
      toast.success("Chat history cleared.")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to clear chat."))
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <GradientText>Assistant</GradientText>
        </h2>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={handleClear}>
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-md">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6 pb-4">
            <AnimatePresence>
              {loadingHistory ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                  Loading conversation...
                </motion.div>
              ) : null}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className={`h-8 w-8 shrink-0 ${message.role === 'assistant' ? 'bg-[#f1f5fb] border border-[#e6ebf4]' : 'bg-[#e6ebf4]'}`}>
                    <AvatarFallback className="flex items-center justify-center">
                      {message.role === 'assistant' ? <Sparkles className="h-4 w-4 text-[#000000]" /> : <User className="h-4 w-4 text-[#55607a]" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {message.type === 'code' ? (
                      <div className="rounded-xl overflow-hidden w-full shadow-lg border border-border/50 mt-1">
                        <div className="bg-muted/50 backdrop-blur px-4 py-2 text-xs text-muted-foreground border-b flex items-center justify-between">
                          <span className="font-mono">{message.language}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <SyntaxHighlighter
                          language={message.language || 'javascript'}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: '1rem' }}
                        >
                          {message.content}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <div
                        className={`p-3.5 rounded-2xl text-sm shadow-sm backdrop-blur-sm ${message.role === 'user'
                          ? 'bg-primary/90 text-primary-foreground rounded-tr-none'
                          : 'bg-muted/50 border border-border/50 rounded-tl-none'
                          }`}
                      >
                        {message.content}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="h-8 w-8 shrink-0 bg-[#f1f5fb] border border-[#e6ebf4]">
                    <AvatarFallback className="flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-[#000000]" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 border border-border/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-10">
                    <span className="block h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="block h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="block h-1.5 w-1.5 rounded-full bg-primary/50 animate-bounce"></span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-background/50 border-t border-border/50 backdrop-blur">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 relative max-w-4xl mx-auto"
          >
            <Input
              placeholder={isAuthed ? "Ask Stash anything..." : "Connect your account to chat"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!isAuthed}
              className="pr-12 py-6 bg-background/50 border-primary/20 focus-visible:ring-primary/30 rounded-xl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || !isAuthed}
              className="absolute right-1 top-1.5 h-9 w-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
