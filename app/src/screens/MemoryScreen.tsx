import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Search,
    Filter,
    Grid,
    List,
    Star,
    Clock,
    Link as LinkIcon,
    FileText,
    Image as ImageIcon,
    Video,
    Calendar,
    ChevronDown,
    Sparkles,
    X
} from 'lucide-react-native';
import { theme } from '../theme';

type EntryType = 'link' | 'note' | 'image' | 'video';
type SortMode = 'importance' | 'recent' | 'type';

interface MemoryEntry {
    id: string;
    title: string;
    type: EntryType;
    importance: number; // 1-5 scale, AI-determined
    timestamp: Date;
    preview?: string;
    tags: string[];
}

// Real data only


const typeIcons: Record<EntryType, typeof LinkIcon> = {
    link: LinkIcon,
    note: FileText,
    image: ImageIcon,
    video: Video,
};

const typeColors: Record<EntryType, string> = {
    link: theme.success,
    note: theme.warning,
    image: theme.primary,
    video: theme.accent,
};

export const MemoryScreen: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('importance');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedType, setSelectedType] = useState<EntryType | null>(null);

    // Real Data State
    const [entries, setEntries] = useState<MemoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadCaptures();
        }, [])
    );

    const loadCaptures = async () => {
        try {
            const response = await api.getCaptures(100); // Fetch last 100
            if (response.success && response.data) {
                const mapped = response.data.map((c: any) => ({
                    id: c.id,
                    title: c.title || (c.type === 'link' ? 'Saved Link' : 'Untitled Note'),
                    type: mapCaptureType(c.type),
                    importance: c.metadata?.importance || 3, // Default mid level
                    timestamp: new Date(c.createdAt),
                    preview: c.content,
                    tags: c.tags?.map((t: any) => t.tag.name) || []
                }));
                setEntries(mapped);
            }
        } catch (e) {
            console.error("Error loading memories:", e);
        } finally {
            setLoading(false);
        }
    };

    const mapCaptureType = (type: string): EntryType => {
        const lower = type.toLowerCase();
        if (lower.includes('link')) return 'link';
        if (lower.includes('image')) return 'image';
        if (lower.includes('video')) return 'video';
        return 'note';
    };

    const filteredEntries = entries
        .filter(entry => {
            const matchesSearch = searchQuery === '' ||
                entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesType = selectedType === null || entry.type === selectedType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            switch (sortMode) {
                case 'importance':
                    return b.importance - a.importance;
                case 'recent':
                    return b.timestamp.getTime() - a.timestamp.getTime();
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });

    const renderImportanceStars = (level: number) => (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    size={10}
                    color={i <= level ? theme.warning : theme.bgTertiary}
                    fill={i <= level ? theme.warning : 'transparent'}
                />
            ))}
        </View>
    );

    const renderGridItem = ({ item }: { item: MemoryEntry }) => {
        const TypeIcon = typeIcons[item.type];
        return (
            <Pressable style={{
                width: '47%',
                backgroundColor: theme.bgSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderLight,
                padding: 14,
                marginBottom: 12,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{
                        width: 36,
                        height: 36,
                        backgroundColor: `${typeColors[item.type]}20`,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <TypeIcon size={18} color={typeColors[item.type]} />
                    </View>
                    {renderImportanceStars(item.importance)}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 6 }} numberOfLines={2}>
                    {item.title}
                </Text>
                {item.preview && (
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }} numberOfLines={2}>
                        {item.preview}
                    </Text>
                )}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {item.tags.slice(0, 2).map(tag => (
                        <View key={tag} style={{
                            backgroundColor: theme.bgTertiary,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                        }}>
                            <Text style={{ fontSize: 10, color: theme.textSubtle }}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </Pressable>
        );
    };

    const renderListItem = ({ item }: { item: MemoryEntry }) => {
        const TypeIcon = typeIcons[item.type];
        return (
            <Pressable style={{
                backgroundColor: theme.bgSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.borderLight,
                padding: 14,
                marginBottom: 10,
                flexDirection: 'row',
                gap: 12,
            }}>
                <View style={{
                    width: 44,
                    height: 44,
                    backgroundColor: `${typeColors[item.type]}20`,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <TypeIcon size={22} color={typeColors[item.type]} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, flex: 1 }} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {renderImportanceStars(item.importance)}
                    </View>
                    {item.preview && (
                        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }} numberOfLines={1}>
                            {item.preview}
                        </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} color={theme.textSubtle} />
                            <Text style={{ fontSize: 11, color: theme.textSubtle }}>
                                {item.timestamp.toLocaleDateString()}
                            </Text>
                        </View>
                        {item.tags.slice(0, 2).map(tag => (
                            <View key={tag} style={{
                                backgroundColor: theme.bgTertiary,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                            }}>
                                <Text style={{ fontSize: 10, color: theme.textSubtle }}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                                Memory
                            </Text>
                            <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 4 }}>
                                {filteredEntries.length} items
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Pressable
                                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: theme.bgSecondary,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 1,
                                    borderColor: theme.borderLight,
                                }}
                            >
                                {viewMode === 'grid' ? <List size={20} color={theme.text} /> : <Grid size={20} color={theme.text} />}
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        paddingHorizontal: 14,
                        gap: 10,
                    }}>
                        <Sparkles size={18} color={theme.primary} />
                        <TextInput
                            style={{
                                flex: 1,
                                paddingVertical: 14,
                                fontSize: 15,
                                color: theme.text,
                            }}
                            placeholder="Semantic search your memories..."
                            placeholderTextColor={theme.textSubtle}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <Pressable onPress={() => setSearchQuery('')}>
                                <X size={18} color={theme.textSubtle} />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Sort & Filter Bar */}
                <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable
                            onPress={() => {
                                const modes: SortMode[] = ['importance', 'recent', 'type'];
                                const currentIndex = modes.indexOf(sortMode);
                                setSortMode(modes[(currentIndex + 1) % modes.length]);
                            }}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.bgSecondary,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                gap: 6,
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                            }}
                        >
                            <Star size={14} color={theme.primary} />
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                                {sortMode === 'importance' ? 'By Importance' : sortMode === 'recent' ? 'Recent' : 'By Type'}
                            </Text>
                            <ChevronDown size={14} color={theme.textSubtle} />
                        </Pressable>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {(['link', 'note', 'image', 'video'] as EntryType[]).map(type => {
                                const Icon = typeIcons[type];
                                const isSelected = selectedType === type;
                                return (
                                    <Pressable
                                        key={type}
                                        onPress={() => setSelectedType(isSelected ? null : type)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: isSelected ? `${typeColors[type]}20` : theme.bgSecondary,
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 8,
                                            gap: 6,
                                            borderWidth: 1,
                                            borderColor: isSelected ? typeColors[type] : theme.borderLight,
                                        }}
                                    >
                                        <Icon size={14} color={isSelected ? typeColors[type] : theme.textMuted} />
                                        <Text style={{ fontSize: 13, color: isSelected ? typeColors[type] : theme.textMuted, fontWeight: '500' }}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>

                {/* Entries Grid/List */}
                <FlatList
                    data={filteredEntries}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                    keyExtractor={item => item.id}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    key={viewMode}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
                    columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Search size={48} color={theme.bgTertiary} />
                            <Text style={{ fontSize: 16, color: theme.textMuted, marginTop: 16 }}>
                                No memories found
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
};
