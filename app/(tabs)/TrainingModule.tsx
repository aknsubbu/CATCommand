import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Alert as RNAlert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import FirestoreService, { TrainingModule } from '@/services/FirestoreService';
import { spacing, typography } from "../../constants/theme";

const TRAINING_MODULE_CACHE_PREFIX = '@TrainingModuleCache:';

// CAT Color Scheme (matching other screens)
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
    urgent: "#DC3545",
    high: "#FF6B35",
    medium: "#FFA500",
    low: "#28A745",
  },
  border: "#E0E0E0",
};

const difficultyColors = {
  beginner: catColors.status.low,
  intermediate: catColors.status.medium,
  advanced: catColors.status.urgent,
};

export default function TrainingModuleScreen() {
  const { trainingModuleId } = useLocalSearchParams();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<'not_started' | 'completed' | 'loading'>('not_started');

  const { user } = useAuth();
  const router = useRouter();

  const getDifficultyColor = (difficulty: string) => {
    return difficultyColors[difficulty as keyof typeof difficultyColors] || catColors.status.medium;
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety': return 'shield-checkmark-outline';
      case 'maintenance': return 'construct-outline';
      case 'operation': return 'settings-outline';
      case 'efficiency': return 'flash-outline';
      default: return 'book-outline';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const checkCompletionStatus = async () => {
    if (!user || !user.uid || !module) return;

    try {
      setCompletionStatus('loading');
      const existingTraining = await FirestoreService.getAll<FirestoreService.OperatorTraining>(
        FirestoreService.collections.OPERATOR_TRAINING,
        {
          filters: [
            { field: 'operatorId', operator: '==', value: user.uid },
            { field: 'moduleId', operator: '==', value: module.id },
          ],
          limitCount: 1,
        }
      );

      if (existingTraining.length > 0 && existingTraining[0].status === 'completed') {
        setCompletionStatus('completed');
      } else {
        setCompletionStatus('not_started');
      }
    } catch (e) {
      console.error("Error checking completion status:", e);
      setCompletionStatus('not_started');
    }
  };

  const markTrainingAsComplete = async () => {
    if (!user || !user.uid) {
      RNAlert.alert("Error", "You must be logged in to mark training as complete.");
      return;
    }
    if (!module) {
      RNAlert.alert("Error", "Training module data not available.");
      return;
    }

    setMarkingComplete(true);
    try {
      // Check if an OperatorTraining record already exists for this user and module
      const existingTraining = await FirestoreService.getAll<FirestoreService.OperatorTraining>(
        FirestoreService.collections.OPERATOR_TRAINING,
        {
          filters: [
            { field: 'operatorId', operator: '==', value: user.uid },
            { field: 'moduleId', operator: '==', value: module.id },
          ],
          limitCount: 1,
        }
      );

      if (existingTraining.length > 0) {
        // Update existing record
        await FirestoreService.update(
          FirestoreService.collections.OPERATOR_TRAINING,
          existingTraining[0].id,
          {
            status: 'completed',
            completionDate: FirestoreService.getServerTimestamp(),
            attempts: existingTraining[0].attempts + 1, // Increment attempts on re-completion
          }
        );
      } else {
        // Create new record
        await FirestoreService.createOperatorTraining({
          operatorId: user.uid,
          moduleId: module.id,
          status: 'completed',
          startDate: FirestoreService.getServerTimestamp(),
          completionDate: FirestoreService.getServerTimestamp(),
          attempts: 1,
        });
      }
      
      setCompletionStatus('completed');
      RNAlert.alert("Success", `'${module.title}' marked as complete!`);
    } catch (e) {
      console.error("Error marking training as complete:", e);
      RNAlert.alert("Error", "Failed to mark training as complete. Please try again.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleContentAccess = async (url: string, type: 'video' | 'document') => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        RNAlert.alert("Error", `Cannot open ${type}. Please check the URL.`);
      }
    } catch (error) {
      RNAlert.alert("Error", `Failed to open ${type}.`);
    }
  };

  useEffect(() => {
    const fetchModule = async () => {
      if (!trainingModuleId || typeof trainingModuleId !== 'string') {
        console.log("TrainingModuleScreen: Invalid trainingModuleId received:", trainingModuleId);
        setError('Invalid Training Module ID.');
        setLoading(false);
        return;
      }

      try {
        console.log("TrainingModuleScreen: Attempting to load module with ID:", trainingModuleId);
        const cachedModuleJson = await AsyncStorage.getItem(`${TRAINING_MODULE_CACHE_PREFIX}${trainingModuleId}`);
        if (cachedModuleJson) {
          const parsedModule = JSON.parse(cachedModuleJson);
          console.log("TrainingModuleScreen: Module loaded from cache:", parsedModule.title);
          setModule(parsedModule);
        } else {
          console.log("TrainingModuleScreen: Module not found in cache for ID:", trainingModuleId);
          setError('Training module not found in cache. Please connect to the internet to sync.');
        }
      } catch (e) {
        setError('Failed to load training module from cache.');
        console.error('Error loading training module from cache:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [trainingModuleId]);

  useEffect(() => {
    if (module && user) {
      checkCompletionStatus();
    }
  }, [module, user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={catColors.primary} />
        <Text style={styles.loadingText}>Loading Training Module...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={catColors.status.cancelled} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!module) {
    return (
      <View style={styles.centered}>
        <Ionicons name="document-outline" size={48} color={catColors.text.secondary} />
        <Text style={styles.errorTitle}>Module Not Found</Text>
        <Text style={styles.errorText}>No training module data available.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={catColors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerCategory}>{module.category}</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>{module.title}</Text>
        </View>
        <View style={styles.completionIndicator}>
          {completionStatus === 'loading' ? (
            <ActivityIndicator size="small" color={catColors.primary} />
          ) : completionStatus === 'completed' ? (
            <Ionicons name="checkmark-circle" size={24} color={catColors.status.completed} />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color={catColors.text.secondary} />
          )}
        </View>
      </View>

      {/* Module Info Cards */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name={getCategoryIcon(module.category)} size={20} color={catColors.primary} />
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{module.category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={catColors.primary} />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{formatDuration(module.duration)}</Text>
            </View>
          </View>
          <View style={styles.difficultyContainer}>
            <Text style={styles.infoLabel}>Difficulty Level</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(module.difficulty) }]}>
              <Text style={styles.difficultyText}>{module.difficulty.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{module.description}</Text>
      </View>

      {/* Required Certifications */}
      {module.requiredCertifications && module.requiredCertifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prerequisites</Text>
          <View style={styles.certificationsContainer}>
            <Ionicons name="ribbon-outline" size={20} color={catColors.primary} />
            <Text style={styles.certificationsText}>
              Required Certifications: {module.requiredCertifications.join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* Content Access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training Content</Text>
        
        {module.content.videoUrl && (
          <TouchableOpacity 
            style={styles.contentCard}
            onPress={() => handleContentAccess(module.content.videoUrl!, 'video')}
          >
            <View style={styles.contentIcon}>
              <Ionicons name="play-circle" size={32} color={catColors.primary} />
            </View>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>Video Training</Text>
              <Text style={styles.contentDescription}>Watch the training video to learn the concepts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={catColors.text.secondary} />
          </TouchableOpacity>
        )}

        {module.content.documentUrl && (
          <TouchableOpacity 
            style={styles.contentCard}
            onPress={() => handleContentAccess(module.content.documentUrl!, 'document')}
          >
            <View style={styles.contentIcon}>
              <Ionicons name="document-text" size={32} color={catColors.primary} />
            </View>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>Reading Material</Text>
              <Text style={styles.contentDescription}>Access the training document and resources</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={catColors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Completion Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons 
              name={completionStatus === 'completed' ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={completionStatus === 'completed' ? catColors.status.completed : catColors.text.secondary} 
            />
            <Text style={[
              styles.progressStatus,
              { color: completionStatus === 'completed' ? catColors.status.completed : catColors.text.secondary }
            ]}>
              {completionStatus === 'completed' ? 'Completed' : 'Not Started'}
            </Text>
          </View>
          
          {completionStatus === 'completed' ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.retakeButton]}
              onPress={markTrainingAsComplete}
              disabled={markingComplete}
            >
              <Ionicons name="refresh" size={20} color={catColors.primary} />
              <Text style={styles.retakeButtonText}>
                {markingComplete ? "Processing..." : "Retake Training"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={markTrainingAsComplete}
              disabled={markingComplete}
            >
              <Ionicons name="checkmark" size={20} color={catColors.text.light} />
              <Text style={styles.completeButtonText}>
                {markingComplete ? "Marking Complete..." : "Mark as Complete"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.light,
    paddingTop:spacing["xl"]
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    marginTop: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    paddingTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
    backgroundColor: catColors.background.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerCategory: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    lineHeight: 24,
  },
  completionIndicator: {
    padding: spacing.xs,
  },
  infoContainer: {
    padding: spacing.base,
  },
  infoCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  difficultyContainer: {
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  difficultyText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  section: {
    padding: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.base,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 24,
  },
  certificationsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: catColors.background.gray,
    padding: spacing.base,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: catColors.primary,
  },
  certificationsText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  contentIcon: {
    marginRight: spacing.base,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: 2,
  },
  contentDescription: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  progressCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  progressStatus: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.sm,
  },
  completeButton: {
    backgroundColor: catColors.primary,
  },
  completeButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  retakeButton: {
    backgroundColor: catColors.background.gray,
    borderWidth: 1,
    borderColor: catColors.primary,
  },
  retakeButtonText: {
    color: catColors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  bottomPadding: {
    height: spacing["5xl"],
  },
});