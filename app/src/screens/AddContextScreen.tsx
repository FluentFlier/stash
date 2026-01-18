import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert, TouchableWithoutFeedback, Keyboard, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShareIntent } from 'expo-share-intent';
import {
    Camera,
    Video,
    Link as LinkIcon,
    FileText,
    Clock,
    CheckCircle,
    Share2,
    Image as ImageIcon,
} from 'lucide-react-native';
import { ButtonNew } from '../components/ui';

// Unified color constants - softer dark theme
const colors = {
    bg: '#121218',           // soft dark slate
    bgSecondary: '#1c1c24',  // elevated surface
    bgTertiary: '#252530',   // input backgrounds
    primary: '#6366f1',
    primaryMuted: 'rgba(99, 102, 241, 0.12)',
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    border: '#3a3a48',
    borderLight: '#2d2d38',
    success: '#22c55e',
    successMuted: 'rgba(34, 197, 94, 0.12)',
    accent: '#3b82f6',
    accentMuted: 'rgba(59, 130, 246, 0.12)',
    warning: '#f97316',
    warningMuted: 'rgba(249, 115, 22, 0.12)',
};

export const AddContextScreen: React.FC = () => {
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const [selectedType, setSelectedType] = useState<'image' | 'video' | 'link' | 'text' | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [textNote, setTextNote] = useState('');
    const [sharedMediaUri, setSharedMediaUri] = useState<string | null>(null);
    const [sharedMediaName, setSharedMediaName] = useState<string | null>(null);

    useEffect(() => {
        if (hasShareIntent && shareIntent) {
            if (shareIntent.type === 'weburl' && shareIntent.webUrl) {
                setSelectedType('link');
                setLinkUrl(shareIntent.webUrl);
            } else if (shareIntent.type === 'text' && shareIntent.text) {
                setSelectedType('text');
                setTextNote(shareIntent.text);
            } else if (shareIntent.type === 'media' && shareIntent.files && shareIntent.files.length > 0) {
                const file = shareIntent.files[0];
                setSharedMediaUri(file.path || null);
                setSharedMediaName(file.fileName || 'Shared media');
                if (file.mimeType?.startsWith('image/')) {
                    setSelectedType('image');
                } else if (file.mimeType?.startsWith('video/')) {
                    setSelectedType('video');
                }
            }
        }
    }, [hasShareIntent, shareIntent]);

    const handleSave = async () => {
        Alert.alert('Success', 'Content saved to Stash!', [
            {
                text: 'OK',
                onPress: () => {
                    setSelectedType(null);
                    setLinkUrl('');
                    setTextNote('');
                    setSharedMediaUri(null);
                    setSharedMediaName(null);
                    if (hasShareIntent) {
                        resetShareIntent();
                    }
                },
            },
        ]);
    };

    const handleCancel = () => {
        setSelectedType(null);
        setLinkUrl('');
        setTextNote('');
        setSharedMediaUri(null);
        setSharedMediaName(null);
        if (hasShareIntent) {
            resetShareIntent();
        }
    };

    const recentCaptures = [
        { id: '1', type: 'image', title: 'Meeting notes', time: '2h ago', status: 'ready' },
        { id: '2', type: 'link', title: 'Article about AI', time: '5h ago', status: 'ready' },
        { id: '3', type: 'video', title: 'Product demo', time: '1d ago', status: 'processing' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>
                        Add to Stash
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
                        Capture anything, remember everything
                    </Text>
                </View>

                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Share Intent Banner */}
                        {hasShareIntent && !selectedType && (
                            <View style={{
                                backgroundColor: colors.primaryMuted,
                                borderWidth: 1,
                                borderColor: 'rgba(99, 102, 241, 0.25)',
                                borderRadius: 10,
                                padding: 14,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <Share2 size={20} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                        Shared Content Detected
                                    </Text>
                                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                        Ready to save to your stash
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Type Selection */}
                        {!selectedType && (
                            <View style={{ gap: 10 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                                    What do you want to save?
                                </Text>

                                {/* Link Option */}
                                <Pressable
                                    onPress={() => setSelectedType('link')}
                                    style={{
                                        backgroundColor: colors.bgSecondary,
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                        borderRadius: 10,
                                        padding: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        backgroundColor: colors.successMuted,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <LinkIcon size={18} color={colors.success} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                            Save a Link
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSubtle }}>
                                            URLs, articles, websites
                                        </Text>
                                    </View>
                                </Pressable>

                                {/* Note Option */}
                                <Pressable
                                    onPress={() => setSelectedType('text')}
                                    style={{
                                        backgroundColor: colors.bgSecondary,
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                        borderRadius: 10,
                                        padding: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        backgroundColor: colors.warningMuted,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <FileText size={18} color={colors.warning} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                            Write a Note
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSubtle }}>
                                            Quick thoughts and ideas
                                        </Text>
                                    </View>
                                </Pressable>

                                {/* Photo Option */}
                                <Pressable
                                    onPress={() => setSelectedType('image')}
                                    style={{
                                        backgroundColor: colors.bgSecondary,
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                        borderRadius: 10,
                                        padding: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        backgroundColor: colors.primaryMuted,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Camera size={18} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                            Add a Photo
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSubtle }}>
                                            Gallery or camera
                                        </Text>
                                    </View>
                                </Pressable>

                                {/* Video Option */}
                                <Pressable
                                    onPress={() => setSelectedType('video')}
                                    style={{
                                        backgroundColor: colors.bgSecondary,
                                        borderWidth: 1,
                                        borderColor: colors.borderLight,
                                        borderRadius: 10,
                                        padding: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                    }}
                                >
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        backgroundColor: colors.accentMuted,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Video size={18} color={colors.accent} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                            Add a Video
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSubtle }}>
                                            Library or record new
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        )}

                        {/* Link Input Form */}
                        {selectedType === 'link' && (
                            <View style={{
                                backgroundColor: colors.bgSecondary,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                borderRadius: 10,
                                padding: 16,
                                gap: 14,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        backgroundColor: colors.successMuted,
                                        borderRadius: 6,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <LinkIcon size={16} color={colors.success} />
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                                        Save Link
                                    </Text>
                                </View>

                                <TextInput
                                    style={{
                                        backgroundColor: colors.bgTertiary,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        fontSize: 14,
                                        color: colors.text,
                                    }}
                                    placeholder="https://example.com"
                                    placeholderTextColor={colors.textSubtle}
                                    value={linkUrl}
                                    onChangeText={setLinkUrl}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <ButtonNew variant="outline" className="flex-1" onPress={handleCancel}>
                                        Cancel
                                    </ButtonNew>
                                    <ButtonNew variant="primary" className="flex-1" onPress={handleSave}>
                                        Save
                                    </ButtonNew>
                                </View>
                            </View>
                        )}

                        {/* Text Note Form */}
                        {selectedType === 'text' && (
                            <View style={{
                                backgroundColor: colors.bgSecondary,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                borderRadius: 10,
                                padding: 16,
                                gap: 14,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        backgroundColor: colors.warningMuted,
                                        borderRadius: 6,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <FileText size={16} color={colors.warning} />
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                                        Write Note
                                    </Text>
                                </View>

                                <TextInput
                                    style={{
                                        backgroundColor: colors.bgTertiary,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        fontSize: 14,
                                        color: colors.text,
                                        minHeight: 120,
                                        textAlignVertical: 'top',
                                    }}
                                    placeholder="Write something..."
                                    placeholderTextColor={colors.textSubtle}
                                    value={textNote}
                                    onChangeText={setTextNote}
                                    multiline
                                    numberOfLines={5}
                                />

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <ButtonNew variant="outline" className="flex-1" onPress={handleCancel}>
                                        Cancel
                                    </ButtonNew>
                                    <ButtonNew variant="primary" className="flex-1" onPress={handleSave}>
                                        Save
                                    </ButtonNew>
                                </View>
                            </View>
                        )}

                        {/* Image Form */}
                        {selectedType === 'image' && (
                            <View style={{
                                backgroundColor: colors.bgSecondary,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                borderRadius: 10,
                                padding: 16,
                                gap: 14,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        backgroundColor: colors.primaryMuted,
                                        borderRadius: 6,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Camera size={16} color={colors.primary} />
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                                        {sharedMediaUri ? 'Shared Photo' : 'Add Photo'}
                                    </Text>
                                </View>

                                {sharedMediaUri ? (
                                    <View style={{ gap: 10 }}>
                                        <View style={{
                                            backgroundColor: colors.bgTertiary,
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            height: 180,
                                        }}>
                                            <Image
                                                source={{ uri: sharedMediaUri }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <Text style={{ fontSize: 12, color: colors.textSubtle, textAlign: 'center' }}>
                                            {sharedMediaName}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={{
                                        backgroundColor: colors.bgTertiary,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderStyle: 'dashed',
                                        borderColor: colors.border,
                                        paddingVertical: 32,
                                        alignItems: 'center',
                                        gap: 8,
                                    }}>
                                        <ImageIcon size={32} color={colors.textSubtle} />
                                        <Text style={{ fontSize: 13, color: colors.textSubtle }}>
                                            Select from gallery or take a photo
                                        </Text>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <ButtonNew variant="outline" className="flex-1" onPress={handleCancel}>
                                        Cancel
                                    </ButtonNew>
                                    {sharedMediaUri ? (
                                        <ButtonNew variant="primary" className="flex-1" onPress={handleSave}>
                                            Save
                                        </ButtonNew>
                                    ) : (
                                        <>
                                            <ButtonNew variant="outline" className="flex-1" onPress={() => Alert.alert('Gallery', 'Coming soon')}>
                                                Gallery
                                            </ButtonNew>
                                            <ButtonNew variant="primary" className="flex-1" onPress={() => Alert.alert('Camera', 'Coming soon')}>
                                                Camera
                                            </ButtonNew>
                                        </>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Video Form */}
                        {selectedType === 'video' && (
                            <View style={{
                                backgroundColor: colors.bgSecondary,
                                borderWidth: 1,
                                borderColor: colors.borderLight,
                                borderRadius: 10,
                                padding: 16,
                                gap: 14,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        backgroundColor: colors.accentMuted,
                                        borderRadius: 6,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Video size={16} color={colors.accent} />
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                                        {sharedMediaUri ? 'Shared Video' : 'Add Video'}
                                    </Text>
                                </View>

                                {sharedMediaUri ? (
                                    <View style={{ gap: 10 }}>
                                        <View style={{
                                            backgroundColor: colors.bgTertiary,
                                            borderRadius: 8,
                                            paddingVertical: 32,
                                            alignItems: 'center',
                                        }}>
                                            <Video size={40} color={colors.accent} />
                                            <Text style={{ fontSize: 14, color: colors.text, marginTop: 8, fontWeight: '500' }}>
                                                Video ready to save
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 12, color: colors.textSubtle, textAlign: 'center' }}>
                                            {sharedMediaName}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={{
                                        backgroundColor: colors.bgTertiary,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderStyle: 'dashed',
                                        borderColor: colors.border,
                                        paddingVertical: 32,
                                        alignItems: 'center',
                                        gap: 8,
                                    }}>
                                        <Video size={32} color={colors.textSubtle} />
                                        <Text style={{ fontSize: 13, color: colors.textSubtle }}>
                                            Select from library or record a video
                                        </Text>
                                    </View>
                                )}

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <ButtonNew variant="outline" className="flex-1" onPress={handleCancel}>
                                        Cancel
                                    </ButtonNew>
                                    {sharedMediaUri ? (
                                        <ButtonNew variant="primary" className="flex-1" onPress={handleSave}>
                                            Save
                                        </ButtonNew>
                                    ) : (
                                        <>
                                            <ButtonNew variant="outline" className="flex-1" onPress={() => Alert.alert('Library', 'Coming soon')}>
                                                Library
                                            </ButtonNew>
                                            <ButtonNew variant="primary" className="flex-1" onPress={() => Alert.alert('Record', 'Coming soon')}>
                                                Record
                                            </ButtonNew>
                                        </>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Recent Captures */}
                        {!selectedType && (
                            <View style={{ gap: 10, marginTop: 8 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                    Recent
                                </Text>
                                {recentCaptures.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        style={{
                                            backgroundColor: colors.bgSecondary,
                                            borderWidth: 1,
                                            borderColor: colors.borderLight,
                                            borderRadius: 10,
                                            padding: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                    >
                                        <View style={{
                                            width: 32,
                                            height: 32,
                                            backgroundColor: colors.bgTertiary,
                                            borderRadius: 6,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {item.type === 'image' && <Camera size={16} color={colors.primary} />}
                                            {item.type === 'link' && <LinkIcon size={16} color={colors.success} />}
                                            {item.type === 'video' && <Video size={16} color={colors.accent} />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>
                                                {item.title}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Clock size={11} color={colors.textSubtle} />
                                                <Text style={{ fontSize: 12, color: colors.textSubtle }}>
                                                    {item.time}
                                                </Text>
                                            </View>
                                        </View>
                                        {item.status === 'ready' ? (
                                            <CheckCircle size={16} color={colors.success} />
                                        ) : (
                                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning }} />
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </View>
    );
};
