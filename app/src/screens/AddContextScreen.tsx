import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useShareIntent } from 'expo-share-intent';
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
import { Card, Button, Input } from '../components/ui';
import { theme } from '../theme';

export const AddContextScreen: React.FC = () => {
    const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
    const [selectedType, setSelectedType] = useState<'image' | 'video' | 'link' | 'text' | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [textNote, setTextNote] = useState('');

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
                // Handle images/videos
                const file = shareIntent.files[0];
                if (file.mimeType?.startsWith('image/')) {
                    setSelectedType('image');
                } else if (file.mimeType?.startsWith('video/')) {
                    setSelectedType('video');
                }
            }
        }
    }, [hasShareIntent, shareIntent]);

    const handleSave = async () => {
        // TODO: Implement save to Supabase
        Alert.alert('Success', 'Content saved to Stash!', [
            {
                text: 'OK',
                onPress: () => {
                    // Reset form
                    setSelectedType(null);
                    setLinkUrl('');
                    setTextNote('');
                    if (hasShareIntent) {
                        resetShareIntent();
                    }
                },
            },
        ]);
    };

    const recentCaptures = [
        { id: '1', type: 'image', title: 'Meeting notes', time: '2h ago', status: 'ready' },
        { id: '2', type: 'link', title: 'Article about AI', time: '5h ago', status: 'ready' },
        { id: '3', type: 'video', title: 'Product demo', time: '1d ago', status: 'processing' },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    theme.colors.dark.background,
                    theme.colors.accent[900],
                    theme.colors.dark.background,
                ]}
                locations={[0, 0.2, 1]}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Add to Stash</Text>
                        <Text style={styles.subtitle}>Capture anything, remember everything</Text>
                    </View>
                    {hasShareIntent && (
                        <View style={styles.shareIndicator}>
                            <Share2 size={20} color={theme.colors.accent[400]} />
                        </View>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Share Intent Alert */}
                    {hasShareIntent && (
                        <Card variant="glass">
                            <Card.Content>
                                <View style={styles.shareAlert}>
                                    <Share2 size={24} color={theme.colors.accent[400]} />
                                    <View style={styles.shareAlertText}>
                                        <Text style={styles.shareAlertTitle}>Shared Content Detected</Text>
                                        <Text style={styles.shareAlertSubtitle}>
                                            Content from another app is ready to save
                                        </Text>
                                    </View>
                                </View>
                            </Card.Content>
                        </Card>
                    )}

                    {/* Input Type Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>What do you want to save?</Text>
                        <View style={styles.typeGrid}>
                            <Card
                                variant={selectedType === 'image' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('image')}
                            >
                                <Card.Content>
                                    <View style={styles.typeCard}>
                                        <View style={styles.typeIcon}>
                                            <Camera size={28} color={theme.colors.primary[400]} />
                                        </View>
                                        <Text style={styles.typeTitle}>Photo</Text>
                                    </View>
                                </Card.Content>
                            </Card>

                            <Card
                                variant={selectedType === 'video' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('video')}
                            >
                                <Card.Content>
                                    <View style={styles.typeCard}>
                                        <View style={styles.typeIcon}>
                                            <Video size={28} color={theme.colors.accent[400]} />
                                        </View>
                                        <Text style={styles.typeTitle}>Video</Text>
                                    </View>
                                </Card.Content>
                            </Card>

                            <Card
                                variant={selectedType === 'link' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('link')}
                            >
                                <Card.Content>
                                    <View style={styles.typeCard}>
                                        <View style={styles.typeIcon}>
                                            <LinkIcon size={28} color={theme.colors.success[400]} />
                                        </View>
                                        <Text style={styles.typeTitle}>Link</Text>
                                    </View>
                                </Card.Content>
                            </Card>

                            <Card
                                variant={selectedType === 'text' ? 'glass' : 'elevated'}
                                onPress={() => setSelectedType('text')}
                            >
                                <Card.Content>
                                    <View style={styles.typeCard}>
                                        <View style={styles.typeIcon}>
                                            <FileText size={28} color={theme.colors.warning[400]} />
                                        </View>
                                        <Text style={styles.typeTitle}>Note</Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    </View>

                    {/* Input Form Based on Selected Type */}
                    {selectedType === 'link' && (
                        <View style={styles.section}>
                            <Card variant="glass">
                                <Card.Content>
                                    <Input
                                        label="URL"
                                        placeholder="https://example.com"
                                        value={linkUrl}
                                        onChangeText={setLinkUrl}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                        leftIcon={<LinkIcon size={20} color={theme.colors.text.tertiary} />}
                                    />
                                    <Button variant="primary" size="lg" onPress={handleSave}>
                                        Save Link
                                    </Button>
                                </Card.Content>
                            </Card>
                        </View>
                    )}

                    {selectedType === 'text' && (
                        <View style={styles.section}>
                            <Card variant="glass">
                                <Card.Content>
                                    <Text style={styles.inputLabel}>Your Note</Text>
                                    <TextInput
                                        style={styles.textArea}
                                        placeholder="Write something..."
                                        placeholderTextColor={theme.colors.text.tertiary}
                                        value={textNote}
                                        onChangeText={setTextNote}
                                        multiline
                                        numberOfLines={6}
                                    />
                                    <Button variant="primary" size="lg" onPress={handleSave}>
                                        Save Note
                                    </Button>
                                </Card.Content>
                            </Card>
                        </View>
                    )}

                    {selectedType === 'image' && (
                        <View style={styles.section}>
                            <Card variant="glass">
                                <Card.Content>
                                    <View style={styles.uploadArea}>
                                        <ImageIcon size={48} color={theme.colors.text.tertiary} />
                                        <Text style={styles.uploadText}>Tap to select a photo</Text>
                                        <Text style={styles.uploadSubtext}>or take a new one</Text>
                                    </View>
                                    <View style={styles.buttonRow}>
                                        <Button variant="outline" style={{ flex: 1 }}>
                                            Gallery
                                        </Button>
                                        <Button variant="primary" style={{ flex: 1 }}>
                                            Camera
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    )}

                    {selectedType === 'video' && (
                        <View style={styles.section}>
                            <Card variant="glass">
                                <Card.Content>
                                    <View style={styles.uploadArea}>
                                        <Video size={48} color={theme.colors.text.tertiary} />
                                        <Text style={styles.uploadText}>Tap to select a video</Text>
                                        <Text style={styles.uploadSubtext}>or record a new one</Text>
                                    </View>
                                    <View style={styles.buttonRow}>
                                        <Button variant="outline" style={{ flex: 1 }}>
                                            Library
                                        </Button>
                                        <Button variant="primary" style={{ flex: 1 }}>
                                            Record
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                    )}

                    {/* Recent Captures */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Captures</Text>
                        {recentCaptures.map((item) => (
                            <Card key={item.id} variant="elevated" onPress={() => console.log(item.id)}>
                                <Card.Content>
                                    <View style={styles.recentItem}>
                                        <View style={styles.recentIcon}>
                                            {item.type === 'image' && (
                                                <Camera size={20} color={theme.colors.primary[400]} />
                                            )}
                                            {item.type === 'link' && (
                                                <LinkIcon size={20} color={theme.colors.success[400]} />
                                            )}
                                            {item.type === 'video' && (
                                                <Video size={20} color={theme.colors.accent[400]} />
                                            )}
                                        </View>
                                        <View style={styles.recentContent}>
                                            <Text style={styles.recentTitle}>{item.title}</Text>
                                            <View style={styles.recentMeta}>
                                                <Clock size={12} color={theme.colors.text.tertiary} />
                                                <Text style={styles.recentTime}>{item.time}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.recentStatus}>
                                            {item.status === 'ready' ? (
                                                <CheckCircle size={20} color={theme.colors.success[400]} />
                                            ) : (
                                                <View style={styles.processingDot} />
                                            )}
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    title: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[1],
    },
    subtitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    shareIndicator: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: theme.spacing[6],
        gap: theme.spacing[6],
    },
    shareAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    shareAlertText: {
        flex: 1,
        gap: theme.spacing[1],
    },
    shareAlertTitle: {
        ...theme.typography.styles.bodyMedium,
        color: theme.colors.text.primary,
    },
    shareAlertSubtitle: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
    section: {
        gap: theme.spacing[3],
    },
    sectionTitle: {
        ...theme.typography.styles.labelLarge,
        color: theme.colors.text.primary,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
    },
    typeCard: {
        alignItems: 'center',
        gap: theme.spacing[2],
        minWidth: 80,
    },
    typeIcon: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeTitle: {
        ...theme.typography.styles.label,
        color: theme.colors.text.primary,
    },
    inputLabel: {
        ...theme.typography.styles.label,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
    },
    textArea: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.xl,
        padding: theme.spacing[4],
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: theme.spacing[4],
    },
    uploadArea: {
        alignItems: 'center',
        paddingVertical: theme.spacing[8],
        gap: theme.spacing[2],
        marginBottom: theme.spacing[4],
    },
    uploadText: {
        ...theme.typography.styles.bodyMedium,
        color: theme.colors.text.primary,
    },
    uploadSubtext: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: theme.spacing[3],
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    recentIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recentContent: {
        flex: 1,
        gap: theme.spacing[1],
    },
    recentTitle: {
        ...theme.typography.styles.bodyMedium,
        color: theme.colors.text.primary,
    },
    recentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[1],
    },
    recentTime: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
    recentStatus: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    processingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.warning[400],
    },
});
