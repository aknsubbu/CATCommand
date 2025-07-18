import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, Alert as RNAlert } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import taskEstimationService from '@/services/taskEstimationService';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TaskPageScreen() {
  const [loadCycles, setLoadCycles] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const handleEstimate = () => {
    const cycles = parseInt(loadCycles, 10);
    if (isNaN(cycles) || cycles <= 0) {
      RNAlert.alert("Invalid Input", "Please enter a valid positive number for load cycles.");
      setEstimatedTime(null);
      return;
    }

    const estimation = taskEstimationService.estimateTimeForLoadCycles(cycles);
    if (estimation !== null) {
      setEstimatedTime(taskEstimationService.formatMinutesToHoursAndMinutes(estimation));
    } else {
      setEstimatedTime("Model not ready. Process historical data first.");
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<IconSymbol size={100} name="hourglass" color="#808080" style={styles.headerImage} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Task Time Estimator</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Enter the number of load cycles you plan to complete to get an estimated time.
        </ThemedText>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter target load cycles"
          value={loadCycles}
          onChangeText={setLoadCycles}
        />
        <Button title="Get Estimation" onPress={handleEstimate} />
      </ThemedView>

      {estimatedTime && (
        <ThemedView style={styles.estimationContainer}>
          <ThemedText type="subtitle">Estimated Completion Time:</ThemedText>
          <ThemedText style={styles.estimationText}>{estimatedTime}</ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    alignSelf: 'center',
    marginTop: 50,
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
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  estimationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  estimationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 10,
  },
});
