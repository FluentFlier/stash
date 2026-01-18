import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Search,
    Grid,
    List,
    Star,
    Clock,
    Link as LinkIcon,
    FileText,
    Image as ImageIcon,
    Video,
    ChevronDown,
    Sparkles,
    X,
    Trash2,
} from 'lucide-react-native';
import { theme } from '../theme';
import { api, Capture } from '../utils/api';

type EntryType = 'link' | 'note' | 'image' | 'video' | 'text' | 'pdf' | 'audio';
type SortMode = 'importance' | 'recent' | 'type';

const typeIcons: Record<string, typeof LinkIcon> = {
    link: LinkIcon,
    note: FileText,
    text: FileText,
    image: ImageIcon,
    video: Video,
    pdf: FileText,
    audio: Video,
};

const typeColors: Record<string, string> = {
    link: theme.success,
    note: theme.warning,
    text: theme.warning,
    image: theme.primary,
    video: theme.accent,
    pdf: theme.error,
    audio: theme.accent,
};

export const MemoryScreen: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('recent');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [captures, setCaptures] = useState<Capture[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCaptures = useCallback(async () => {
        try {
            const response = await api.getCaptures(100, 0, selectedType || undefined);
            if (response.success && response.data) {
                setCaptures(response.data);
            }
        } catch (error) {
            console.error('Error fetching captures:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedType]);

    useEffect(() => {
        fetchCaptures();
    }, [fetchCaptures]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCaptures();
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Memory',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const response = await api.deleteCapture(id);
                        if (response.success) {
                            setCaptures(prev => prev.filter(c => c.id !== id));
                        } else {
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    },
                },
            ]
        );
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchCaptures();
            return;
        }
        setLoading(true);
        try {
            const response = await api.searchCaptures(searchQuery);
            if (response.success && response.data) {
                setCaptures(response.data);
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = captures
        .filter(entry => {
            const matchesSearch = searchQuery === '' ||
                entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = selectedType === null || entry.type === selectedType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            switch (sortMode) {
                case 'recent':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

    const renderGridItem = ({ item }: { item: Capture }) => {
        const TypeIcon = typeIcons[item.type] || FileText;
        const color = typeColors[item.type] || theme.primary;

        return (
            <Pressable
                style={{
                    width: '47%',
                    backgroundColor: theme.bgSecondary,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                    padding: 14,
                    marginBottom: 12,
                }}
                onLongPress={() => handleDelete(item.id)}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{
                        width: 36,
                        height: 36,
                        backgroundColor: `${color}20`,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <TypeIcon size={18} color={color} />
                    </View>
                    <View style={{
                        backgroundColor: item.processingStatus === 'COMPLETED' ? theme.success + '20' : theme.warning + '20',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                    }}>
                        <Text style={{ fontSize: 9, color: item.processingStatus === 'COMPLETED' ? theme.success : theme.warning }}>
                            {item.processingStatus === 'COMPLETED' ? '✓' : '⏳'}
                        </Text>
                    </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 6 }} numberOfLines={2}>
                    {item.title || item.content.slice(0, 50)}
                </Text>
                {item.description && (
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} color={theme.textSubtle} />
                    <Text style={{ fontSize: 10, color: theme.textSubtle }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </Pressable>
        );
    };

    const renderListItem = ({ item }: { item: Capture }) => {
        const TypeIcon = typeIcons[item.type] || FileText;
        const color = typeColors[item.type] || theme.primary;

        return (
            <Pressable
                style={{
                    backgroundColor: theme.bgSecondary,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    gap: 12,
                }}
                onLongPress={() => handleDelete(item.id)}
            >
                <View style={{
                    width: 44,
                    height: 44,
                    backgroundColor: `${color}20`,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <TypeIcon size={22} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, flex: 1 }} numberOfLines={1}>
                            {item.title || item.content.slice(0, 50)}
                        </Text>
                        <Pressable onPress={() => handleDelete(item.id)}>
                            <Trash2 size={16} color={theme.error} />
                        </Pressable>
                    </View>
                    {item.description && (
                        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }} numberOfLines={1}>
                            {item.description}
                        </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} color={theme.textSubtle} />
                            <Text style={{ fontSize: 11, color: theme.textSubtle }}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: `${color}20`,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}>
                            <Text style={{ fontSize: 10, color: color }}>{item.type}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.textMuted, marginTop: 12 }}>Loading memories...</Text>
            </View>
        );
    }

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
                            placeholder="Search your memories..."
                            placeholderTextColor={theme.textSubtle}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery !== '' && (
                            <Pressable onPress={() => { setSearchQuery(''); fetchCaptures(); }}>
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
                                const modes: SortMode[] = ['recent', 'type'];
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
                            <Clock size={14} color={theme.primary} />
                            <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                                {sortMode === 'recent' ? 'Recent' : 'By Type'}
                            </Text>
                            <ChevronDown size={14} color={theme.textSubtle} />
                        </Pressable>

                        {(['link', 'text', 'image', 'video'] as string[]).map(type => {
                            const Icon = typeIcons[type];
                            const isSelected = selectedType === type;
                            const color = typeColors[type];
                            return (
                                <Pressable
                                    key={type}
                                    onPress={() => setSelectedType(isSelected ? null : type)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: isSelected ? `${color}20` : theme.bgSecondary,
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                        gap: 6,
                                        borderWidth: 1,
                                        borderColor: isSelected ? color : theme.borderLight,
                                    }}
                                >
                                    <Icon size={14} color={isSelected ? color : theme.textMuted} />
                                    <Text style={{ fontSize: 13, color: isSelected ? color : theme.textMuted, fontWeight: '500' }}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </Pressable>
                            );
                        })}
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <Search size={48} color={theme.bgTertiary} />
                            <Text style={{ fontSize: 16, color: theme.textMuted, marginTop: 16 }}>
                                No memories found
                            </Text>
                            <Text style={{ fontSize: 14, color: theme.textSubtle, marginTop: 8, textAlign: 'center' }}>
                                Share content to Stash to save it here
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
};
