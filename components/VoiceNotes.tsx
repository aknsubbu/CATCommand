import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { spacing, typography } from '../constants/theme';

// Import with comprehensive error handling
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
let speechRecognitionAvailable = false;

try {
  const SpeechRecognition = require('@jamsch/expo-speech-recognition');
  ExpoSpeechRecognitionModule = SpeechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = SpeechRecognition.useSpeechRecognitionEvent;
  speechRecognitionAvailable = true;
  console.log('Speech recognition module loaded successfully');
} catch (error) {
  console.warn('Speech recognition module not available:', error.message);
  speechRecognitionAvailable = false;
}

// CAT Color Scheme
const catColors = {
  primary: "#FFCD11", // CAT Yellow
  secondary: "#000000", // CAT Black
  background: {
    light: "#FFFFFF",
    gray: "#F5F5F5",
    dark: "#1A1A1A",
  },
  text: {
    primary: "#000000",
    secondary: "#666666",
    light: "#FFFFFF",
  },
  status: {
    pending: "#FFA500",
    inProgress: "#007ACC",
    completed: "#28A745",
    cancelled: "#DC3545",
    recording: "#FF3B30",
    processing: "#007ACC",
  },
  border: "#E0E0E0",
};

interface VoiceNote {
  id: string;
  text: string;
  timestamp: Date;
  duration?: number;
  edited?: boolean;
}

interface VoiceNotesComponentProps {
  onNoteSaved?: (note: VoiceNote) => void;
  onNoteDeleted?: (noteId: string) => void;
  maxNotesDisplayed?: number;
}

