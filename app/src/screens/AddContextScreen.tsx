import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShareIntent } from 'expo-share-intent';
import * as ImagePicker from 'expo-image-picker';
import {
    Camera,
    Video,
    Link as LinkIcon,
    FileText,
    Image as ImageIcon,
    Clock,
    CheckCircle,
    Share2,
} from 'lucide-react-native';
import { CardNew, ButtonNew, InputNew } from '../components/ui';
import { createCapture, uploadFile } from '../lib/api';
import { useAuthStore } from '../store/auth';

export const AddContextScreen: React.FC = () => {
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const [selectedType, setSelectedType] = useState<'image' | 'video' | 'link' | 'text' | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [textNote, setTextNote] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [mediaMimeType, setMediaMimeType] = useState<string | null>(null);
    const [mediaName, setMediaName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const token = useAuthStore((state) => state.token);

    // Handle share intent when app is opened via share sheet
    useEffect(() => {
            if (hasShareIntent && shareIntent) {
                if (shareIntent.type === 'weburl' && shareIntent.webUrl) {
                    setSelectedType('link');
                    setLinkUrl(shareIntent.webUrl);
                } else if (shareIntent.type === 'text' && shareIntent.text) {
                    setSelectedType('text');
                    setTextNote(shareIntent.text);
                } else if (shareIntent.type === 'media' && shareIntent.files) {
                    const file = shareIntent.files[0];
                    if (file.mimeType?.startsWith('image/')) {
                        setSelectedType('image');
                        setMediaMimeType(file.mimeType || null);
                    } else if (file.mimeType?.startsWith('video/')) {
                        setSelectedType('video');
                        setMediaMimeType(file.mimeType || null);
                    }
                    const uri = (file as any).path || (file as any).filePath || (file as any).contentUri || (file as any).uri;
                    if (uri) {
                        setMediaUri(uri);
                        setMediaName(file.fileName || file.name || 'shared-media');
                    }
                }
            }
        }, [hasShareIntent, shareIntent]);

    const handleSave = async () => {
        if (!token) {
            Alert.alert('Sign in required', 'Please sign in to save to Stash.');
            return;
        }

        try {
            setLoading(true);
            if (selectedType === 'link') {
                await createCapture(token, {
                    type: 'LINK',
                    content: linkUrl,
                    metadata: { source: 'mobile', shared: hasShareIntent },
                });
            } else if (selectedType === 'text') {
                await createCapture(token, {
                    type: 'TEXT',
                    content: textNote,
                    metadata: { source: 'mobile', shared: hasShareIntent },
                });
            } else if (selectedType === 'image' || selectedType === 'video') {
                if (!mediaUri) {
                    Alert.alert('Missing media', 'Please select a file to upload.');
                    return;
                }
                const name = mediaName || `capture-${Date.now()}`;
                const mime = mediaMimeType || (selectedType === 'image' ? 'image/jpeg' : 'video/mp4');
                const uploaded = await uploadFile(token, mediaUri, name, mime);
                await createCapture(token, {
                    type: selectedType === 'image' ? 'IMAGE' : 'VIDEO',
                    content: uploaded.url,
                    metadata: {
                        source: 'mobile',
                        shared: hasShareIntent,
                        fileName: uploaded.fileName,
                        mimeType: uploaded.mimeType,
                    },
                });
            } else {
                Alert.alert('Select a type', 'Please choose a capture type.');
                return;
            }

            Alert.alert('Success', 'Content saved to Stash!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setSelectedType(null);
                        setLinkUrl('');
                        setTextNote('');
                        setMediaUri(null);
                        setMediaMimeType(null);
                        setMediaName(null);
                        if (hasShareIntent) {
                            resetShareIntent();
                        }
                    },
                },
            ]);
        } catch (error: any) {
            Alert.alert('Save failed', error.message || 'Unable to save content.');
        } finally {
            setLoading(false);
        }
    };

    const handlePickMedia = async (type: 'image' | 'video') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setMediaUri(asset.uri);
            setMediaMimeType(asset.mimeType || null);
            setMediaName(asset.fileName || `capture-${Date.now()}`);
        }
    };

    const recentCaptures = [
        { id: '1', type: 'image', title: 'Meeting notes', time: '2h ago', status: 'ready' },
        { id: '2', type: 'link', title: 'Article about AI', time: '5h ago', status: 'ready' },
        { id: '3', type: 'video', title: 'Product demo', time: '1d ago', status: 'processing' },
    ];

    return (
        <View className="flex-1 bg-neutral-950">
            {/* Gradient Background */}
            <View className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-accent-900/20 to-neutral-950" />
            
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                <View className="flex-row justify-between items-center px-6 py-4 border-b border-neutral-800">
                    <View>
                        <Text className="text-2xl font-bold text-neutral-50 mb-1">
                            Add to Stash
                        </Text>
                        <Text className="text-base text-neutral-400">
                            Capture anything, remember everything
                        </Text>
                    </View>
                    {hasShareIntent && (
                        <View className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center">
                            <Share2 size={20} color="#22d3ee" />
                        </View>
                    )}
                </View>

                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView className="flex-1" contentContainerClassName="p-6 gap-6" keyboardShouldPersistTaps="handled">
                        {/* Share Intent Alert */}
                        {hasShareIntent && (
                            <CardNew variant="glass">
                                <CardNew.Content>
                                    <View className="flex-row items-center gap-3">
                                        <Share2 size={24} color="#22d3ee" />
                                        <View className="flex-1 gap-1">
                                            <Text className="text-base font-medium text-neutral-50">
                                                Shared Content Detected
                                            </Text>
                                            <Text className="text-sm text-neutral-400">
                                                Content from another app is ready to save
                                            </Text>
                                        </View>
                                    </View>
                                </CardNew.Content>
                            </CardNew>
                        )}

                    {/* Input Type Selection */}
                    <View className="gap-3">
                        <Text className="text-sm font-semibold text-neutral-50">
                            What do you want to save?
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            <CardNew
                                variant={selectedType === 'image' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('image')}
                                className="flex-1 min-w-[80px]"
                            >
                                <CardNew.Content>
                                    <View className="items-center gap-2">
                                        <View className="w-14 h-14 rounded-xl bg-neutral-800 items-center justify-center">
                                            <Camera size={28} color="#7c6ff0" />
                                        </View>
                                        <Text className="text-sm font-medium text-neutral-50">
                                            Photo
                                        </Text>
                                    </View>
                                </CardNew.Content>
                            </CardNew>

                            <CardNew
                                variant={selectedType === 'video' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('video')}
                                className="flex-1 min-w-[80px]"
                            >
                                <CardNew.Content>
                                    <View className="items-center gap-2">
                                        <View className="w-14 h-14 rounded-xl bg-neutral-800 items-center justify-center">
                                            <Video size={28} color="#22d3ee" />
                                        </View>
                                        <Text className="text-sm font-medium text-neutral-50">
                                            Video
                                        </Text>
                                    </View>
                                </CardNew.Content>
                            </CardNew>

                            <CardNew
                                variant={selectedType === 'link' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('link')}
                                className="flex-1 min-w-[80px]"
                            >
                                <CardNew.Content>
                                    <View className="items-center gap-2">
                                        <View className="w-14 h-14 rounded-xl bg-neutral-800 items-center justify-center">
                                            <LinkIcon size={28} color="#10b981" />
                                        </View>
                                        <Text className="text-sm font-medium text-neutral-50">
                                            Link
                                        </Text>
                                    </View>
                                </CardNew.Content>
                            </CardNew>

                            <CardNew
                                variant={selectedType === 'text' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('text')}
                                className="flex-1 min-w-[80px]"
                            >
                                <CardNew.Content>
                                    <View className="items-center gap-2">
                                        <View className="w-14 h-14 rounded-xl bg-neutral-800 items-center justify-center">
                                            <FileText size={28} color="#f59e0b" />
                                        </View>
                                        <Text className="text-sm font-medium text-neutral-50">
                                            Note
                                        </Text>
                                    </View>
                                </CardNew.Content>
                            </CardNew>
                        </View>
                    </View>

                    {/* Input Form Based on Selected Type */}
                    {selectedType === 'link' && (
                        <View className="gap-3">
                            <CardNew variant="glass">
                                <CardNew.Content>
                                    <InputNew
                                        label="URL"
                                        placeholder="https://example.com"
                                        value={linkUrl}
                                        onChangeText={setLinkUrl}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                        leftIcon={<LinkIcon size={20} color="#a3a3a3" />}
                                    />
                                    <ButtonNew variant="primary" size="lg" loading={loading} onPress={handleSave}>
                                        Save Link
                                    </ButtonNew>
                                </CardNew.Content>
                            </CardNew>
                        </View>
                    )}

                    {selectedType === 'text' && (
                        <View className="gap-3">
                            <CardNew variant="glass">
                                <CardNew.Content>
                                    <Text className="text-sm font-semibold text-neutral-50 mb-2">
                                        Your Note
                                    </Text>
                                    <TextInput
                                        className="bg-neutral-800 rounded-md p-4 text-base text-neutral-50 border border-neutral-700 min-h-[120px]"
                                        placeholder="Write something..."
                                        placeholderTextColor="#a3a3a3"
                                        value={textNote}
                                        onChangeText={setTextNote}
                                        multiline
                                        numberOfLines={6}
                                        textAlignVertical="top"
                                    />
                                    <ButtonNew variant="primary" size="lg" loading={loading} onPress={handleSave}>
                                        Save Note
                                    </ButtonNew>
                                </CardNew.Content>
                            </CardNew>
                        </View>
                    )}

                    {selectedType === 'image' && (
                        <View className="gap-3">
                            <CardNew variant="glass">
                                <CardNew.Content>
                                    <View className="items-center py-8 gap-2 mb-4">
                                        <ImageIcon size={48} color="#a3a3a3" />
                                        <Text className="text-base font-medium text-neutral-50">
                                            {mediaUri ? 'Photo selected' : 'Tap to select a photo'}
                                        </Text>
                                        <Text className="text-sm text-neutral-400">
                                            {mediaUri ? 'Ready to upload' : 'or take a new one'}
                                        </Text>
                                    </View>
                                    <View className="flex-row gap-3">
                                        <ButtonNew variant="outline" className="flex-1" onPress={() => handlePickMedia('image')}>
                                            Gallery
                                        </ButtonNew>
                                        <ButtonNew variant="primary" className="flex-1" loading={loading} onPress={handleSave}>
                                            Save Photo
                                        </ButtonNew>
                                    </View>
                                </CardNew.Content>
                            </CardNew>
                        </View>
                    )}

                    {selectedType === 'video' && (
                        <View className="gap-3">
                            <CardNew variant="glass">
                                <CardNew.Content>
                                    <View className="items-center py-8 gap-2 mb-4">
                                        <Video size={48} color="#a3a3a3" />
                                        <Text className="text-base font-medium text-neutral-50">
                                            {mediaUri ? 'Video selected' : 'Tap to select a video'}
                                        </Text>
                                        <Text className="text-sm text-neutral-400">
                                            {mediaUri ? 'Ready to upload' : 'or record a new one'}
                                        </Text>
                                    </View>
                                    <View className="flex-row gap-3">
                                        <ButtonNew variant="outline" className="flex-1" onPress={() => handlePickMedia('video')}>
                                            Library
                                        </ButtonNew>
                                        <ButtonNew variant="primary" className="flex-1" loading={loading} onPress={handleSave}>
                                            Save Video
                                        </ButtonNew>
                                    </View>
                                </CardNew.Content>
                            </CardNew>
                        </View>
                    )}

                    {/* Recent Captures */}
                    <View className="gap-3">
                        <Text className="text-sm font-semibold text-neutral-50">
                            Recent Captures
                        </Text>
                        {recentCaptures.map((item) => (
                            <CardNew key={item.id} variant="elevated" onPress={() => console.log(item.id)}>
                                <CardNew.Content>
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 rounded-lg bg-neutral-800 items-center justify-center">
                                            {item.type === 'image' && (
                                                <Camera size={20} color="#7c6ff0" />
                                            )}
                                            {item.type === 'link' && (
                                                <LinkIcon size={20} color="#10b981" />
                                            )}
                                            {item.type === 'video' && (
                                                <Video size={20} color="#22d3ee" />
                                            )}
                                        </View>
                                        <View className="flex-1 gap-1">
                                            <Text className="text-base font-medium text-neutral-50">
                                                {item.title}
                                            </Text>
                                            <View className="flex-row items-center gap-1">
                                                <Clock size={12} color="#a3a3a3" />
                                                <Text className="text-sm text-neutral-400">
                                                    {item.time}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="w-6 h-6 items-center justify-center">
                                            {item.status === 'ready' ? (
                                                <CheckCircle size={20} color="#10b981" />
                                            ) : (
                                                <View className="w-2 h-2 rounded-full bg-warning" />
                                            )}
                                        </View>
                                    </View>
                                </CardNew.Content>
                            </CardNew>
                        ))}
                    </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </View>
    );
};
