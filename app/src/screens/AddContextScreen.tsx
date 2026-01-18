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
    Plus,
    Sparkles,
} from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import { theme } from '../theme';

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

    const captureOptions = [
        { type: 'link' as const, icon: LinkIcon, label: 'Link', description: 'Save a URL', color: theme.success, bgColor: theme.successMuted },
        { type: 'text' as const, icon: FileText, label: 'Note', description: 'Quick thought', color: theme.warning, bgColor: theme.warningMuted },
        { type: 'image' as const, icon: Camera, label: 'Photo', description: 'From gallery', color: theme.primary, bgColor: theme.primaryMuted },
        { type: 'video' as const, icon: Video, label: 'Video', description: 'Record or pick', color: theme.accent, bgColor: theme.accentMuted },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                            width: 44,
                            height: 44,
                            backgroundColor: theme.primary,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Plus size={22} color={theme.white} strokeWidth={2.5} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
                                Add to Stash
                            </Text>
                            <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                                Capture anything, remember everything
                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 20 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Share Intent Banner */}
                        {hasShareIntent && !selectedType && (
                            <View style={{
                                backgroundColor: theme.primaryMuted,
                                borderWidth: 1,
                                borderColor: 'rgba(6, 182, 212, 0.25)',
                                borderRadius: 12,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                            }}>
                                <View style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: theme.primary,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Share2 size={20} color={theme.white} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                                        Shared Content Detected
                                    </Text>
                                    <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                                        Ready to save to your stash
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Quick Capture Grid */}
                        {!selectedType && (
                            <View style={{ gap: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Sparkles size={16} color={theme.primary} />
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                                        Quick Capture
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                    {captureOptions.map((option) => (
                                        <Pressable
                                            key={option.type}
                                            onPress={() => setSelectedType(option.type)}
                                            style={{
                                                width: '47%',
                                                backgroundColor: theme.bgSecondary,
                                                borderWidth: 1,
                                                borderColor: theme.borderLight,
                                                borderRadius: 14,
                                                padding: 16,
                                                gap: 12,
                                            }}
                                        >
                                            <View style={{
                                                width: 44,
                                                height: 44,
                                                backgroundColor: option.bgColor,
                                                borderRadius: 12,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <option.icon size={22} color={option.color} />
                                            </View>
                                            <View>
                                                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                                                    {option.label}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: theme.textSubtle, marginTop: 2 }}>
                                                    {option.description}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Link Input Form */}
                        {selectedType === 'link' && (
                            <View style={{
                                backgroundColor: theme.bgSecondary,
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                                borderRadius: 14,
                                padding: 20,
                                gap: 16,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: theme.successMuted,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <LinkIcon size={20} color={theme.success} />
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>
                                        Save Link
                                    </Text>
                                </View>

                                <TextInput
                                    style={{
                                        backgroundColor: theme.bgTertiary,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 15,
                                        color: theme.text,
                                    }}
                                    placeholder="https://example.com"
                                    placeholderTextColor={theme.textSubtle}
                                    value={linkUrl}
                                    onChangeText={setLinkUrl}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus
                                />

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <ButtonNew variant="outline" size="lg" onPress={handleCancel} style={{ flex: 1 }}>
                                        Cancel
                                    </ButtonNew>
                                    <ButtonNew variant="primary" size="lg" onPress={handleSave} style={{ flex: 1 }}>
                                        Save Link
                                    </ButtonNew>
                                </View>
                            </View>
                        )}

                        {/* Text Note Form */}
                        {selectedType === 'text' && (
                            <View style={{
                                backgroundColor: theme.bgSecondary,
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                                borderRadius: 14,
                                padding: 20,
                                gap: 16,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: theme.warningMuted,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <FileText size={20} color={theme.warning} />
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>
                                        Quick Note
                                    </Text>
                                </View>

                                <TextInput
                                    style={{
                                        backgroundColor: theme.bgTertiary,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: theme.border,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        fontSize: 15,
                                        color: theme.text,
                                        minHeight: 140,
                                        textAlignVertical: 'top',
                                    }}
                                    placeholder="Write something..."
                                    placeholderTextColor={theme.textSubtle}
                                    value={textNote}
                                    onChangeText={setTextNote}
                                    multiline
                                    autoFocus
                                />

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <ButtonNew variant="outline" size="lg" onPress={handleCancel} style={{ flex: 1 }}>
                                        Cancel
                                    </ButtonNew>
                                    <ButtonNew variant="primary" size="lg" onPress={handleSave} style={{ flex: 1 }}>
                                        Save Note
                                    </ButtonNew>
                                </View>
                            </View>
                        )}

                        {/* Image Form */}
                        {selectedType === 'image' && (
                            <View style={{
                                backgroundColor: theme.bgSecondary,
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                                borderRadius: 14,
                                padding: 20,
                                gap: 16,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: theme.primaryMuted,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Camera size={20} color={theme.primary} />
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>
                                        {sharedMediaUri ? 'Shared Photo' : 'Add Photo'}
                                    </Text>
                                </View>

                                {sharedMediaUri ? (
                                    <View style={{ gap: 12 }}>
                                        <View style={{
                                            backgroundColor: theme.bgTertiary,
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            height: 200,
                                        }}>
                                            <Image
                                                source={{ uri: sharedMediaUri }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        </View>
                                        <Text style={{ fontSize: 12, color: theme.textSubtle, textAlign: 'center' }}>
                                            {sharedMediaName}
                                        </Text>
                                    </View>
                                ) : (
                                    <Pressable
                                        onPress={() => Alert.alert('Gallery', 'Coming soon')}
                                        style={{
                                            backgroundColor: theme.bgTertiary,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderStyle: 'dashed',
                                            borderColor: theme.border,
                                            paddingVertical: 40,
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <View style={{
                                            width: 56,
                                            height: 56,
                                            backgroundColor: theme.primaryMuted,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <ImageIcon size={28} color={theme.primary} />
                                        </View>
                                        <Text style={{ fontSize: 14, color: theme.textMuted }}>
                                            Tap to select a photo
                                        </Text>
                                    </Pressable>
                                )}

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <ButtonNew variant="outline" size="lg" onPress={handleCancel} style={{ flex: 1 }}>
                                        Cancel
                                    </ButtonNew>
                                    <ButtonNew variant="primary" size="lg" onPress={handleSave} style={{ flex: 1 }}>
                                        {sharedMediaUri ? 'Save Photo' : 'Take Photo'}
                                    </ButtonNew>
                                </View>
                            </View>
                        )}

                        {/* Video Form */}
                        {selectedType === 'video' && (
                            <View style={{
                                backgroundColor: theme.bgSecondary,
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                                borderRadius: 14,
                                padding: 20,
                                gap: 16,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={{
                                        width: 40,
                                        height: 40,
                                        backgroundColor: theme.accentMuted,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Video size={20} color={theme.accent} />
                                    </View>
                                    <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>
                                        {sharedMediaUri ? 'Shared Video' : 'Add Video'}
                                    </Text>
                                </View>

                                {sharedMediaUri ? (
                                    <View style={{ gap: 12 }}>
                                        <View style={{
                                            backgroundColor: theme.bgTertiary,
                                            borderRadius: 12,
                                            paddingVertical: 40,
                                            alignItems: 'center',
                                        }}>
                                            <Video size={48} color={theme.accent} />
                                            <Text style={{ fontSize: 15, color: theme.text, marginTop: 12, fontWeight: '500' }}>
                                                Video ready to save
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 12, color: theme.textSubtle, textAlign: 'center' }}>
                                            {sharedMediaName}
                                        </Text>
                                    </View>
                                ) : (
                                    <Pressable
                                        onPress={() => Alert.alert('Library', 'Coming soon')}
                                        style={{
                                            backgroundColor: theme.bgTertiary,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderStyle: 'dashed',
                                            borderColor: theme.border,
                                            paddingVertical: 40,
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <View style={{
                                            width: 56,
                                            height: 56,
                                            backgroundColor: theme.accentMuted,
                                            borderRadius: 14,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Video size={28} color={theme.accent} />
                                        </View>
                                        <Text style={{ fontSize: 14, color: theme.textMuted }}>
                                            Tap to select a video
                                        </Text>
                                    </Pressable>
                                )}

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <ButtonNew variant="outline" size="lg" onPress={handleCancel} style={{ flex: 1 }}>
                                        Cancel
                                    </ButtonNew>
                                    <ButtonNew variant="primary" size="lg" onPress={handleSave} style={{ flex: 1 }}>
                                        {sharedMediaUri ? 'Save Video' : 'Record'}
                                    </ButtonNew>
                                </View>
                            </View>
                        )}

                        {/* Recent Section */}
                        {!selectedType && (
                            <View style={{ gap: 12 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                                    Recent
                                </Text>
                                {recentCaptures.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        style={{
                                            backgroundColor: theme.bgSecondary,
                                            borderWidth: 1,
                                            borderColor: theme.borderLight,
                                            borderRadius: 12,
                                            padding: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <View style={{
                                            width: 40,
                                            height: 40,
                                            backgroundColor: theme.bgTertiary,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {item.type === 'image' && <Camera size={18} color={theme.primary} />}
                                            {item.type === 'link' && <LinkIcon size={18} color={theme.success} />}
                                            {item.type === 'video' && <Video size={18} color={theme.accent} />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text }}>
                                                {item.title}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                <Clock size={12} color={theme.textSubtle} />
                                                <Text style={{ fontSize: 12, color: theme.textSubtle }}>
                                                    {item.time}
                                                </Text>
                                            </View>
                                        </View>
                                        {item.status === 'ready' ? (
                                            <CheckCircle size={18} color={theme.success} />
                                        ) : (
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.warning }} />
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