const VoiceNotesComponent: React.FC<VoiceNotesComponentProps> = ({
  onNoteSaved,
  onNoteDeleted,
  maxNotesDisplayed = 10,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [recognitionAvailable, setRecognitionAvailable] = useState(speechRecognitionAvailable);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingButtonScale = useRef(new Animated.Value(1)).current;

  // Check if speech recognition is available
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    if (!speechRecognitionAvailable || !ExpoSpeechRecognitionModule) {
      setRecognitionAvailable(false);
      setModuleError('Speech recognition module not loaded. Please ensure you are using a development build with the plugin configured.');
      return;
    }
    
    try {
      // Test if the module methods are available
      if (typeof ExpoSpeechRecognitionModule.getStateAsync !== 'function') {
        setModuleError('Speech recognition methods not available. Plugin may not be properly configured.');
        setRecognitionAvailable(false);
        return;
      }

      const available = await ExpoSpeechRecognitionModule.getStateAsync();
      setRecognitionAvailable(available.state === 'inactive' || available.state === 'ready');
      setModuleError(null);
    } catch (error) {
      console.error('Error checking speech recognition availability:', error);
      setRecognitionAvailable(false);
      setModuleError(`Error: ${error.message}`);
    }
  };

  // Handle speech recognition events (only if module is available)
  useEffect(() => {
    if (!speechRecognitionAvailable || !useSpeechRecognitionEvent) {
      return;
    }

    const startListener = useSpeechRecognitionEvent('start', () => {
      console.log('Speech recognition started');
      setIsRecording(true);
      setCurrentTranscript('');
      setRecordingStartTime(new Date());
      startPulseAnimation();
    });

    const endListener = useSpeechRecognitionEvent('end', () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      setIsProcessing(false);
      stopPulseAnimation();
      setRecordingStartTime(null);
    });

    const resultListener = useSpeechRecognitionEvent('result', (event) => {
      console.log('Speech recognition result:', event.results);
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0]?.transcript || '';
        setCurrentTranscript(transcript);
        
        // If this is a final result, save the note
        if (event.isFinal) {
          saveVoiceNote(transcript);
        }
      }
    });

    const errorListener = useSpeechRecognitionEvent('error', (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsProcessing(false);
      stopPulseAnimation();
      Alert.alert(
        'Recognition Error',
        `Speech recognition failed: ${event.error}. Please try again.`
      );
    });

    // Cleanup function
    return () => {
      try {
        startListener?.remove?.();
        endListener?.remove?.();
        resultListener?.remove?.();
        errorListener?.remove?.();
      } catch (error) {
        console.warn('Error removing listeners:', error);
      }
    };
  }, [speechRecognitionAvailable]);

  // Animation functions
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(recordingButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(recordingButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Speech recognition functions
  const startRecording = async () => {
    if (!ExpoSpeechRecognitionModule) {
      Alert.alert(
        'Not Available',
        'Speech recognition is not available. Please ensure you are using a development build.'
      );
      return;
    }

    if (!recognitionAvailable) {
      Alert.alert(
        'Not Available',
        'Speech recognition is not available on this device.'
      );
      return;
    }

    try {
      animateButtonPress();
      setIsProcessing(true);

      const options = {
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
      };

      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for voice notes.'
        );
        setIsProcessing(false);
        return;
      }

      await ExpoSpeechRecognitionModule.start(options);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to start voice recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!ExpoSpeechRecognitionModule) return;
    
    try {
      animateButtonPress();
      await ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const saveVoiceNote = (transcript: string) => {
    if (!transcript.trim()) {
      Alert.alert('Empty Note', 'No speech was detected. Please try again.');
      return;
    }

    const duration = recordingStartTime 
      ? Math.round((Date.now() - recordingStartTime.getTime()) / 1000)
      : undefined;

    const newNote: VoiceNote = {
      id: Date.now().toString(),
      text: transcript.trim(),
      timestamp: new Date(),
      duration,
      edited: false,
    };

    setVoiceNotes(prev => [newNote, ...prev.slice(0, maxNotesDisplayed - 1)]);
    onNoteSaved?.(newNote);
    setCurrentTranscript('');

    Alert.alert(
      'Note Saved',
      'Your voice note has been transcribed and saved successfully.'
    );
  };

  const deleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVoiceNotes(prev => prev.filter(note => note.id !== noteId));
            onNoteDeleted?.(noteId);
          },
        },
      ]
    );
  };

  const startEditingNote = (note: VoiceNote) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  };

  const saveEditedNote = () => {
    if (!editingNoteId || !editText.trim()) return;

    setVoiceNotes(prev =>
      prev.map(note =>
        note.id === editingNoteId
          ? { ...note, text: editText.trim(), edited: true }
          : note
      )
    );
    
    setEditingNoteId(null);
    setEditText('');
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderVoiceNote = (note: VoiceNote) => (
    <View key={note.id} style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <View style={styles.noteTimestamp}>
            <Ionicons name="time-outline" size={14} color={catColors.text.secondary} />
            <Text style={styles.timestampText}>{formatTimestamp(note.timestamp)}</Text>
            {note.duration && (
              <>
                <Ionicons name="mic" size={14} color={catColors.text.secondary} />
                <Text style={styles.durationText}>{formatDuration(note.duration)}</Text>
              </>
            )}
            {note.edited && (
              <View style={styles.editedBadge}>
                <Text style={styles.editedText}>EDITED</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => startEditingNote(note)}
          >
            <Ionicons name="create-outline" size={18} color={catColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => deleteNote(note.id)}
          >
            <Ionicons name="trash-outline" size={18} color={catColors.status.cancelled} />
          </TouchableOpacity>
        </View>
      </View>

      {editingNoteId === note.id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            placeholder="Edit your note..."
            placeholderTextColor={catColors.text.secondary}
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveEditedNote}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.noteText}>{note.text}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Recording Interface */}
      <View style={styles.recordingSection}>
        <Text style={styles.sectionTitle}>Voice Notes</Text>
        <Text style={styles.sectionDescription}>
          Tap and hold to record voice notes. They'll be automatically transcribed.
        </Text>

        <View style={styles.recordingContainer}>
          {isRecording && (
            <View style={styles.recordingStatus}>
              <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="radio-button-on" size={12} color={catColors.status.recording} />
              </Animated.View>
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}

          <Animated.View style={{ transform: [{ scale: recordingButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                !recognitionAvailable && styles.recordButtonDisabled,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isProcessing && !isRecording}
            >
              {isProcessing && !isRecording ? (
                <Ionicons name="hourglass" size={32} color={catColors.text.light} />
              ) : (
                <Ionicons 
                  name={isRecording ? "stop" : "mic"} 
                  size={32} 
                  color={catColors.text.light} 
                />
              )}
            </TouchableOpacity>
          </Animated.View>

          {currentTranscript ? (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptLabel}>Live Transcript:</Text>
              <Text style={styles.transcriptText}>{currentTranscript}</Text>
            </View>
          ) : null}

          {moduleError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={24} color={catColors.status.cancelled} />
              <Text style={styles.errorText}>{moduleError}</Text>
              <Text style={styles.errorSubtext}>
                Make sure you're using a development build and the plugin is configured in app.json
              </Text>
            </View>
          ) : !speechRecognitionAvailable ? (
            <Text style={styles.unavailableText}>
              Speech recognition module not found. Please use a development build.
            </Text>
          ) : !recognitionAvailable ? (
            <Text style={styles.unavailableText}>
              Speech recognition is not available on this device
            </Text>
          ) : null}
        </View>
      </View>

      {/* Notes List */}
      <View style={styles.notesSection}>
        <View style={styles.notesHeader}>
          <Text style={styles.sectionTitle}>
            Recent Notes {voiceNotes.length > 0 && `(${voiceNotes.length})`}
          </Text>
        </View>

        {voiceNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mic-outline" size={48} color={catColors.text.secondary} />
            <Text style={styles.emptyStateTitle}>No Voice Notes</Text>
            <Text style={styles.emptyStateText}>
              Start recording to create your first voice note
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.notesList} showsVerticalScrollIndicator={false}>
            {voiceNotes.map(renderVoiceNote)}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.light,
  },
  recordingSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  recordingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: catColors.status.recording + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingText: {
    fontSize: typography.fontSize.base,
    color: catColors.status.recording,
    fontWeight: '500',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: catColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: catColors.status.recording,
  },
  recordButtonDisabled: {
    backgroundColor: catColors.text.secondary,
    opacity: 0.6,
  },
  transcriptContainer: {
    marginTop: spacing.base,
    padding: spacing.base,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: catColors.primary,
    maxWidth: '90%',
  },
  transcriptLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  transcriptText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    lineHeight: 20,
  },
  unavailableText: {
    fontSize: typography.fontSize.sm,
    color: catColors.status.cancelled,
    textAlign: 'center',
    marginTop: spacing.base,
    fontStyle: 'italic',
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: catColors.status.cancelled + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: catColors.status.cancelled + '30',
    marginTop: spacing.base,
    gap: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: catColors.status.cancelled,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorSubtext: {
    fontSize: typography.fontSize.xs,
    color: catColors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  notesSection: {
    flex: 1,
    padding: spacing.base,
  },
  notesHeader: {
    marginBottom: spacing.base,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing["2xl"],
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    textAlign: 'center',
  },
  notesList: {
    flex: 1,
  },
  noteCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  noteInfo: {
    flex: 1,
  },
  noteTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timestampText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  durationText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  editedBadge: {
    backgroundColor: catColors.status.completed + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editedText: {
    fontSize: typography.fontSize.xs,
    color: catColors.status.completed,
    fontWeight: '600',
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
  },
  noteText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    lineHeight: 22,
  },
  editContainer: {
    gap: spacing.sm,
  },
  editInput: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.light,
    fontWeight: '600',
  },
});

export default VoiceNotesComponent;