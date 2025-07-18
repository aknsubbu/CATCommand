import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert as RNAlert } from 'react-native';
import { useRouter } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FirestoreService, { TrainingModule } from '@/services/FirestoreService';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TrainingHubScreen() {
  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTrainingModules = async () => {
      try {
        const modules = await FirestoreService.getAll<TrainingModule>(FirestoreService.collections.TRAINING_MODULES, {
          orderByField: 'title',
          orderDirection: 'asc',
        });
        setTrainingModules(modules);
      } catch (e) {
        console.error("Error fetching training modules:", e);
        setError("Failed to load training modules. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingModules();
  }, []);

  const renderItem = ({ item }: { item: TrainingModule }) => (
    <TouchableOpacity
      style={styles.moduleItem}
      onPress={() => router.push({ pathname: "/TrainingModule", params: { trainingModuleId: item.id } })}
    >
      <ThemedView style={styles.moduleContent}>
        <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
        <ThemedText style={styles.moduleCategory}>{item.category}</ThemedText>
        <ThemedText style={styles.moduleDescription} numberOfLines={2}>{item.description}</ThemedText>
      </ThemedView>
      <IconSymbol name="chevron.right" size={20} color="#888" />
    </TouchableOpacity>
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
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<ThemedText style={{ fontSize: 100, textAlign: 'center', lineHeight: 250, color: '#808080' }}>📚</ThemedText>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Training Hub</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Browse available training modules to enhance your skills.
        </ThemedText>
      </ThemedView>

      {trainingModules.length === 0 ? (
        <ThemedView style={styles.centered}>
          <ThemedText>No training modules available.</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={trainingModules}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </ParallaxScrollView>
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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
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
});
