"use client"

import { useState } from 'react'
import {
  Search, Grid, List, Star, Clock, ChevronDown,
  Link as LinkIcon, FileText, Image as ImageIcon, Video, Sparkles, X
} from 'lucide-react'

type EntryType = 'link' | 'note' | 'image' | 'video'
type SortMode = 'importance' | 'recent' | 'type'

interface MemoryEntry {
  id: string
  title: string
  type: EntryType
  importance: number
  timestamp: Date
  preview?: string
  tags: string[]
}

// Mock data matching mobile app
const mockEntries: MemoryEntry[] = [
  { id: '1', title: 'Product roadmap 2024', type: 'link', importance: 5, timestamp: new Date('2024-01-15'), preview: 'Key milestones and deliverables...', tags: ['work', 'planning'] },
  { id: '2', title: 'Meeting notes - Design review', type: 'note', importance: 4, timestamp: new Date('2024-01-16'), preview: 'Discussed new UI components...', tags: ['meeting', 'design'] },
  { id: '3', title: 'Architecture diagram', type: 'image', importance: 5, timestamp: new Date('2024-01-14'), tags: ['technical', 'reference'] },
  { id: '4', title: 'Demo video - Feature X', type: 'video', importance: 3, timestamp: new Date('2024-01-13'), tags: ['demo'] },
  { id: '5', title: 'Research: AI assistants', type: 'link', importance: 4, timestamp: new Date('2024-01-12'), preview: 'Comparison of AI tools...', tags: ['research', 'ai'] },
  { id: '6', title: 'Quick thought on pricing', type: 'note', importance: 2, timestamp: new Date('2024-01-11'), preview: 'Consider tiered pricing...', tags: ['idea'] },
  { id: '7', title: 'Competitor analysis', type: 'link', importance: 5, timestamp: new Date('2024-01-10'), preview: 'Market landscape overview...', tags: ['research', 'strategy'] },
  { id: '8', title: 'Onboarding flow mockup', type: 'image', importance: 4, timestamp: new Date('2024-01-09'), tags: ['design', 'ux'] },
]

const typeIcons = {
  link: LinkIcon,
  note: FileText,
  image: ImageIcon,
  video: Video,
}

const typeColors = {
  link: '#22c55e',
  note: '#f59e0b',
  image: '#000000',
  video: '#4f5dff',
}

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('importance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedType, setSelectedType] = useState<EntryType | null>(null)

  const filteredEntries = mockEntries
    .filter(entry => {
      const matchesSearch = searchQuery === '' ||
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesType = selectedType === null || entry.type === selectedType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'importance': return b.importance - a.importance
        case 'recent': return b.timestamp.getTime() - a.timestamp.getTime()
        case 'type': return a.type.localeCompare(b.type)
        default: return 0
      }
    })

  const renderStars = (level: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-2.5 w-2.5 ${i <= level ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#e6ebf4]'}`}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1c2433]">Memory</h1>
          <p className="text-sm text-[#7b879f] mt-1">{filteredEntries.length} items</p>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="w-10 h-10 bg-[#f1f5fb] rounded-[10px] border border-[#e6ebf4] flex items-center justify-center hover:bg-[#e6ebf4] transition-colors"
        >
          {viewMode === 'grid' ? <List className="h-5 w-5 text-[#1c2433]" /> : <Grid className="h-5 w-5 text-[#1c2433]" />}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-[#f1f5fb] rounded-[12px] border border-[#e6ebf4] px-3.5 gap-2.5">
        <Sparkles className="h-[18px] w-[18px] text-[#000000]" />
        <input
          type="text"
          placeholder="Semantic search your memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 py-3.5 text-[15px] bg-transparent text-[#1c2433] placeholder:text-[#7b879f] outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')}>
            <X className="h-[18px] w-[18px] text-[#7b879f]" />
          </button>
        )}
      </div>

      {/* Sort & Filter Bar */}
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        <button
          onClick={() => {
            const modes: SortMode[] = ['importance', 'recent', 'type']
            const currentIndex = modes.indexOf(sortMode)
            setSortMode(modes[(currentIndex + 1) % modes.length])
          }}
          className="flex items-center gap-1.5 bg-[#f1f5fb] px-3 py-2 rounded-[8px] border border-[#e6ebf4] shrink-0"
        >
          <Star className="h-3.5 w-3.5 text-[#000000]" />
          <span className="text-[13px] text-[#1c2433] font-medium">
            {sortMode === 'importance' ? 'By Importance' : sortMode === 'recent' ? 'Recent' : 'By Type'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#7b879f]" />
        </button>

        {(['link', 'note', 'image', 'video'] as EntryType[]).map(type => {
          const Icon = typeIcons[type]
          const isSelected = selectedType === type
          return (
            <button
              key={type}
              onClick={() => setSelectedType(isSelected ? null : type)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border shrink-0 transition-colors"
              style={{
                backgroundColor: isSelected ? `${typeColors[type]}20` : '#f1f5fb',
                borderColor: isSelected ? typeColors[type] : '#e6ebf4',
              }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: isSelected ? typeColors[type] : '#7b879f' }} />
              <span
                className="text-[13px] font-medium"
                style={{ color: isSelected ? typeColors[type] : '#7b879f' }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Entries Grid/List */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center py-10">
          <Search className="h-12 w-12 text-[#e6ebf4]" />
          <p className="text-base text-[#7b879f] mt-4">No memories found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredEntries.map(item => {
            const TypeIcon = typeIcons[item.type]
            return (
              <div key={item.id} className="bg-[#f1f5fb] rounded-[12px] border border-[#e6ebf4] p-3.5 cursor-pointer hover:border-[#d8deea] transition-colors">
                <div className="flex justify-between items-start mb-2.5">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${typeColors[item.type]}20` }}
                  >
                    <TypeIcon className="h-[18px] w-[18px]" style={{ color: typeColors[item.type] }} />
                  </div>
                  {renderStars(item.importance)}
                </div>
                <p className="text-sm font-semibold text-[#1c2433] mb-1.5 line-clamp-2">{item.title}</p>
                {item.preview && (
                  <p className="text-xs text-[#7b879f] mb-2 line-clamp-2">{item.preview}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-[#e6ebf4] px-2 py-0.5 rounded-[6px] text-[10px] text-[#7b879f]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map(item => {
            const TypeIcon = typeIcons[item.type]
            return (
              <div key={item.id} className="bg-[#f1f5fb] rounded-[12px] border border-[#e6ebf4] p-3.5 flex gap-3 cursor-pointer hover:border-[#d8deea] transition-colors">
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${typeColors[item.type]}20` }}
                >
                  <TypeIcon className="h-[22px] w-[22px]" style={{ color: typeColors[item.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-[15px] font-semibold text-[#1c2433] truncate">{item.title}</p>
                    {renderStars(item.importance)}
                  </div>
                  {item.preview && (
                    <p className="text-[13px] text-[#7b879f] mt-1 truncate">{item.preview}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-[#7b879f]" />
                      <span className="text-[11px] text-[#7b879f]">
                        {item.timestamp.toLocaleDateString('en-US')}
                      </span>
                    </div>
                    {item.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-[#e6ebf4] px-1.5 py-0.5 rounded text-[10px] text-[#7b879f]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
