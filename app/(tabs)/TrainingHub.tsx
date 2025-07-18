import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert as RNAlert, Button } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FirestoreService, { TrainingModule } from '@/services/FirestoreService';
import { IconSymbol } from '@/components/ui/IconSymbol';

const TRAINING_MODULE_CACHE_PREFIX = '@TrainingModuleCache:';

export default function TrainingHubScreen() {
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
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

  const renderItem = ({ item }: { item: TrainingModule }) => (
    <TouchableOpacity
      style={styles.moduleItem}
      onPress={() => router.push({ pathname: "/TrainingModule", params: { trainingModuleId: item.id } })}
    >
      <ThemedView style={styles.moduleContent}>
        <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
        <ThemedText style={styles.moduleCategory}>Category: {item.category}</ThemedText>
        <ThemedText style={styles.moduleDescription} numberOfLines={2}>{item.description}</ThemedText>
      </ThemedView>
      <IconSymbol name="chevron.right" size={20} color="#888" />
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <ThemedView>
      <ThemedView style={styles.headerImageContainer}>
        <ThemedText style={styles.headerEmoji}>📚</ThemedText>
      </ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Training Hub</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Browse available training modules to enhance your skills.
        </ThemedText>
      </ThemedView>
      {trainingModules.length === 0 && !loading && !error && (
        <ThemedView style={styles.centeredButtonContainer}>
          <ThemedText style={styles.noModulesText}>No training modules available.</ThemedText>
          <Button
            title={creatingSamples ? "Creating..." : "Create Sample Modules"}
            onPress={createSampleTrainingModules}
            disabled={creatingSamples}
          />
        </ThemedView>
      )}
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading Training Hub...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button title="Retry" onPress={fetchTrainingModules} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={trainingModules}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContentContainer}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  headerImageContainer: {
    backgroundColor: "#D0D0D0", // Matches headerBackgroundColor from ParallaxScrollView
    height: 200, // Approximate height of the ParallaxScrollView header
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 100,
    textAlign: 'center',
    lineHeight: 250, // Adjust as needed to center emoji vertically
    color: '#808080',
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  moduleContent: {
    flex: 1,
    marginRight: 16,
  },
  moduleCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
  },
  listContentContainer: {
    paddingBottom: 24,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  centeredButtonContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noModulesText: {
    marginBottom: 10,
  },
});


