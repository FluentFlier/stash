"use client"

import { motion } from 'framer-motion'
import {
  TrendingUp, Calendar, Clock, Target, Brain,
  ChevronRight, Sparkles, Bell, Tag, ArrowUpRight,
  RefreshCw, AlertCircle
} from 'lucide-react'

// Mock data matching mobile app
const todayStats = {
  itemsSaved: 8,
  aiQueries: 12,
  eventsDetected: 3,
  timeSpent: '45m',
}

const weeklyProgress = [
  { day: 'Mon', value: 5 },
  { day: 'Tue', value: 8 },
  { day: 'Wed', value: 3 },
  { day: 'Thu', value: 12 },
  { day: 'Fri', value: 7 },
  { day: 'Sat', value: 4 },
  { day: 'Sun', value: 8 },
]

const upcomingActions = [
  { id: '1', title: 'Team meeting', time: 'Today, 3:00 PM', type: 'event', source: 'Detected from email' },
  { id: '2', title: 'Review saved articles', time: 'Tomorrow, 9:00 AM', type: 'reminder', source: 'AI suggestion' },
  { id: '3', title: 'Project deadline', time: 'Fri, Jan 24', type: 'deadline', source: 'From calendar' },
]

const recentTopics = [
  { id: '1', name: 'React Native', count: 12, trend: '+3' },
  { id: '2', name: 'AI/ML', count: 8, trend: '+5' },
  { id: '3', name: 'Product Design', count: 6, trend: '+1' },
]

const pendingApprovals = [
  { id: '1', action: 'Create calendar event', title: '"Team standup" on Jan 20, 10am', icon: Calendar },
  { id: '2', action: 'Set reminder', title: 'Follow up on article in 1 week', icon: Bell },
]

const aiDigest = {
  summary: "This week you've focused heavily on React Native development and AI integration. 3 deadlines detected from your saved content.",
  highlights: [
    'Saved 40% more links than last week',
    'Most active between 2-4 PM',
    '3 potential follow-ups identified',
  ],
}

// Animation variants for staggered entrance
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: delay * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
}

export default function DashboardClient() {
  const maxValue = Math.max(...weeklyProgress.map(d => d.value))

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#1c2433]">Good evening</h1>
          <p className="text-sm text-[#7b879f] mt-1">Friday, Jan 17</p>
        </div>
        <button className="w-11 h-11 bg-white rounded-xl border border-[#e6ebf4] flex items-center justify-center hover:bg-[#f1f5fb] transition-colors shadow-sm">
          <RefreshCw className="h-5 w-5 text-[#7b879f]" />
        </button>
      </motion.div>

      {/* Main Grid Layout - 3 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - AI Digest + Approvals + Activity/Topics (spans 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* AI Digest Card - Index 0 */}
          <motion.div
            className="bg-[#000000] rounded-2xl p-6 space-y-4"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">AI Daily Digest</span>
            </div>
            <p className="text-base text-white/90 leading-relaxed">{aiDigest.summary}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {aiDigest.highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="text-sm text-white/85">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pending Approvals - Index 1 */}
          {pendingApprovals.length > 0 && (
            <motion.div
              className="bg-[rgba(245,158,11,0.12)] border border-[#f59e0b] rounded-2xl p-5 space-y-4"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#f59e0b]" />
                <span className="text-base font-semibold text-[#1c2433]">Needs Your Approval</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-11 h-11 bg-[#f1f5fb] rounded-xl flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-[#000000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#7b879f] mb-0.5">{item.action}</p>
                      <p className="text-sm text-[#1c2433] font-semibold truncate">{item.title}</p>
                    </div>
                    <button className="bg-[#000000] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1c2433] transition-colors">
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Row: Weekly Activity + Trending Topics - Equal Heights */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Weekly Activity - Index 2 */}
            <motion.div
              className="bg-white rounded-2xl border border-[#e6ebf4] p-6 shadow-sm flex flex-col"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-[#1c2433]">Weekly Activity</span>
                <div className="flex items-center gap-1.5 bg-[#22c55e]/10 px-2 py-1 rounded-md">
                  <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                  <span className="text-sm text-[#22c55e] font-medium">+24%</span>
                </div>
              </div>
              <div className="flex-1 flex justify-between items-end min-h-[120px]">
                {weeklyProgress.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <motion.div
                      className={`w-8 rounded-lg ${i === 6 ? 'bg-[#000000]' : 'bg-[#e6ebf4]'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.value / maxValue) * 80 + 20}px` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                    />
                    <span className="text-xs text-[#7b879f] font-medium">{day.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trending Topics - Index 3 */}
            <motion.div
              className="bg-white rounded-2xl border border-[#e6ebf4] p-6 shadow-sm flex flex-col"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <div className="flex items-center gap-2 mb-6">
                <Tag className="h-5 w-5 text-[#000000]" />
                <span className="text-lg font-semibold text-[#1c2433]">Trending Topics</span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                {recentTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between py-2">
                    <div className="bg-[#f1f5fb] px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium text-[#1c2433]">{topic.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#7b879f]">{topic.count} items</span>
                      <div className="flex items-center bg-[#22c55e]/10 px-1.5 py-0.5 rounded">
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#22c55e]" />
                        <span className="text-xs text-[#22c55e] font-medium">{topic.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column - Stats + Upcoming */}
        <div className="flex flex-col gap-6">
          {/* Stats Grid - 2x2 - Index 4-7 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Saved Today', value: todayStats.itemsSaved, icon: Target, color: '#000000' },
              { label: 'AI Queries', value: todayStats.aiQueries, icon: Brain, color: '#4f5dff' },
              { label: 'Events Found', value: todayStats.eventsDetected, icon: Calendar, color: '#22c55e' },
              { label: 'Time Saved', value: todayStats.timeSpent, icon: Clock, color: '#f59e0b' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-2xl border border-[#e6ebf4] p-5 shadow-sm"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={i + 4}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-bold text-[#1c2433]">{stat.value}</p>
                <p className="text-sm text-[#7b879f] mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Upcoming Actions - Index 8 */}
          <motion.div
            className="bg-white rounded-2xl border border-[#e6ebf4] p-6 shadow-sm flex-1"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={8}
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#f59e0b]" />
                <span className="text-lg font-semibold text-[#1c2433]">Upcoming</span>
              </div>
              <button className="text-sm text-[#000000] font-medium hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {upcomingActions.map((action, i) => (
                <motion.div
                  key={action.id}
                  className="bg-[#f1f5fb] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#e6ebf4] transition-colors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: action.type === 'deadline' ? '#ef4444' :
                        action.type === 'event' ? '#000000' : '#22c55e'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1c2433] font-semibold">{action.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#7b879f]">{action.time}</span>
                      <span className="text-xs text-[#7b879f]">•</span>
                      <span className="text-xs text-[#000000] font-medium">{action.source}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#7b879f] shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
