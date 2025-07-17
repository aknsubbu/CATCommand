import { Button, StyleSheet, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { startMonitoring, Alert } from "@/services/alertService";

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<(Alert | { message: string, machineId: string, timestamp: string })[]>([]);
  const [monitoring, setMonitoring] = useState(false);

  const handleAlert = useCallback((alert: Alert | { message: string, machineId: string, timestamp: string }) => {
    setAlerts(prevAlerts => [alert, ...prevAlerts]);
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets[0].name.endsWith('.csv')) {
        setAlerts([]);
        setMonitoring(true);
        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        startMonitoring(fileContent, handleAlert);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<ThemedText style={{ fontSize: 100, textAlign: 'center', lineHeight: 250, color: '#808080' }}>🚨</ThemedText>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Alert Monitoring</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Select a CSV file to begin monitoring for alerts.
        </ThemedText>
        <Button title="Select CSV File" onPress={pickDocument} disabled={monitoring} />
      </ThemedView>

      <ScrollView style={styles.logContainer}>
        {alerts.map((alert, index) => (
          <ThemedView key={index} style={styles.logEntry}>
            {'title' in alert ? (
              <ThemedText style={{ color: alert.priority === 'critical' ? 'red' : 'orange' }}>
                <ThemedText type="defaultSemiBold">{alert.title}</ThemedText>
                {alert.message}
              </ThemedText>
            ) : (
              <ThemedText style={{ color: 'green' }}>
                {alert.message} - Machine: {alert.machineId} at {alert.timestamp}
              </ThemedText>
            )}
          </ThemedView>
        ))}
      </ScrollView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  logContainer: {
    maxHeight: 400,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  logEntry: {
    padding: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
