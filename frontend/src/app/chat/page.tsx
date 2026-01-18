"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Sparkles, User, Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState, useRef, useEffect } from "react"
import { GradientText } from "@/components/ui/gradient-text"

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'code';
    language?: string;
}

const initialMessages: Message[] = [
    {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Stash assistant. I can help you find your saved content, summarize articles, or organize your collections. What's on your mind?",
        type: 'text'
    },
    {
        id: '2',
        role: 'user',
        content: "Can you find that code snippet I saved about React hooks?",
        type: 'text'
    },
    {
        id: '3',
        role: 'assistant',
        content: "I found a snippet titled 'Custom useFetch Hook' in your 'React Patterns' collection. Here it is:",
        type: 'text'
    },
    {
        id: '4',
        role: 'assistant',
        content: `export const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(d => {
          setData(d);
          setLoading(false);
      });
  }, [url]);

  return { data, loading };
}`,
        type: 'code',
        language: 'javascript'
    }
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue,
        type: 'text'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
        const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I'm processing your request... (This is a simulated response)",
            type: 'text'
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <GradientText>Assistant</GradientText>
        </h2>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-md">
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-6 pb-4">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div 
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <Avatar className={`h-8 w-8 ring-2 ring-offset-2 ring-offset-background ${message.role === 'assistant' ? 'bg-primary/20 ring-primary/20' : 'bg-muted ring-muted'}`}>
                                <AvatarFallback className={message.role === 'assistant' ? 'text-primary' : ''}>
                                    {message.role === 'assistant' ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {message.type === 'code' ? (
                                    <div className="rounded-xl overflow-hidden w-full shadow-lg border border-border/50 mt-1">
                                        <div className="bg-muted/50 backdrop-blur px-4 py-2 text-xs text-muted-foreground border-b flex items-center justify-between">
                                            <span className="font-mono">{message.language}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
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
                                        className={`p-3.5 rounded-2xl text-sm shadow-sm backdrop-blur-sm ${
                                            message.role === 'user' 
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
                            <Avatar className="h-8 w-8 bg-primary/20 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                                <AvatarFallback className="text-primary">
                                    <Sparkles className="h-4 w-4" />
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
                    placeholder="Ask Stash anything..." 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pr-12 py-6 bg-background/50 border-primary/20 focus-visible:ring-primary/30 rounded-xl"
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!inputValue.trim()}
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
