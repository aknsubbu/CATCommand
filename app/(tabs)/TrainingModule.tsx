import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Alert as RNAlert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import FirestoreService, { TrainingModule } from '@/services/FirestoreService';
import { useAuth } from '@/contexts/AuthContext';

const TRAINING_MODULE_CACHE_PREFIX = '@TrainingModuleCache:';

export default function TrainingModuleScreen() {
  const { trainingModuleId } = useLocalSearchParams();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);

  const { user } = useAuth();

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
      RNAlert.alert("Success", `'${module.title}' marked as complete!`);
    } catch (e) {
      console.error("Error marking training as complete:", e);
      RNAlert.alert("Error", "Failed to mark training as complete. Please try again.");
    } finally {
      setMarkingComplete(false);
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

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading Training Module...</ThemedText>
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

  if (!module) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No training module data available.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title">{module.title}</ThemedText>
        <ThemedText type="subtitle">Category: {module.category}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.contentContainer}>
        <ThemedText style={styles.description}>{module.description}</ThemedText>
        
        <View style={styles.detailsContainer}>
          <ThemedText><ThemedText type="defaultSemiBold">Difficulty:</ThemedText> {module.difficulty}</ThemedText>
          <ThemedText><ThemedText type="defaultSemiBold">Duration:</ThemedText> {module.duration} minutes</ThemedText>
        </View>

        {module.content.videoUrl && (
          <View style={styles.videoContainer}>
            <ThemedText style={styles.contentHeader}>Video Content</ThemedText>
            {/* In a real app, you would use a video player component here */}
            <ThemedText>Video URL: {module.content.videoUrl}</ThemedText>
          </View>
        )}

        {module.content.documentUrl && (
          <View style={styles.documentContainer}>
            <ThemedText style={styles.contentHeader}>Reading Material</ThemedText>
            {/* In a real app, you would use a webview or document viewer */}
            <ThemedText>Document URL: {module.content.documentUrl}</ThemedText>
          </View>
        )}

        <Button
          title={markingComplete ? "Marking Complete..." : "Mark as Complete"}
          onPress={markTrainingAsComplete}
          disabled={markingComplete}
        />
      </ThemedView>
    </ScrollView>
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
  headerContainer: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contentContainer: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  contentHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  videoContainer: {
    marginBottom: 24,
  },
  documentContainer: {
    marginBottom: 24,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
