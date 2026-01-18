"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, ListTodo, Bell, Activity, Zap, Brain, Sparkles, ArrowRight } from "lucide-react";
import { OverviewChart } from "@/components/overview-chart";
import { motion } from "framer-motion";
import { GradientText } from "@/components/ui/gradient-text";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

export function DashboardClient() {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-4xl font-extrabold tracking-tight">
                Welcome back, <GradientText>Creator</GradientText>
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
                Your second brain is active and processing.
            </p>
        </div>
        <div className="flex gap-3">
             <Button className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                <Brain className="mr-2 h-4 w-4" /> New Capture
             </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Memories
                </CardTitle>
                <Inbox className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">128</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="text-green-500 font-medium flex items-center mr-1">
                     <Zap className="h-3 w-3 mr-0.5" /> +19%
                  </span>
                  from last month
                </p>
            </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Actions
                </CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">4</div>
                <p className="text-xs text-muted-foreground mt-1">
                Requires attention
                </p>
            </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reminders</CardTitle>
                <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">2</div>
                <p className="text-xs text-muted-foreground mt-1">
                Scheduled for today
                </p>
            </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="cursor-pointer">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                Collections
                </CardTitle>
                <ListTodo className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">
                Active projects
                </p>
            </CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="h-full border-border/50 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Neural Activity</CardTitle>
              <CardDescription>
                Weekly processing volume across all agents.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <OverviewChart />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item} className="col-span-3">
          <Card className="h-full border-border/50 bg-card/40 backdrop-blur-md">
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
                <div className="space-y-8">
                    {[
                        { title: "Analyzed 'The Future of AI'", desc: "Extracted 5 key insights", time: "2h ago", icon: Brain, color: "text-pink-500", bg: "bg-pink-500/10" },
                        { title: "Scheduled Meeting", desc: "Added to Calendar for Tue", time: "4h ago", icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { title: "Organized Collection", desc: "Grouped 4 items into 'React'", time: "Yesterday", icon: ListTodo, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { title: "Voice Transcribed", desc: "Processed 5m audio note", time: "Yesterday", icon: Activity, color: "text-green-500", bg: "bg-green-500/10" }
                    ].map((act, i) => (
                        <div key={i} className="flex items-center group cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${act.bg} ${act.color}`}>
                                <act.icon className="h-5 w-5" />
                            </div>
                            <div className="ml-4 space-y-1 flex-1">
                                <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">{act.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {act.desc}
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground">{act.time}</div>
                        </div>
                    ))}
                </div>
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
