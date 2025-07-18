import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Alert as RNAlert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FirestoreService, { TrainingModule } from '@/services/FirestoreService';
import { spacing, typography } from "../../constants/theme";

const TRAINING_MODULE_CACHE_PREFIX = '@TrainingModuleCache:';

// CAT Color Scheme (matching HomeScreen)
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

export default function TrainingHubScreen() {
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingSamples, setCreatingSamples] = useState(false);
  const router = useRouter();

  const fetchTrainingModules = useCallback(async () => {
    try {
      setLoading(true);
      const modules = await FirestoreService.getAll<TrainingModule>(FirestoreService.collections.TRAINING_MODULES, {
        orderByField: 'title',
        orderDirection: 'asc',
      });
      setTrainingModules(modules);

      // Cache fetched modules
      for (const module of modules) {
        await AsyncStorage.setItem(`${TRAINING_MODULE_CACHE_PREFIX}${module.id}`, JSON.stringify(module));
      }

    } catch (e) {
      console.error("Error fetching training modules:", e);
      setError("Failed to load training modules. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingModules();
  }, [fetchTrainingModules]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTrainingModules();
    } catch {
      // Error already handled in fetchTrainingModules
    } finally {
      setRefreshing(false);
    }
  };

  const createSampleTrainingModules = async () => {
    setCreatingSamples(true);
    try {
      const modules = [
        {
          title: "Seatbelt Safety Essentials",
          description: "Learn the critical importance of seatbelt usage and proper fastening techniques.",
          category: "Safety",
          duration: 15,
          difficulty: "beginner",
          requiredCertifications: ["Basic Safety"],
          content: { videoUrl: "https://example.com/seatbelt_safety.mp4" },
          isActive: true,
        },
        {
          title: "Optimizing Fuel Efficiency: Idling Reduction",
          description: "Strategies to minimize unproductive idling time and improve fuel consumption.",
          category: "Efficiency",
          duration: 20,
          difficulty: "intermediate",
          requiredCertifications: ["Eco-Driving"],
          content: { documentUrl: "https://example.com/idling_reduction.pdf" },
          isActive: true,
        },
        {
          title: "Engine Health: Oil Pressure Monitoring",
          description: "Understanding engine oil pressure, its importance, and what to do during low pressure alerts.",
          category: "Maintenance",
          duration: 10,
          difficulty: "beginner",
          requiredCertifications: [],
          content: { videoUrl: "https://example.com/oil_pressure.mp4" },
          isActive: true,
        },
        {
          title: "Braking System Fundamentals",
          description: "A comprehensive guide to heavy machinery braking systems and abnormal pressure indicators.",
          category: "Maintenance",
          duration: 25,
          difficulty: "intermediate",
          requiredCertifications: ["Machine Operation"],
          content: { documentUrl: "https://example.com/braking_systems.pdf" },
          isActive: true,
        },
        {
          title: "Smooth Operation Techniques for Excavators",
          description: "Develop advanced control skills for smoother acceleration, deceleration, and overall machine handling.",
          category: "Operation",
          duration: 30,
          difficulty: "advanced",
          requiredCertifications: ["Advanced Excavator"],
          content: { videoUrl: "https://example.com/smooth_operation.mp4" },
          isActive: true,
        },
        {
          title: "Operating in Extreme Temperatures",
          description: "Best practices for machine operation and monitoring in high ambient temperature environments.",
          category: "Operation",
          duration: 18,
          difficulty: "intermediate",
          requiredCertifications: [],
          content: { documentUrl: "https://example.com/extreme_temp_ops.pdf" },
          isActive: true,
        },
      ];

      const createdIds: string[] = [];
      for (const moduleData of modules) {
        const id = await FirestoreService.createTrainingModule(moduleData);
        createdIds.push(id);
      }
      RNAlert.alert("Success", `Created ${createdIds.length} sample training modules.`);
      fetchTrainingModules(); // Refresh the list
    } catch (e) {
      console.error("Error creating sample training modules:", e);
      RNAlert.alert("Error", "Failed to create sample training modules.");
    } finally {
      setCreatingSamples(false);
    }
  };

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
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const renderModuleItem = ({ item }: { item: TrainingModule }) => (
    <TouchableOpacity
      style={styles.moduleCard}
      onPress={() => router.push({ pathname: "/TrainingModule", params: { trainingModuleId: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleSection}>
          <Text style={styles.moduleTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.moduleCategory} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.moduleDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.moduleInfoSection}>
        <View style={styles.infoItem}>
          <Ionicons name={getCategoryIcon(item.category)} size={16} color={catColors.text.secondary} />
          <Text style={styles.infoText}>{item.category}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={catColors.text.secondary} />
          <Text style={styles.infoText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      {item.requiredCertifications && item.requiredCertifications.length > 0 && (
        <View style={styles.certificationsSection}>
          <Ionicons name="ribbon-outline" size={14} color={catColors.text.secondary} />
          <Text style={styles.certificationsText}>
            Requires: {item.requiredCertifications.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.contentTypeInfo}>
          <Ionicons 
            name={item.content?.videoUrl ? "videocam-outline" : "document-text-outline"} 
            size={16} 
            color={catColors.text.secondary} 
          />
          <Text style={styles.contentTypeText}>
            {item.content?.videoUrl ? "Video" : "Document"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={catColors.text.secondary} />
      </View>
    </TouchableOpacity>
  );

  const getModulesByCategory = () => {
    const categories = ['Safety', 'Maintenance', 'Operation', 'Efficiency'];
    return categories.map(category => ({
      category,
      count: trainingModules.filter(module => module.category === category).length
    }));
  };

  const categoryStats = getModulesByCategory();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={catColors.primary} />
        <Text style={styles.loadingText}>Loading Training Hub...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={catColors.status.cancelled} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTrainingModules}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ready to learn?</Text>
          <Text style={styles.title}>Training Hub</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>📚</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        {categoryStats.map((stat, index) => (
          <React.Fragment key={stat.category}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.category}</Text>
            </View>
            {index < categoryStats.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Training Modules List */}
      {trainingModules.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={48} color={catColors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No Training Modules</Text>
          <Text style={styles.emptyStateText}>
            Get started by creating some sample training modules to explore the features.
          </Text>
          <TouchableOpacity 
            style={[styles.sampleButton, creatingSamples && styles.sampleButtonDisabled]} 
            onPress={createSampleTrainingModules}
            disabled={creatingSamples}
          >
            <Text style={styles.sampleButtonText}>
              {creatingSamples ? "Creating..." : "Create Sample Modules"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trainingModules}
          renderItem={renderModuleItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[catColors.primary]}
              tintColor={catColors.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: catColors.text.primary,
  },
  headerIcon: {
    padding: spacing.sm,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
  },
  headerEmoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: "row",
    padding: spacing.base,
    backgroundColor: catColors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: catColors.border,
  },
  listContainer: {
    padding: spacing.base,
    paddingBottom: spacing["5xl"],
  },
  moduleCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  moduleTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: 2,
  },
  moduleCategory: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
  },
  difficultyText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  moduleDescription: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  moduleInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.base,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginLeft: spacing.xs,
  },
  certificationsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  certificationsText: {
    fontSize: typography.fontSize.xs,
    color: catColors.text.secondary,
    marginLeft: spacing.xs,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contentTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentTypeText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginLeft: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
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
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  sampleButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  sampleButtonDisabled: {
    backgroundColor: catColors.text.secondary,
  },
  sampleButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
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
});